const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const Question = require('./src/models/Question');
const User = require('./src/models/User');
const syllabusData = require('./src/data/r2024CseSyllabus');
const dotenv = require('dotenv');

dotenv.config();

const generateLessonContent = (topic, unitNumber, courseTitle) => {
  return {
    unitNumber: unitNumber,
    topic: topic,
    summary: `This lesson covers the fundamental concepts of ${topic} as part of Unit ${unitNumber} in the ${courseTitle} course.`,
    objectives: [
      `Understand the core principles of ${topic}`,
      `Analyze the role of ${topic} in computer science`,
      `Implement basic structures related to ${topic}`
    ],
    keyPoints: [
      `${topic} is a critical component of modern computing.`,
      `Efficiency and scalability are key considerations for ${topic}.`,
      `Practical applications of ${topic} range from systems design to user-level software.`
    ],
    activity: `Research a real-world case study where ${topic} is implemented to solve a complex engineering problem.`,
    codingStarter: `# Practice coding for ${topic}\ndef solution():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    solution()`,
    estimatedMinutes: 45
  };
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams');
    console.log('Connected to MongoDB');

    // Clean up
    await Course.deleteMany({});
    await Question.deleteMany({ examId: null });
    await User.deleteMany({ role: { $in: ['teacher', 'admin'] } });

    // Ensure Admin User
    const admin = new User({
      name: 'Global Admin',
      email: 'admin@college.edu',
      passwordHash: 'admin12345',
      role: 'admin',
      department: 'CSE'
    });
    await admin.save();
    console.log('Admin created: admin@college.edu');

    // Create 3 Teachers for 3 courses
    const teachers = [];
    const teacherData = [
      { name: 'Dr. DS Expert', email: 'teacher.ds@college.edu' },
      { name: 'Dr. OS Guru', email: 'teacher.os@college.edu' },
      { name: 'Dr. DBMS Master', email: 'teacher.dbms@college.edu' }
    ];

    for (const t of teacherData) {
      const teacher = new User({
        name: t.name,
        email: t.email,
        passwordHash: 'teacher12345',
        role: 'teacher',
        department: 'CSE'
      });
      await teacher.save();
      teachers.push(teacher);
      console.log(`Teacher created: ${t.email}`);
    }

    // Default teacher if role selection is needed
    const defaultTeacher = new User({
        name: 'CSE Teacher',
        email: 'teacher@college.edu',
        passwordHash: 'teacher12345',
        role: 'teacher',
        department: 'CSE'
    });
    await defaultTeacher.save();

    let teacherIdx = 0;
    for (const courseData of syllabusData) {
      const assignedTeacher = teachers[teacherIdx % teachers.length];
      
      // Build lessons array
      const lessons = [];
      for (const unit of courseData.units) {
        for (const topic of unit.topics) {
          lessons.push(generateLessonContent(topic, unit.number, courseData.title));
        }
      }

      const course = new Course({
        ...courseData,
        teacherId: assignedTeacher._id,
        lessons: lessons
      });
      await course.save();
      console.log(`Seeded course: ${course.title} with ${lessons.length} lessons. Assigned to: ${assignedTeacher.email}`);
      teacherIdx++;

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
              topic: topic
            },
            {
              text: `Implement a robust logic for ${topic} using Python.`,
              type: 'programming',
              marks: 10,
              rubric: {
                method: 'programming',
                testCases: [{ input: '', expectedOutput: '', weight: 1 }]
              },
              courseId: course._id,
              unit: `Unit ${unit.number}: ${unit.title}`,
              topic: topic
            }
          ];
          await Question.insertMany(questions);
        }
      }
    }

    console.log('Successfully seeded all syllabus content with lessons and individual teachers.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
