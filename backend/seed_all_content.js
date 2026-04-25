const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const User = require('./src/models/User');
const syllabusData = require('./src/data/r2024CseSyllabus');
const dotenv = require('dotenv');

dotenv.config();

// ─── Lesson content generator ───────────────────────────────────────
const generateLessonContent = (topic, unitNumber, courseTitle) => ({
  unitNumber,
  topic,
  summary: `This lesson covers the fundamental concepts of ${topic} as part of Unit ${unitNumber} in the ${courseTitle} course.`,
  objectives: [
    `Understand the core principles of ${topic}`,
    `Analyze the role of ${topic} in the broader context`,
    `Apply concepts of ${topic} to solve problems`
  ],
  keyPoints: [
    `${topic} is a critical component of this course.`,
    `Efficiency and understanding are key considerations for ${topic}.`,
    `Practical applications of ${topic} span real-world engineering scenarios.`
  ],
  activity: `Research a real-world case study where ${topic} is implemented to solve a practical engineering problem.`,
  codingStarter: courseTitle.match(/Programming|Data Structures|Python|OOP|Digital/i)
    ? `# Practice coding for ${topic}\ndef solution():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    solution()`
    : null,
  estimatedMinutes: 45
});

// ─── Department-wise Teacher Definitions ────────────────────────────
// Mirrors a typical Indian engineering college faculty structure.
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

// Map each course code to a specific teacher email for deterministic assignment
const courseTeacherMapping = {
  // Sem 1
  '24EGT11': 'teacher.english@college.edu',
  '24MAC11': 'teacher.maths1@college.edu',
  '24PHT11': 'teacher.physics@college.edu',
  '24CSC12': 'teacher.cse3@college.edu',        // Programming in C → Programming prof
  '24CSC13': 'teacher.cse4@college.edu',        // Problem Solving & Web Design → Web prof
  '24MNT12': 'teacher.maths2@college.edu',       // QA-I
  // Sem 2
  '24EGT21': 'teacher.english@college.edu',
  '24MAC23': 'teacher.maths1@college.edu',       // Probability & Statistics
  '24CYT13': 'teacher.chemistry@college.edu',    // Chemistry
  '24CSC21': 'teacher.cse1@college.edu',         // Structured Prog & Linear DS → DS&A prof
  '24CSC22': 'teacher.cse3@college.edu',         // OOP C++ → Programming prof
  '24MNT21': 'teacher.maths2@college.edu',       // QA-II
  // Sem 3
  '24MAT31': 'teacher.maths2@college.edu',       // Discrete Math
  '24CSC31': 'teacher.cse3@college.edu',         // Java Programming → Programming prof
  '24CST31': 'teacher.cse1@college.edu',         // Data Structures → DS&A prof
  '24CST32': 'teacher.cse2@college.edu',         // Computer Organization → Systems prof
  '24CST33': 'teacher.cse2@college.edu',         // Digital Logic → Systems prof
  // Sem 4
  '24CSC41': 'teacher.cse5@college.edu',         // Python & Frameworks → SE prof
  '24CSC42': 'teacher.cse4@college.edu',         // Full Stack Dev → Web prof
  '24CST41': 'teacher.cse4@college.edu',         // DBMS → Databases prof
  '24CST42': 'teacher.cse2@college.edu',         // OS → Systems prof
  '24CST43': 'teacher.cse1@college.edu'          // DAA → DS&A prof
};

// ─── Main Seed Function ─────────────────────────────────────────────
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
      if (retries === 0) {
        console.error('❌ Could not connect to MongoDB after multiple attempts. Exiting.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  try {
    // ── Clean-up ────────────────────────────────────────────────────
    console.log('🧹 Cleaning existing data...');
    await Course.deleteMany({});
    await Question.deleteMany({ examId: null });
    await User.deleteMany({ role: { $in: ['teacher', 'admin'] } });

    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345';
    const teacherPassword = process.env.DEFAULT_TEACHER_PASSWORD || 'teacher12345';

    // ── Create Admin ────────────────────────────────────────────────
    const admin = new User({
      name: 'Global Admin',
      email: 'admin@college.edu',
      passwordHash: adminPassword,
      role: 'admin',
      department: 'Administration'
    });
    await admin.save();
    console.log('👤 Admin created: admin@college.edu');

    // ── Create Department Teachers ──────────────────────────────────
    const teacherMap = {};  // email → user doc
    for (const [dept, teachers] of Object.entries(departmentTeachers)) {
      for (const t of teachers) {
        const teacher = new User({
          name: t.name,
          email: t.email,
          passwordHash: teacherPassword,
          role: 'teacher',
          department: dept
        });
        await teacher.save();
        teacherMap[t.email] = teacher;
        console.log(`  👨‍🏫 [${dept}] ${t.name} (${t.email}) — ${t.title}`);
      }
    }

    console.log(`\n📚 Seeding ${syllabusData.length} courses across 4 semesters...\n`);

    // ── Seed Courses ────────────────────────────────────────────────
    for (const courseData of syllabusData) {
      const teacherEmail = courseTeacherMapping[courseData.code];
      const assignedTeacher = teacherMap[teacherEmail];

      // Build lessons from unit topics
      const lessons = [];
      for (const unit of courseData.units) {
        for (const topic of unit.topics) {
          lessons.push(generateLessonContent(topic, unit.number, courseData.title));
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

      // ── Practice Questions ────────────────────────────────────────
      for (const unit of course.units) {
        for (const topic of unit.topics) {
          const questions = [
            {
              text: `Explain the fundamental concepts of ${topic} as per Unit ${unit.number} of ${course.title}.`,
              type: 'short_answer',
              marks: 5,
              rubric: {
                method: 'keyword',
                keywords: [topic.toLowerCase(), unit.title.toLowerCase()],
                answerKey: `Comprehensive explanation of ${topic}.`
              },
              courseId: course._id,
              unit: `Unit ${unit.number}: ${unit.title}`,
              topic
            },
            {
              text: `Write a detailed note on the significance and applications of ${topic}.`,
              type: 'short_answer',
              marks: 5,
              rubric: {
                method: 'keyword',
                keywords: [topic.toLowerCase(), 'application'],
                answerKey: `Detailed discussion of ${topic} and its real-world applications.`
              },
              courseId: course._id,
              unit: `Unit ${unit.number}: ${unit.title}`,
              topic
            }
          ];

          // Add a coding question only for programming-related courses
          if (courseData.department === 'CSE') {
            questions.push({
              text: `Implement a robust logic for ${topic} using Python.`,
              type: 'programming',
              marks: 10,
              rubric: {
                method: 'programming',
                testCases: [{ input: '', expectedOutput: '', weight: 1 }]
              },
              courseId: course._id,
              unit: `Unit ${unit.number}: ${unit.title}`,
              topic
            });
          }

          await Question.insertMany(questions);
        }
      }

      const teacherLabel = assignedTeacher ? `${assignedTeacher.name} [${courseData.department}]` : 'Unassigned';
      console.log(`  ✅ Sem ${courseData.semester} │ ${courseData.code} │ ${courseData.title} │ ${lessons.length} lessons │ ${teacherLabel}`);
    }

    console.log('\n══════════════════════════════════════════');
    console.log('✅ Seeding complete!');
    console.log(`   ${syllabusData.length} courses seeded`);
    console.log(`   ${Object.keys(teacherMap).length} department teachers created`);
    console.log('══════════════════════════════════════════\n');
    console.log('Demo credentials:');
    console.log('  Admin:   admin@college.edu / admin12345');
    console.log('  Teacher: teacher.cse1@college.edu / teacher12345');
    console.log('  Student: (register via signup page)\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
