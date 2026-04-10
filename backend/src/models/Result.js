const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    _id: false,
    questionId: mongoose.Schema.Types.ObjectId,
    studentAnswer: String,
    score: Number,
    maxScore: Number,
    feedback: String,
    evaluationMethod: {
      type: String,
      enum: ['ai', 'keyword', 'exact', 'manual', 'pending'],
      default: 'keyword'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    validationData: {
      validated: { type: Boolean, default: false },
      validationTimestamp: { type: Date, default: null },
      validationMethod: { type: String, default: null },
      validationScore: { type: Number, default: null },
      discrepancy: { type: Number, default: 0 }
    }
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submittedAt: {
    type: Date,
    required: true
  },
  gradedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'reviewed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Composite index for finding results
resultSchema.index({ examId: 1, studentId: 1 });
resultSchema.index({ studentId: 1, gradedAt: -1 });

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
