const Result = require('../models/Result');
const Answer = require('../models/Answer');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const AIValidationService = require('../services/aiValidationService');

// Get result for student
exports.getStudentResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.userId;

    const result = await Result.findOne({ examId, studentId })
      .populate('examId', 'title totalMarks')
      .populate('answers.questionId', 'text marks');

    if (!result) {
      throw new AppError('Result not found', 404);
    }

    res.json(result.toObject());
  } catch (error) {
    throw error;
  }
};

// Get results for exam (teacher)
exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify authorization
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    const results = await Result.find({ examId })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    throw error;
  }
};

// Create/Initialize result (called after exam submission)
exports.initializeResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.userId;

    // Check if result already exists
    let result = await Result.findOne({ examId, studentId });

    if (result && result.status !== 'pending') {
      throw new AppError('Result already graded', 400);
    }

    // Get student answers
    const answers = await Answer.find({ examId, studentId })
      .populate('questionId');

    if (answers.length === 0) {
      throw new AppError('No answers found', 404);
    }

    // Create result template
    if (!result) {
      result = new Result({
        examId,
        studentId,
        answers: answers.map(ans => ({
          questionId: ans.questionId._id,
          studentAnswer: ans.answerText,
          score: 0,
          maxScore: ans.questionId.marks,
          feedback: 'Pending evaluation',
          evaluationMethod: 'pending',
          confidence: 0
        })),
        submittedAt: new Date(),
        status: 'pending'
      });

      await result.save();
      logger.info(`Result initialized - Student: ${studentId}, Exam: ${examId}`);
    }

    res.json({
      message: 'Result initialized',
      result: result.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Update result with evaluation scores
exports.updateResultScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers: evaluatedAnswers } = req.body; // Array of { questionId, score, feedback, confidence }

    // This should be called by evaluation service
    const studentId = req.user.userId;

    const result = await Result.findOne({ examId, studentId });
    if (!result) {
      throw new AppError('Result not found', 404);
    }

    // Update answer scores and validate
    let totalScore = 0;
    let totalMarks = 0;
    const validationResults = [];

    for (const ans of result.answers) {
      const evaluated = evaluatedAnswers.find(
        e => e.questionId === ans.questionId.toString()
      );

      if (evaluated) {
        ans.score = evaluated.score;
        ans.feedback = evaluated.feedback;
        ans.evaluationMethod = evaluated.evaluationMethod || 'ai';
        ans.confidence = evaluated.confidence || 0.5;

        // Run AI validation on the evaluation
        try {
          const validation = await AIValidationService.validateEvaluation(evaluated, evaluated.rubric || {});
          ans.validationData = {
            validated: validation.validated,
            validationTimestamp: new Date(),
            validationMethod: validation.validationMethod,
            validationScore: validation.validationScore,
            discrepancy: validation.discrepancy
          };

          // If validation failed, adjust confidence
          if (!validation.validated) {
            ans.confidence = Math.max(0.1, ans.confidence * 0.8);
            ans.feedback = validation.feedback;
          }

          validationResults.push(validation);
        } catch (validationError) {
          logger.warn(`Validation failed for question ${ans.questionId}: ${validationError.message}`);
          ans.validationData = {
            validated: false,
            validationTimestamp: new Date(),
            validationMethod: 'fallback',
            validationScore: null,
            discrepancy: 0
          };
        }
      }

      totalScore += ans.score;
      totalMarks += ans.maxScore;
    }

    result.totalScore = totalScore;
    result.totalMarks = totalMarks;
    result.percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    result.status = 'evaluated';
    result.gradedAt = new Date();

    await result.save();

    logger.info(`Result updated - Student: ${studentId}, Score: ${totalScore}/${totalMarks}`);

    const validationStats = AIValidationService.getValidationStats(validationResults);

    res.json({
      message: 'Result updated with validation',
      result: result.toObject(),
      validation: validationStats
    });
  } catch (error) {
    throw error;
  }
};

// Get all results for student
exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const results = await Result.find({ studentId })
      .populate('examId', 'title totalMarks')
      .sort({ gradedAt: -1 });

    res.json(results);
  } catch (error) {
    throw error;
  }
};
