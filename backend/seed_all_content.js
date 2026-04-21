const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-portal';

const allCourses = [
  // Semester 1
  { code: 'HS3151', semester: 1, title: 'Professional English - I', credits: 3, category: 'Others', totalMarks: 100, units: [
    { number: 1, title: 'Introduction to Basics of Communication', topics: ['Listening', 'Reading', 'Writing', 'Grammar'], marks: 20 },
    { number: 2, title: 'Narrative and Descriptive', topics: ['Reading comprehension', 'Tenses', 'Vocabulary'], marks: 20 }
  ]},
  { code: 'MA3151', semester: 1, title: 'Matrices and Calculus', credits: 4, category: 'Analytical', totalMarks: 100, units: [
    { number: 1, title: 'Matrices', topics: ['Eigenvalues', 'Eigenvectors', 'Cayley-Hamilton Theorem'], marks: 20 },
    { number: 2, title: 'Differential Calculus', topics: ['Limit', 'Continuity', 'Derivatives'], marks: 20 }
  ]},
  { code: 'GE3151', semester: 1, title: 'Problem Solving and Python Programming', credits: 3, category: 'Simulation using Coding', totalMarks: 100, units: [
    { number: 1, title: 'Algorithmic Problem Solving', topics: ['Algorithms', 'Flowcharts', 'Pseudocode'], marks: 20 },
    { number: 2, title: 'Data, Expressions, Statements', topics: ['Variables', 'Operators', 'Strings'], marks: 20 },
    { number: 3, title: 'Control Flow, Functions', topics: ['Conditionals', 'Loops', 'Functions'], marks: 20 }
  ]},
  // Semester 2
  { code: 'HS3251', semester: 2, title: 'Professional English - II', credits: 3, category: 'Others', totalMarks: 100, units: [
    { number: 1, title: 'Comparing and Contrasting', topics: ['Reading strategies', 'Writing essays'], marks: 20 }
  ]},
  { code: 'MA3251', semester: 2, title: 'Statistics and Numerical Methods', credits: 4, category: 'Analytical', totalMarks: 100, units: [
    { number: 1, title: 'Testing of Hypothesis', topics: ['T-test', 'F-test', 'Chi-square'], marks: 20 }
  ]},
  { code: 'CS3251', semester: 2, title: 'Programming in C', credits: 3, category: 'Simulation using Coding', totalMarks: 100, units: [
    { number: 1, title: 'Basics of C Programming', topics: ['Data Types', 'Variables', 'Operators'], marks: 20 },
    { number: 2, title: 'Arrays and Strings', topics: ['1D Arrays', '2D Arrays', 'String Handling'], marks: 20 },
    { number: 3, title: 'Functions and Pointers', topics: ['Recursion', 'Pointer Arithmetic', 'Pass by Reference'], marks: 20 }
  ]},
  // Semester 3
  { code: 'MA3354', semester: 3, title: 'Discrete Mathematics', credits: 4, category: 'Analytical', totalMarks: 100, units: [
    { number: 1, title: 'Logic and Proofs', topics: ['Propositional Logic', 'Predicates', 'Rules of Inference'], marks: 20 },
    { number: 2, title: 'Combinatorics', topics: ['Permutations', 'Combinations', 'Pigeonhole Principle'], marks: 20 }
  ]},
  { code: 'CS3301', semester: 3, title: 'Data Structures', credits: 3, category: 'Analytical', totalMarks: 100, units: [
    { number: 1, title: 'Linear Data Structures - List', topics: ['Array implementation', 'Linked List', 'Doubly Linked List'], marks: 20 },
    { number: 2, title: 'Stacks and Queues', topics: ['Stack ADT', 'Queue ADT', 'Circular Queue'], marks: 20 },
    { number: 3, title: 'Non-Linear Data Structures - Trees', topics: ['Binary Trees', 'BST', 'AVL Trees'], marks: 20 },
    { number: 4, title: 'Graphs and Hashing', topics: ['Graph Traversal', 'Shortest Path', 'Hash Tables'], marks: 20 }
  ]},
  { code: 'CS3391', semester: 3, title: 'Object Oriented Programming', credits: 3, category: 'Simulation using Coding', totalMarks: 100, units: [
    { number: 1, title: 'OOP Concepts', topics: ['Classes', 'Objects', 'Encapsulation'], marks: 20 },
    { number: 2, title: 'Inheritance and Polymorphism', topics: ['Method Overloading', 'Method Overriding', 'Interfaces'], marks: 20 }
  ]},
  // Semester 4
  { code: 'CS3451', semester: 4, title: 'Introduction to Operating Systems', credits: 3, category: 'Concept', totalMarks: 100, units: [
    { number: 1, title: 'OS Overview', topics: ['System Calls', 'Process Concept', 'Threads'], marks: 20 },
    { number: 2, title: 'Process Management', topics: ['CPU Scheduling', 'Deadlocks', 'Synchronization'], marks: 20 },
    { number: 3, title: 'Memory Management', topics: ['Paging', 'Segmentation', 'Virtual Memory'], marks: 20 }
  ]},
  { code: 'CS3452', semester: 4, title: 'Theory of Computation', credits: 3, category: 'Analytical', totalMarks: 100, units: [
    { number: 1, title: 'Automata Theory', topics: ['DFA', 'NFA', 'Regular Expressions'], marks: 20 },
    { number: 2, title: 'Context-Free Grammar', topics: ['CFG', 'PDA', 'Turing Machines'], marks: 20 }
  ]},
  { code: 'CS3491', semester: 4, title: 'Artificial Intelligence and Machine Learning', credits: 3, category: 'Concept', totalMarks: 100, units: [
    { number: 1, title: 'Problem Solving', topics: ['State Space Search', 'A* Search', 'Minimax'], marks: 20 },
    { number: 2, title: 'Machine Learning', topics: ['Supervised Learning', 'Linear Regression', 'Neural Networks'], marks: 20 }
  ]},
  { code: 'CS3492', semester: 4, title: 'Database Management Systems', credits: 3, category: 'Concept', totalMarks: 100, units: [
    { number: 1, title: 'Relational Databases', topics: ['Entity-Relationship Model', 'Relational Algebra', 'SQL Basics'], marks: 20 },
    { number: 2, title: 'Database Design', topics: ['Normalization', '1NF', '2NF', '3NF', 'BCNF'], marks: 20 },
    { number: 3, title: 'Transactions', topics: ['ACID Properties', 'Concurrency Control', 'Recovery'], marks: 20 }
  ]}
];

async function seedAll() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // 1. Seed Courses
    await Course.deleteMany({});
    const createdCourses = await Course.insertMany(allCourses);
    console.log(`Successfully seeded ${createdCourses.length} courses!`);

    // 2. Prep Practice Exam & Creator
    let creator = await User.findOne({ role: 'admin' });
    if (!creator) creator = await User.findOne();
    
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

    // 3. Seed extensive questions
    await Question.deleteMany({ examId: dummyExam._id });
    const practiceQuestions = [];
    
    const questionsData = [
      // Python (GE3151)
      { topic: 'Algorithms', q: 'Define an algorithm.', t: 'short_answer', k: 'Step by step procedure to solve a problem' },
      { topic: 'Variables', q: 'How do you declare a variable in Python?', t: 'short_answer', k: 'No explicit declaration. Example: x = 5' },
      { topic: 'Loops', q: 'Write a Python function to print numbers 1 to 5 using a for loop.', t: 'programming', k: 'def print_nums():\n  for i in range(1, 6):\n    print(i)' },
      
      // C Programming (CS3251)
      { topic: 'Data Types', q: 'What are the basic data types in C?', t: 'short_answer', k: 'int, float, char, double' },
      { topic: 'Pointer Arithmetic', q: 'Explain pointer arithmetic with an example.', t: 'long_answer', k: 'Performing arithmetic operations on pointers like addition and subtraction.' },
      
      // Data Structures (CS3301)
      { topic: 'Linked List', q: 'What is a Linked List?', t: 'short_answer', k: 'A linear data structure where elements are not stored at contiguous memory locations.' },
      { topic: 'Binary Trees', q: 'What is a full binary tree?', t: 'short_answer', k: 'A binary tree in which every node has either 0 or 2 children.' },
      
      // DBMS (CS3492)
      { topic: 'Normalization', q: 'What is 1NF?', t: 'short_answer', k: 'First normal form ensures all column values are atomic.' },
      { topic: 'ACID Properties', q: 'Explain Isolation in ACID properties.', t: 'short_answer', k: 'Transactions occur independently without interference.' },
      
      // OS (CS3451)
      { topic: 'Deadlocks', q: 'What are the four necessary conditions for deadlock?', t: 'long_answer', k: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.' }
    ];

    questionsData.forEach(d => {
      practiceQuestions.push({
        text: d.q,
        type: d.t,
        marks: d.t === 'programming' ? 10 : (d.t === 'long_answer' ? 5 : 2),
        topic: d.topic,
        examId: dummyExam._id,
        rubric: { answerKey: d.k, method: d.t === 'programming' ? 'programming' : 'keyword' }
      });
    });

    await Question.insertMany(practiceQuestions);
    console.log(`Successfully seeded ${practiceQuestions.length} practice questions!`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAll();
