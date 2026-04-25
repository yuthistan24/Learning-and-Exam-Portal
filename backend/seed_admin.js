const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/global-exams';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'College Admin',
        email: 'admin@college.edu',
        passwordHash: process.env.DEFAULT_ADMIN_PASSWORD || 'admin12345', // Will be hashed by pre-save hook
        role: 'admin',
        department: 'CSE'
      });
      console.log('Admin user created: admin@college.edu / admin12345');
    } else {
      console.log('Admin user already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
