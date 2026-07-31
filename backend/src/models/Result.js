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
    questionId:       mongoose.Schema.Types.ObjectId,
    studentAnswer:    String,
    score:            { type: Number, default: 0 },
    maxScore:         { type: Number, default: 0 },
    feedback:         { type: String, default: '' },
    evaluationMethod: {
      type: String,
      enum: [
        'ai', 'keyword', 'exact', 'exact_mcq', 'semantic',
        'programming', 'programming+ollama',
        'sympy+ollama_math', 'keyword+ollama_general',
        'keyword+ollama_science', 'semantic+ollama_english',
        'ollama_coding', 'ollama_math', 'ollama_general',
        'teacher_override', 'manual', 'pending', 'evaluation_failed',
      ],
      default: 'pending'
    },
    confidence:       { type: Number, min: 0, max: 1, default: 0 },
    // AI metadata fields
    modelUsed:        { type: String, default: 'none' },
    subjectEvaluated: { type: String, default: 'general' },
    testResults:      { type: Array,  default: [] },
  }],
  totalScore:       { type: Number, default: 0 },
  totalMarks:       { type: Number, default: 0 },
  percentage:       { type: Number, min: 0, max: 100, default: 0 },
  timeTakenSeconds: { type: Number, default: null },
  malpractice: {
    violations: { type: Number, default: 0 },
    flags: [{
      reason:    String,
      timestamp: Date
    }]
  },
  gradedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  submittedAt:  { type: Date, required: true },
  gradedAt:     { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'reviewed', 'evaluation_failed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Composite indexes
resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
resultSchema.index({ studentId: 1, gradedAt: -1 });
resultSchema.index({ examId: 1, status: 1 });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;
