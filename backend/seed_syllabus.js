const mongoose = require('mongoose');
const Course = require('./src/models/Course');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';

const cseSyllabus = [
  {
    code: 'CS101',
    title: 'Computer Programming (C)',
    description: 'Fundamentals of programming using C language.',
    credits: 4,
    semester: 1,
    category: 'Simulation using Coding',
    totalMarks: 100,
    units: [
      { number: 1, title: 'Introduction to C', topics: ['Variables', 'Data Types', 'Operators'], marks: 20 },
      { number: 2, title: 'Control Structures', topics: ['If-Else', 'Switch', 'Loops'], marks: 20 },
      { number: 3, title: 'Functions & Arrays', topics: ['Function declaration', '1D/2D Arrays', 'Recursion'], marks: 20 }
    ]
  },
  {
    code: 'CS201',
    title: 'Object Oriented Programming (C++)',
    description: 'Principles of OOP using C++.',
    credits: 4,
    semester: 2,
    category: 'Simulation using Coding',
    totalMarks: 100,
    units: [
      { number: 1, title: 'Classes & Objects', topics: ['Encapsulation', 'Constructors', 'Destructors'], marks: 20 },
      { number: 2, title: 'Inheritance & Polymorphism', topics: ['Virtual Functions', 'Friend Class', 'Overloading'], marks: 20 }
    ]
  },
  {
    code: 'CS301',
    title: 'Data Structures',
    description: 'Fundamental data structures and their implementations.',
    credits: 4,
    semester: 3,
    category: 'Analytical',
    totalMarks: 100,
    units: [
      { number: 1, title: 'Linear Data Structures', topics: ['Linked Lists', 'Stacks', 'Queues'], marks: 25 },
      { number: 2, title: 'Non-Linear Data Structures', topics: ['Binary Trees', 'Graphs', 'Heaps'], marks: 25 }
    ]
  },
  {
    code: 'CS302',
    title: 'Database Management Systems',
    description: 'Concepts of relational databases and SQL.',
    credits: 3,
    semester: 3,
    category: 'Concept',
    totalMarks: 100,
    units: [
      { number: 1, title: 'Relational Model', topics: ['ER Diagrams', 'Normal Forms', 'Relational Algebra'], marks: 20 },
      { number: 2, title: 'SQL & Transactions', topics: ['SELECT statements', 'ACID properties', 'Indexing'], marks: 20 }
    ]
  },
  {
    code: 'CS401',
    title: 'Design and Analysis of Algorithms',
    description: 'Advanced algorithm design techniques.',
    credits: 4,
    semester: 4,
    category: 'Analytical',
    totalMarks: 100,
    units: [
      { number: 1, title: 'Algorithm Analysis', topics: ['Asymptotic Notations', 'Master Theorem'], marks: 20 },
      { number: 2, title: 'Dynamic Programming', topics: ['Knapsack Problem', 'LCS', 'Matrix Chain Multiplication'], marks: 25 }
    ]
  }
];

async function seedSyllabus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Course.deleteMany({ code: { $in: cseSyllabus.map(c => c.code) } });
    await Course.insertMany(cseSyllabus);

    console.log('CSE Syllabus Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedSyllabus();
