const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answerText: {
    type: String,
    required: [true, 'Answer text is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Composite index for finding specific student answers
answerSchema.index({ examId: 1, studentId: 1 });
answerSchema.index({ questionId: 1, studentId: 1 });

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;
