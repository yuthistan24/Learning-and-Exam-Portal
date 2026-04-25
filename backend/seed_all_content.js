const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const User = require('./src/models/User');
const syllabusData = require('./src/data/r2024CseSyllabus');
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
    summary: `Step-by-step guide to ${topic}. In this lesson, we will explore the core principles and implementation details.`,
    objectives: [
      `Master the basic syntax and logic of ${topic}`,
      `Understand how ${topic} fits into the larger architecture`,
      `Implement ${topic} in a real-world scenario`
    ],
    keyPoints: [
      `${topic} is fundamental to this unit.`,
      `Follow the steps carefully to ensure correct implementation.`,
      `Practice makes perfect: try the interactive code snippet below.`
    ],
    activity: `Complete the practice problem for ${topic} using the embedded editor.`,
    codingStarter,
    estimatedMinutes: 30
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
          // Topic-level Practice
          const isCoding = getLanguageForCourse(course.title, course.code) !== null;
          await new Question({
            text: `[Practice] ${isCoding ? 'Implement' : 'Describe'} the solution for ${topic}.`,
            type: isCoding ? 'programming' : 'short_answer',
            category: 'practice',
            marks: 5,
            rubric: isCoding ? { method: 'programming', testCases: [{ input: '', expectedOutput: '', weight: 1 }] } : { method: 'keyword', keywords: [topic.toLowerCase()], answerKey: `Practice answer for ${topic}` },
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
