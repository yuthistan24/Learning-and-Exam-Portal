const mongoose = require('mongoose');
const Question = require('./src/models/Question');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';

async function seedPracticeQuestions() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Find an admin or any user to be the creator
    let creator = await User.findOne({ role: 'admin' });
    if (!creator) creator = await User.findOne();
    if (!creator) {
        console.error('No users found. Please register a user first.');
        process.exit(1);
    }

    // Create a dummy exam to host these practice questions
    let dummyExam = await Exam.findOne({ title: 'Practice Bank' });
    if (!dummyExam) {
      dummyExam = await Exam.create({
        title: 'Practice Bank',
        description: 'Internal bank for practice questions',
        duration: 10,
        totalMarks: 0,
        status: 'draft',
        createdBy: creator._id
      });
    }

    const practiceQuestions = [
      {
        text: 'What are variables in C, and how do you declare them?',
        type: 'short_answer',
        marks: 2,
        topic: 'Variables',
        examId: dummyExam._id,
        rubric: { answerKey: 'Variables are containers for storing data values. Declared as: data_type variable_name;', method: 'keyword' }
      },
      {
        text: 'Explain the difference between a for loop and a while loop in C.',
        type: 'long_answer',
        marks: 5,
        topic: 'Loops',
        examId: dummyExam._id,
        rubric: { answerKey: 'For loop is entry-controlled. While loop is also entry-controlled but used when number of iterations is not known.', method: 'keyword' }
      },
      {
        text: 'Implement a function to find the factorial of a number using recursion in C.',
        type: 'programming',
        marks: 10,
        topic: 'Recursion',
        examId: dummyExam._id,
        rubric: { 
          answerKey: 'int fact(int n) { if(n<=1) return 1; return n*fact(n-1); }', 
          method: 'programming',
          testCases: [
            { input: '5', expectedOutput: '120' },
            { input: '0', expectedOutput: '1' }
          ]
        }
      },
      {
        text: 'What is Encapsulation in C++?',
        type: 'short_answer',
        marks: 3,
        topic: 'Encapsulation',
        examId: dummyExam._id,
        rubric: { answerKey: 'Wrapping up of data and functions into a single unit called class.', method: 'keyword' }
      },
      {
        text: 'Define a Linked List and its advantages over Arrays.',
        type: 'long_answer',
        marks: 5,
        topic: 'Linked Lists',
        examId: dummyExam._id,
        rubric: { answerKey: 'Linear data structure where elements are connected by pointers. Dynamic size, easy insertion/deletion.', method: 'keyword' }
      },
      {
        text: 'What are ACID properties in DBMS?',
        type: 'short_answer',
        marks: 4,
        topic: 'ACID properties',
        examId: dummyExam._id,
        rubric: { answerKey: 'Atomicity, Consistency, Isolation, Durability.', method: 'keyword' }
      }
    ];

    await Question.insertMany(practiceQuestions);
    console.log('Practice Questions Seeded!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedPracticeQuestions();
