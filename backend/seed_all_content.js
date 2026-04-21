const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/global-exams';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const Course = require('./src/models/Course');
const Question = require('./src/models/Question');

const seedCourses = async () => {
  await Course.deleteMany({});
  await Question.deleteMany({});
  console.log('Cleared existing courses and questions.');

  const courses = [
    {
      title: "English for Effective Communication",
      code: "24EGT11",
      semester: 1,
      totalMarks: 100,
      description: "Enhance linguistic competence, listening, and reading.",
      credits: 3,
      units: [
        { number: 1, title: "Grammar & Listening", topics: ["Tenses", "Voice", "Comprehension"] },
        { number: 2, title: "Speaking", topics: ["Oral Discourses", "Discussions", "Presentations"] },
      ]
    },
    {
      title: "Matrices and Ordinary Differential Equations",
      code: "24MAC11",
      semester: 1,
      totalMarks: 100,
      description: "Mathematical foundations in differential equations.",
      credits: 4,
      units: [
        { number: 1, title: "Matrices", topics: ["Eigenvalues", "Eigenvectors", "Diagonalization"] },
        { number: 2, title: "Differential Equations", topics: ["Linear Equations", "Second Order PDE"] },
      ]
    },
    {
      title: "Physics for Computer Systems",
      code: "24PHT11",
      semester: 1,
      totalMarks: 100,
      description: "Physics principles underlying modern computer hardware.",
      credits: 3,
      units: [
        { number: 1, title: "Quantum Physics", topics: ["Wave Mechanics", "Schrodinger Equation"] },
        { number: 2, title: "Semiconductors", topics: ["Intrinsic", "Extrinsic", "Band Gap"] },
      ]
    },
    {
      title: "Foundation Laboratory",
      code: "24GCL11",
      semester: 1,
      totalMarks: 100,
      description: "Manufacturing, Design and Robotics.",
      credits: 2,
      units: [
        { number: 1, title: "Manufacturing", topics: ["Arc Welding", "Milling", "Drilling"] },
        { number: 2, title: "Robotics", topics: ["Sensors", "Actuators", "Arduino UNO"] },
      ]
    },
    {
      title: "Yoga and Values for Holistic Development",
      code: "24VEC11",
      semester: 1,
      totalMarks: 100,
      description: "Mental health and general wellbeing.",
      credits: 1,
      units: [
        { number: 1, title: "Intro to Yoga", topics: ["Asanas", "Pranayama"] },
        { number: 2, title: "Values & Diet", topics: ["Social Values", "Natural Diet"] },
      ]
    },
    {
      title: "Quantitative Aptitude",
      code: "24MNT12",
      semester: 2,
      totalMarks: 100,
      description: "Problem solving and analytical skills.",
      credits: 2,
      units: [
        { number: 1, title: "Number System", topics: ["BODMAS", "HCF and LCM", "Fractions"] },
        { number: 2, title: "Ratio & Proportion", topics: ["Compound Ratio", "Percentages"] },
      ]
    },
    {
      title: "Probability and Statistics",
      code: "24MAC23",
      semester: 2,
      totalMarks: 100,
      description: "Random variables, correlation, and sampling theory.",
      credits: 4,
      units: [
        { number: 1, title: "Random Variables", topics: ["Discrete", "Continuous", "Variance"] },
        { number: 2, title: "Hypothesis Testing", topics: ["Z-test", "Chi-square", "Analysis of Variance"] },
      ]
    },
    {
      title: "English for Effective Communication II",
      code: "24EGT21",
      semester: 2,
      totalMarks: 100,
      description: "Advanced Academic Contexts english.",
      credits: 3,
      units: [
        { number: 1, title: "Reading & Writing", topics: ["Argumentative Essays", "Job Application"] },
        { number: 2, title: "Aptitude", topics: ["Verbal Analogy", "Error Spotting"] },
      ]
    },
    {
      title: "Chemistry Laboratory for Electronics and Computer Systems",
      code: "24CYL13",
      semester: 2,
      totalMarks: 100,
      description: "Analytical skills in chemical estimations.",
      credits: 1,
      units: [
        { number: 1, title: "Water Quality", topics: ["Hardness", "Alkalinity", "COD"] },
        { number: 2, title: "Analytical Methods", topics: ["Spectrophotometry", "pH metry"] },
      ]
    },
    {
      title: "Foundation Laboratory Electrical, IoT and Web Technologies",
      code: "24GCL12",
      semester: 2,
      totalMarks: 100,
      description: "Hands-on experience on house wiring, IoT and Web Technologies.",
      credits: 2,
      units: [
        { number: 1, title: "Electrical & IoT", topics: ["Wiring", "Sensors", "Arduino"] },
        { number: 2, title: "Web Technologies", topics: ["HTML", "CSS", "Bootstrap", "PHP"] },
      ]
    },
    {
      title: "Quantitative Aptitude II",
      code: "24MNT21",
      semester: 2,
      totalMarks: 100,
      description: "Advanced problem solving and analytical skills.",
      credits: 2,
      units: [
        { number: 1, title: "Averages & Time", topics: ["Averages", "Time and Work"] },
        { number: 2, title: "Probability", topics: ["Permutation", "Combination"] },
      ]
    }
  ];

  const createdCourses = await Course.insertMany(courses);
  console.log(`Successfully seeded ${createdCourses.length} real Kongu CSE courses based on PDF!`);

  const User = require('./src/models/User');
  let admin = await User.findOne({ email: 'admin@college.edu' });
  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash: 'admin123',
      role: 'admin'
    });
  }

  const Exam = require('./src/models/Exam');
  await Exam.deleteMany({});
  
  const dummyExam = await Exam.create({
    title: "Global Practice Question Bank",
    description: "Autogenerated pool for topic practice.",
    subject: "CSE",
    status: "active",
    duration: 120,
    totalMarks: 100,
    createdBy: admin._id
  });

  const sampleQuestions = [
    {
      examId: dummyExam._id,
      text: "Solve a linear equation where 5x + 3 = 18.",
      type: "short_answer",
      marks: 5,
      unit: "Number System",
      topic: "BODMAS",
      rubric: {
        keywords: ["x=3", "15", "x = 3"],
        answerKey: "Subtract 3 to get 15, then divide by 5 to get x=3.",
        method: "keyword"
      }
    },
    {
      examId: dummyExam._id,
      text: "Explain the components needed to operate an Arduino UNO robot.",
      type: "short_answer",
      marks: 10,
      unit: "Robotics",
      topic: "Arduino UNO",
      rubric: {
        keywords: ["sensors", "actuators", "power", "motors", "microcontroller"],
        answerKey: "Sensors for input, actuators for movement, and Arduino as microcontroller.",
        method: "keyword"
      }
    },
    {
      examId: dummyExam._id,
      text: "Write a Python function to calculate the Fibonacci series up to n terms.",
      type: "programming",
      marks: 15,
      unit: "Web Technologies",
      topic: "Python",
      rubric: {
        answerKey: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b",
        method: "programming",
        testCases: [
          { input: "5", expectedOutput: "[0, 1, 1, 2, 3]" }
        ]
      }
    }
  ];
  await Question.insertMany(sampleQuestions);
  console.log(`Successfully seeded sample practice questions!`);
};

connectDB().then(async () => {
  await seedCourses();
  process.exit(0);
});
