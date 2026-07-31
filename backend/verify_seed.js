const mongoose = require('mongoose');
const Course = require('./src/models/Course');
const dotenv = require('dotenv');
dotenv.config();

const verify = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams');
  const course = await Course.findOne({ code: '24CSC12' });
  if (course) {
    console.log(`Course: ${course.title}`);
    console.log(`First Lesson Topic: ${course.lessons[0].topic}`);
    console.log(`First Lesson Summary:\n${course.lessons[0].summary}`);
  } else {
    console.log('Course not found');
  }
  process.exit(0);
};

verify();
