const Question = require('../models/Question');
const Exam = require('../models/Exam');
const QuestionBank = require('../models/QuestionBank');
const Course = require('../models/Course');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Add question to exam
exports.addQuestion = async (req, res) => {
  try {
    const { text, type, marks, options, rubric } = req.body;
    const { examId } = req.params;

    // Validate exam exists and user is creator
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Validate input
    if (!text || !type || !marks) {
      throw new AppError('Text, type, and marks are required', 400);
    }

    // Validate question type
    const validTypes = ['mcq', 'short_answer', 'long_answer', 'math'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    // For MCQ, validate options
    if (type === 'mcq') {
      if (!options || !Array.isArray(options) || options.length < 2) {
        throw new AppError('MCQ must have at least 2 options', 400);
      }
      const hasCorrect = options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        throw new AppError('MCQ must have at least one correct option', 400);
      }
    }

    // Get next order
    const lastQuestion = await Question.findOne({ examId }).sort({ order: -1 });
    const order = lastQuestion ? lastQuestion.order + 1 : 0;

    const question = new Question({
      examId,
      text,
      type,
      marks,
      options: type === 'mcq' ? options : [],
      rubric: rubric || {
        keywords: [],
        answerKey: '',
        method: 'keyword'
      },
      order
    });

    await question.save();

    // Add question to exam's questionIds
    if (!exam.questionIds.includes(question._id)) {
      exam.questionIds.push(question._id);
      await exam.save();
    }

    logger.info(`Question added to exam ${examId}: ${question._id}`);

    res.status(201).json({
      message: 'Question added successfully',
      question: question.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Get all questions for an exam
exports.getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({ examId: req.params.examId })
      .sort({ order: 1 });

    res.json(questions);
  } catch (error) {
    throw error;
  }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    res.json(question.toObject());
  } catch (error) {
    throw error;
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Check authorization
    const exam = await Exam.findById(question.examId);
    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Update allowed fields
    const { text, marks, options, rubric } = req.body;
    if (text) question.text = text;
    if (marks) question.marks = marks;
    if (options && question.type === 'mcq') question.options = options;
    if (rubric) question.rubric = { ...question.rubric, ...rubric };

    await question.save();

    logger.info(`Question updated: ${question._id}`);

    res.json({
      message: 'Question updated successfully',
      question: question.toObject()
    });
  } catch (error) {
    throw error;
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Check authorization
    const exam = await Exam.findById(question.examId);
    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Remove from exam
    exam.questionIds = exam.questionIds.filter(id => id.toString() !== question._id.toString());
    await exam.save();

    await Question.findByIdAndDelete(req.params.questionId);

    logger.info(`Question deleted: ${question._id}`);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    throw error;
  }
};

// Bulk add questions to exam
exports.bulkAddQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('questions must be a non-empty array', 400);
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    if (exam.createdBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized', 403);
    }

    const createdQuestions = [];

    for (const qData of questions) {
      const lastQuestion = await Question.findOne({ examId }).sort({ order: -1 });
      const order = lastQuestion ? lastQuestion.order + 1 : 0;

      const question = new Question({
        examId,
        ...qData,
        order
      });

      await question.save();
      createdQuestions.push(question);
    }

    // Update exam questionIds
    exam.questionIds.push(...createdQuestions.map(q => q._id));
    await exam.save();

    logger.info(`Bulk added ${createdQuestions.length} questions to exam ${examId}`);

    res.json({
      message: `${createdQuestions.length} questions added successfully`,
      questions: createdQuestions
    });
  } catch (error) {
    throw error;
  }
};

// Reorder questions

exports.reorderQuestions = async (req, res) => {
  try {
    const { questionOrder } = req.body; // Array of { questionId, order }

    if (!Array.isArray(questionOrder)) {
      throw new AppError('questionOrder must be an array', 400);
    }

    // Update order for each question
    for (const item of questionOrder) {
      await Question.findByIdAndUpdate(
        item.questionId,
        { order: item.order },
        { new: true }
      );
    }

    logger.info('Questions reordered');

    res.json({ message: 'Questions reordered successfully' });
  } catch (error) {
    throw error;
  }
};
