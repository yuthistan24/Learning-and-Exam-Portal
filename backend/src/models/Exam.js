const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required']
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration (in minutes) is required'],
    min: 1
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: 0
  },
  questionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  instructions: {
    type: String,
    default: ''
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showFeedback: {
    type: Boolean,
    default: true
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

// Index for teacher exams
examSchema.index({ createdBy: 1, status: 1 });
// Index for finding student exams
examSchema.index({ enrolledStudents: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
