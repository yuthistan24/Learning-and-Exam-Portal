const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1
  },
  category: {
    type: String,
    enum: ['Analytical', 'Design using Hardware', 'Simulation using Coding', 'Concept', 'Online course', 'Others'],
    default: 'Analytical'
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1
  },
  units: [{
    number: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    topics: [String],
    marks: {
      type: Number,
      default: 0
    }
  }],
  learningOutcomes: [String],
  textBooks: [{
    title: String,
    author: String,
    edition: String,
    publisher: String
  }],
  references: [String],
  exercises: [String],
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'deprecated'],
    default: 'active'
  },
  topics: [{
    name: String,
    subtopics: [String],
    weightage: {
      type: Number,
      default: 0
    }
  }],
  difficultyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  }
}, { timestamps: true });

// Index for finding courses by semester
courseSchema.index({ semester: 1 });
// Index for finding courses by code
courseSchema.index({ code: 1 });
// Index for course status
courseSchema.index({ status: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
