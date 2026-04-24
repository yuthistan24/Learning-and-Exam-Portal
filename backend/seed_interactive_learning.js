const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const dotenv = require('dotenv');

dotenv.config();

const courses = [
  {
    title: "Data Structures and Algorithms",
    code: "CS201",
    semester: 3,
    description: "Learn fundamental data structures and algorithmic paradigms for efficient problem solving.",
    credits: 4,
    totalMarks: 100,
    units: [
      {
        number: 1,
        title: "Linear Data Structures",
        topics: ["Arrays", "Linked Lists", "Stacks", "Queues", "Applications of Stacks"]
      },
      {
        number: 2,
        title: "Non-Linear Data Structures",
        topics: ["Binary Trees", "BST", "AVL Trees", "Heaps", "Graphs", "BFS & DFS"]
      },
      {
        number: 3,
        title: "Sorting and Searching",
        topics: ["Quick Sort", "Merge Sort", "Heap Sort", "Binary Search", "Hash Tables"]
      }
    ]
  },
  {
    title: "Operating Systems",
    code: "CS202",
    semester: 4,
    description: "Introduction to operating system concepts including processes, memory management, and file systems.",
    credits: 3,
    totalMarks: 100,
    units: [
      {
        number: 1,
        title: "Process Management",
        topics: ["Process Concepts", "CPU Scheduling", "Inter-process Communication", "Threads"]
      },
      {
        number: 2,
        title: "Memory Management",
        topics: ["Paging", "Segmentation", "Virtual Memory", "Demand Paging", "Page Replacement"]
      }
    ]
  },
  {
    title: "Database Management Systems",
    code: "CS203",
    semester: 4,
    description: "Design and implementation of relational databases using SQL.",
    credits: 3,
    totalMarks: 100,
    units: [
      {
        number: 1,
        title: "Relational Model",
        topics: ["ER Diagrams", "Normalization (1NF, 2NF, 3NF)", "Relational Algebra"]
      },
      {
        number: 2,
        title: "SQL & Transactions",
        topics: ["DML & DDL", "Joins", "Subqueries", "ACID Properties", "Concurrency Control"]
      }
    ]
  }
];

const seedQuestions = async (courseId, topic) => {
    const questions = [
        {
            examId: null,
            text: `Explain the working principle of ${topic}.`,
            type: 'short_answer',
            marks: 5,
            rubric: {
                method: 'keyword',
                keywords: [topic.toLowerCase()],
                answerKey: `Detailed explanation of ${topic} including its core concepts and applications.`
            },
            courseId,
            topic
        },
        {
            examId: null,
            text: `Write a Python code snippet to demonstrate ${topic}.`,
            type: 'programming',
            marks: 10,
            rubric: {
                method: 'programming',
                test_cases: [{ input: '', expectedOutput: '', weight: 1 }]
            },
            courseId,
            topic
        }
    ];
    await Question.insertMany(questions);
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams');
    console.log('Connected to MongoDB');

    await Course.deleteMany({});
    await Question.deleteMany({ examId: null });

    for (const courseData of courses) {
      const course = new Course(courseData);
      await course.save();
      console.log(`Seeded course: ${course.title}`);

      for (const unit of course.units) {
        for (const topic of unit.topics) {
          await seedQuestions(course._id, topic);
        }
      }
    }

    console.log('Successfully seeded interactive learning content');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
