const Result = require('../models/Result');
const Answer = require('../models/Answer');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const AIValidationService = require('../services/aiValidationService');
const pythonClient = require('../services/pythonClient');

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
    const { timeTakenSeconds, malpractice } = req.body || {};

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
        status: 'pending',
        timeTakenSeconds: typeof timeTakenSeconds === 'number' ? timeTakenSeconds : null,
        malpractice: malpractice || { violations: 0, flags: [] }
      });

      await result.save();
      logger.info(`Result initialized - Student: ${studentId}, Exam: ${examId}`);
      
      // Trigger evaluation immediately
      this.evaluateAndStoreResult(examId, studentId).catch(err => {
        logger.error(`Async evaluation failed for student ${studentId}: ${err.message}`);
      });

    } else {
      if (typeof timeTakenSeconds === 'number') {
        result.timeTakenSeconds = timeTakenSeconds;
      }
      if (malpractice) {
        result.malpractice = malpractice;
      }
      await result.save();
    }

    res.json({
      message: 'Result initialized and evaluation started',
      result: result.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Helper to handle the evaluation flow
exports.evaluateAndStoreResult = async (examId, studentId) => {
  try {
    const result = await Result.findOne({ examId, studentId }).populate('answers.questionId');
    if (!result) return;

    const evaluationRequests = result.answers.map(ans => ({
      answer: ans.studentAnswer || '',
      question: ans.questionId.text,
      question_type: ans.questionId.type,
      rubric: {
        keywords: ans.questionId.rubric?.keywords || [],
        answerKey: ans.questionId.rubric?.answerKey || '',
        method: ans.questionId.rubric?.method || 'keyword',
        sampleAnswers: ans.questionId.rubric?.sampleAnswers || [],
        testCases: ans.questionId.rubric?.testCases || []
      }
    }));

    const response = await pythonClient.batchEvaluate(evaluationRequests, examId);
    
    // Update results
    let totalScore = 0;
    let totalMarks = 0;

    result.answers.forEach((ans, idx) => {
      const evalData = response.results[idx];
      if (evalData) {
        // Scaled score: evalData.score (0-1) * ans.maxScore
        ans.score = Math.round(evalData.score * ans.maxScore * 100) / 100;
        ans.feedback = evalData.feedback;
        ans.evaluationMethod = evalData.evaluationMethod;
        ans.confidence = evalData.confidence;
      }
      totalScore += ans.score;
      totalMarks += ans.maxScore;
    });

    result.totalScore = totalScore;
    result.totalMarks = totalMarks;
    result.percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    result.status = 'evaluated';
    result.gradedAt = new Date();

    await result.save();
    logger.info(`Result fully evaluated for student ${studentId} exam ${examId}`);
  } catch (error) {
    logger.error(`Error in evaluateAndStoreResult: ${error.message}`);
    throw error;
  }
};

// Detailed report for students or teachers
exports.getResultReport = async (req, res) => {
  try {
    const { examId, studentId: targetStudentId } = req.params;
    const requesterId = req.user.userId;
    const requesterRole = req.user.role;

    let studentId = requesterId;

    if (targetStudentId) {
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new AppError('Exam not found', 404);
      }
      const isTeacher = exam.createdBy.toString() === requesterId;
      const isAdmin = requesterRole === 'admin';
      if (!isTeacher && !isAdmin) {
        throw new AppError('Not authorized', 403);
      }
      studentId = targetStudentId;
    }

    const result = await Result.findOne({ examId, studentId })
      .populate('examId', 'title totalMarks subject')
      .populate('studentId', 'name email')
      .populate('answers.questionId', 'text marks type rubric options unit topic');

    if (!result) {
      throw new AppError('Result not found', 404);
    }

    const perQuestion = result.answers.map(ans => {
      const question = ans.questionId || {};
      const maxScore = ans.maxScore || question.marks || 0;
      const score = ans.score || 0;
      let status = 'Incorrect';
      if (score >= maxScore && maxScore > 0) status = 'Correct';
      else if (score > 0) status = 'Partial';

      const expectedAnswer = (() => {
        if (question.type === 'mcq') {
          return (question.options || [])
            .filter(o => o.isCorrect)
            .map(o => o.text);
        }
        return question.rubric?.answerKey || question.rubric?.sampleAnswers || [];
      })();

      return {
        questionId: question._id,
        questionText: question.text,
        type: question.type,
        unit: question.unit || 'Uncategorized',
        topic: question.topic || 'General',
        submittedAnswer: ans.studentAnswer || '',
        expectedAnswer,
        score,
        maxScore,
        status,
        evaluationMethod: ans.evaluationMethod || 'pending',
        confidence: ans.confidence || 0,
        feedback: ans.feedback || '',
        testCases: question.rubric?.testCases || []
      };
    });

    const breakdown = {};
    perQuestion.forEach(q => {
      const key = `${q.unit} :: ${q.topic}`;
      if (!breakdown[key]) {
        breakdown[key] = { unit: q.unit, topic: q.topic, score: 0, maxScore: 0 };
      }
      breakdown[key].score += q.score;
      breakdown[key].maxScore += q.maxScore;
    });

    res.json({
      exam: result.examId,
      student: result.studentId,
      submittedAt: result.submittedAt,
      gradedAt: result.gradedAt,
      totalScore: result.totalScore,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      timeTakenSeconds: result.timeTakenSeconds,
      malpractice: result.malpractice || { violations: 0, flags: [] },
      perQuestion,
      breakdown: Object.values(breakdown)
    });
  } catch (error) {
    throw error;
  }
};

// Update result with evaluation scores
exports.updateResultScores = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers: evaluatedAnswers } = req.body; 

    const studentId = req.user.userId;

    const result = await Result.findOne({ examId, studentId });
    if (!result) {
      throw new AppError('Result not found', 404);
    }

    let totalScore = 0;
    let totalMarks = 0;
    const validationResults = [];

    for (const ans of result.answers) {
      const evaluated = evaluatedAnswers.find(
        e => e.questionId === ans.questionId.toString()
      );

      if (evaluated) {
        // Fix: Scale the score from 0-1 range to absolute marks
        ans.score = Math.round(evaluated.score * ans.maxScore * 100) / 100;
        ans.feedback = evaluated.feedback;
        ans.evaluationMethod = evaluated.evaluationMethod || 'ai';
        ans.confidence = evaluated.confidence || 0.5;

        try {
          const validation = await AIValidationService.validateEvaluation(evaluated, evaluated.rubric || {});
          ans.validationData = {
            validated: validation.validated,
            validationTimestamp: new Date(),
            validationMethod: validation.validationMethod,
            validationScore: validation.validationScore,
            discrepancy: validation.discrepancy
          };

          if (!validation.validated) {
            ans.confidence = Math.max(0.1, ans.confidence * 0.8);
            ans.feedback = validation.feedback;
          }

          validationResults.push(validation);
        } catch (validationError) {
          logger.warn(`Validation failed for question ${ans.questionId}: ${validationError.message}`);
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

// Teacher - View aggregate Student Progress
exports.getStudentProgress = async (req, res) => {
  try {
    // For simplicity, showing progress for 'student' roles
    const User = require('../models/User');
    const students = await User.find({ role: 'student' }).select('name email');
    
    // Get all results
    const results = await Result.find().populate('examId', 'title');
    
    const progressData = students.map(student => {
      const studentResults = results.filter(r => r.studentId.toString() === student._id.toString());
      const examsTaken = studentResults.length;
      let totalPercentage = 0;
      studentResults.forEach(r => totalPercentage += r.percentage);
      const averageScore = examsTaken > 0 ? (totalPercentage / examsTaken).toFixed(1) : 0;
      
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        examsTaken,
        averageScore,
        lastActive: studentResults.length > 0 ? new Date(Math.max(...studentResults.map(e => new Date(e.submittedAt)))).toLocaleDateString() : 'Never'
      };
    });

    res.json({ success: true, progress: progressData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
