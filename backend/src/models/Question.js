const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: false
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  source: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    required: [true, 'Question text is required']
  },
  type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'math', 'programming'],
    default: 'short_answer'
  },
  category: {
    type: String,
    enum: ['exam', 'practice', 'homework'],
    default: 'exam'
  },
  marks: {
    type: Number,
    required: [true, 'Marks for question is required'],
    min: 0
  },
  options: [
    {
      _id: false,
      text: String,
      isCorrect: Boolean
    }
  ],
  rubric: {
    keywords: [String],
    answerKey: String,
    method: {
      type: String,
      enum: ['exact', 'keyword', 'semantic', 'math', 'programming'],
      default: 'keyword'
    },
    sampleAnswers: [String],
    testCases: [{
      input: String,
      expectedOutput: String,
      weight: {
        type: Number,
        default: 1
      }
    }]
  },
  unit: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
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

// Index for finding questions by exam
questionSchema.index({ examId: 1, order: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
