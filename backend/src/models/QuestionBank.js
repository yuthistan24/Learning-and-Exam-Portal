const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Question bank name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  courseCode: {
    type: String,
    default: null
  },
  courseTitle: {
    type: String,
    default: null
  },
  subject: {
    type: String,
    enum: ['Programming', 'Mathematics', 'Physics', 'English', 'CS Theory', 'Others'],
    default: 'CS Theory'
  },
  questionCount: {
    type: Number,
    default: 0
  },
  fileUrl: {
    type: String,
    default: null
  },
  pdfName: {
    type: String,
    default: null
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isPublished: {
    type: Boolean,
    default: false
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

questionBankSchema.index({ courseCode: 1, isPublished: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);

module.exports = QuestionBank;
