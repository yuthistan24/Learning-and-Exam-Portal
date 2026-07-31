const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const User = require('./src/models/User');
const syllabusData = require('./src/data/r2024CseSyllabus');
const practiceData = require('./src/data/practiceQuestions');
const topicExplanations = require('./src/data/topicExplanations');
const dotenv = require('dotenv');

dotenv.config();

// ─── Lesson content generator ───────────────────────────────────────
const getLanguageForCourse = (courseTitle, courseCode) => {
  if (courseCode === '24CSC31') return 'java';
  if (courseCode === '24CSC41') return 'python';
  if (courseTitle.match(/Python/i)) return 'python';
  if (courseTitle.match(/Java/i)) return 'java';
  if (courseTitle.match(/C\+\+|Object Oriented/i)) return 'cpp';
  if (courseTitle.match(/\bC\b|Structured|Data Structures|Algorithms|Digital|Organization/i)) return 'c';
  return null;
};

const generateLessonContent = (topic, unitNumber, courseTitle, courseCode) => {
  const lang = getLanguageForCourse(courseTitle, courseCode);
  const explanation = topicExplanations[topic] || topicExplanations[topic.split(' (')[0]]; // Handle titles with parentheses
  let codingStarter = null;
  
  if (lang === 'python') {
    codingStarter = `# Practice: ${topic}\ndef solve():\n    # Write your python code here\n    print("Solution for ${topic}")\n\nsolve()`;
  } else if (lang === 'c') {
    codingStarter = `/* Practice: ${topic} */\n#include <stdio.h>\n\nint main() {\n    printf("Solution for ${topic}\\n");\n    return 0;\n}`;
  } else if (lang === 'cpp') {
    codingStarter = `// Practice: ${topic}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Solution for ${topic}" << endl;\n    return 0;\n}`;
  } else if (lang === 'java') {
    codingStarter = `// Practice: ${topic}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Solution for ${topic}");\n    }\n}`;
  }

  return {
    unitNumber,
    topic,
    summary: explanation ? explanation.summary : 
      `In this lesson, we will explore **${topic}**. This is an important concept in ${courseTitle} that helps you build better software and solve complex problems.\n\n` +
      `We will look at how it works, why it is useful, and how you can implement it in your own projects. Follow the key points below and try the practice exercise to master this topic!`,
    objectives: [
      `Understand the core concepts of ${topic}`,
      `Learn how to apply ${topic} in practical scenarios`,
      `Gain confidence in using ${topic} within the context of ${courseTitle}`
    ],
    keyPoints: explanation ? explanation.keyPoints : [
      `${topic} is a key building block for this unit.`,
      `Understanding ${topic} will help you write more efficient code.`,
      `Practical practice is the best way to learn this concept.`
    ],
    activity: `Complete the practice problem for ${topic} using the interactive editor.`,
    codingStarter,
    estimatedMinutes: 25
  };
};

// ─── Department-wise Teacher Definitions ────────────────────────────
const departmentTeachers = {
  MATHS: [
    { name: 'Dr. Ramanujan S.', email: 'teacher.maths1@college.edu', title: 'Associate Professor' },
    { name: 'Dr. Lakshmi N.', email: 'teacher.maths2@college.edu', title: 'Assistant Professor' }
  ],
  PHYSICS: [
    { name: 'Dr. Raman C.V.', email: 'teacher.physics@college.edu', title: 'Professor' }
  ],
  CHEMISTRY: [
    { name: 'Dr. Priya Chem', email: 'teacher.chemistry@college.edu', title: 'Assistant Professor' }
  ],
  ENGLISH: [
    { name: 'Prof. Anitha R.', email: 'teacher.english@college.edu', title: 'Associate Professor' }
  ],
  CSE: [
    { name: 'Dr. Venkat K.', email: 'teacher.cse1@college.edu', title: 'Professor — Data Structures & Algorithms' },
    { name: 'Dr. Meena S.', email: 'teacher.cse2@college.edu', title: 'Associate Professor — Systems & Architecture' },
    { name: 'Dr. Arun P.', email: 'teacher.cse3@college.edu', title: 'Assistant Professor — Programming Languages' },
    { name: 'Dr. Kavitha D.', email: 'teacher.cse4@college.edu', title: 'Associate Professor — Databases & Web' },
    { name: 'Dr. Suresh M.', email: 'teacher.cse5@college.edu', title: 'Assistant Professor — Software Engineering' }
  ]
};

const courseTeacherMapping = {
  '24EGT11': 'teacher.english@college.edu',
  '24MAC11': 'teacher.maths1@college.edu',
  '24PHT11': 'teacher.physics@college.edu',
  '24CSC12': 'teacher.cse3@college.edu',
  '24CSC13': 'teacher.cse4@college.edu',
  '24MNT12': 'teacher.maths2@college.edu',
  '24EGT21': 'teacher.english@college.edu',
  '24MAC23': 'teacher.maths1@college.edu',
  '24CYT13': 'teacher.chemistry@college.edu',
  '24CSC21': 'teacher.cse1@college.edu',
  '24CSC22': 'teacher.cse3@college.edu',
  '24MNT21': 'teacher.maths2@college.edu',
  '24MAT31': 'teacher.maths2@college.edu',
  '24CSC31': 'teacher.cse3@college.edu',
  '24CST31': 'teacher.cse1@college.edu',
  '24CST32': 'teacher.cse2@college.edu',
  '24CST33': 'teacher.cse2@college.edu',
  '24CSC41': 'teacher.cse5@college.edu',
  '24CSC42': 'teacher.cse4@college.edu',
  '24CST41': 'teacher.cse4@college.edu',
  '24CST42': 'teacher.cse2@college.edu',
  '24CST43': 'teacher.cse1@college.edu'
};

const seed = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams');
      console.log('✅ Connected to MongoDB');
      break;
    } catch (err) {
      console.error(`MongoDB connection failed. Retries left: ${retries - 1}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  try {
    console.log('🧹 Cleaning existing data...');
    await Course.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({ role: { $in: ['teacher', 'admin'] } });

    const adminPassword = 'admin12345';
    const teacherPassword = 'teacher12345';

    // ── Create Admin ────────────────────────────────────────────────
    await new User({ name: 'Global Admin', email: 'admin@college.edu', passwordHash: adminPassword, role: 'admin', department: 'Administration' }).save();
    console.log('👤 Admin created');

    // ── Create Department Teachers ──────────────────────────────────
    const teacherMap = {};
    for (const [dept, teachers] of Object.entries(departmentTeachers)) {
      for (const t of teachers) {
        const teacher = new User({ name: t.name, email: t.email, passwordHash: teacherPassword, role: 'teacher', department: dept });
        await teacher.save();
        teacherMap[t.email] = teacher;
      }
    }
    console.log(`👨‍🏫 ${Object.keys(teacherMap).length} Teachers created`);

    // ── Seed Courses ────────────────────────────────────────────────
    for (const courseData of syllabusData) {
      const teacherEmail = courseTeacherMapping[courseData.code];
      const assignedTeacher = teacherMap[teacherEmail];

      const lessons = [];
      for (const unit of courseData.units) {
        for (const topic of unit.topics) {
          lessons.push(generateLessonContent(topic, unit.number, courseData.title, courseData.code));
        }
      }

      const course = new Course({
        code: courseData.code,
        title: courseData.title,
        description: courseData.description,
        semester: courseData.semester,
        credits: courseData.credits,
        totalMarks: courseData.totalMarks,
        teacherId: assignedTeacher?._id || null,
        units: courseData.units,
        lessons
      });
      await course.save();

      // ── Practice & Homework Questions ─────────────────────────────
      for (const unit of course.units) {
        // Unit-level Homework
        await new Question({
          text: `[Homework] Comprehensive problem covering Unit ${unit.number}: ${unit.title}. Explain the core concepts and provide examples.`,
          type: 'long_answer',
          category: 'homework',
          marks: 10,
          rubric: { method: 'keyword', keywords: [unit.title.toLowerCase()], answerKey: `Homework answer for ${unit.title}` },
          courseId: course._id,
          unit: `Unit ${unit.number}`
        }).save();

        for (const topic of unit.topics) {
          const isCoding = getLanguageForCourse(course.title, course.code) !== null;
          
          // Question 1: Concept
          await new Question({
            text: `[Concept Practice] Explain the theoretical foundations of ${topic}. What are its primary use cases?`,
            type: 'short_answer',
            category: 'practice',
            marks: 5,
            rubric: { method: 'keyword', keywords: [topic.toLowerCase()], answerKey: `Comprehensive explanation of ${topic}.` },
            courseId: course._id,
            unit: `Unit ${unit.number}`,
            topic
          }).save();

          // Question 2: Analytical
          await new Question({
            text: `[Analytical Practice] Analyze the performance, constraints, or mathematical properties of ${topic}. Provide a detailed breakdown.`,
            type: 'short_answer',
            category: 'practice',
            marks: 5,
            rubric: { method: 'keyword', keywords: ['performance', 'constraints', topic.toLowerCase()], answerKey: `Analysis of ${topic}.` },
            courseId: course._id,
            unit: `Unit ${unit.number}`,
            topic
          }).save();

          // Question 3: Implementation
          let implText = `[Implementation Practice] ${isCoding ? 'Write the code to implement' : 'Provide a step-by-step procedure/algorithm for'} ${topic}.`;
          let rubric = isCoding ? { method: 'programming', testCases: [{ input: 'test_input', expectedOutput: 'test_output', weight: 1 }] } : { method: 'keyword', keywords: ['step', topic.toLowerCase()], answerKey: `Implementation details for ${topic}.` };
          
          if (practiceData[topic]) {
              const pData = practiceData[topic];
              implText = pData.text;
              if (pData.testCases) {
                  rubric = { method: 'programming', testCases: pData.testCases };
              } else if (pData.answerKey) {
                  rubric = { method: 'keyword', keywords: [topic.toLowerCase()], answerKey: pData.answerKey };
              }
          }

          await new Question({
            text: implText,
            type: (isCoding || (practiceData[topic] && practiceData[topic].testCases)) ? 'programming' : 'short_answer',
            category: 'practice',
            marks: 10,
            rubric: rubric,
            courseId: course._id,
            unit: `Unit ${unit.number}`,
            topic
          }).save();
        }
      }
      console.log(`✅ Seeded ${course.code}: ${course.title}`);
    }

    console.log('🚀 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
