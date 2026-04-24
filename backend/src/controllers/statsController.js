const Result = require('../models/Result');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Course = require('../models/Course');
const { AppError } = require('../middleware/errorHandler');

// Get statistics for the current student
exports.getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const results = await Result.find({ studentId }).populate('examId', 'title subject');
    
    const totalExams = results.length;
    let totalScore = 0;
    let totalMarks = 0;
    
    const performanceBySubject = {};
    const performanceByUnit = {};

    results.forEach(result => {
      totalScore += result.totalScore;
      totalMarks += result.totalMarks;

      const subject = result.examId?.subject || 'General';
      if (!performanceBySubject[subject]) {
        performanceBySubject[subject] = { score: 0, marks: 0, count: 0 };
      }
      performanceBySubject[subject].score += result.totalScore;
      performanceBySubject[subject].marks += result.totalMarks;
      performanceBySubject[subject].count += 1;

      // Unit-wise performance (if breakdown exists)
      if (result.answers) {
          // This would require more complex logic if we want to extract unit from questionId
          // But Result.js might have a breakdown saved. Let's check Result model later.
      }
    });

    const averagePercentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

    res.json({
      totalExams,
      averagePercentage: averagePercentage.toFixed(2),
      performanceBySubject: Object.keys(performanceBySubject).map(s => ({
        subject: s,
        percentage: ((performanceBySubject[s].score / performanceBySubject[s].marks) * 100).toFixed(2),
        examsTaken: performanceBySubject[s].count
      })),
      recentResults: results.slice(0, 5).map(r => ({
        examTitle: r.examId?.title,
        score: r.totalScore,
        totalMarks: r.totalMarks,
        date: r.submittedAt
      }))
    });
  } catch (error) {
    throw error;
  }
};

// Get aggregate statistics for teachers/admins
exports.getGlobalStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalExams = await Exam.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalResults = await Result.countDocuments();

    const avgScore = await Result.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);

    const examPerformance = await Result.aggregate([
      {
        $group: {
          _id: '$examId',
          avgPercentage: { $avg: '$percentage' },
          attempts: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $project: {
          title: '$exam.title',
          avgPercentage: 1,
          attempts: 1
        }
      },
      { $sort: { avgPercentage: -1 } }
    ]);

    res.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalExams,
        totalCourses,
        totalResults,
        globalAverageScore: avgScore.length > 0 ? avgScore[0].avg.toFixed(2) : 0
      },
      examPerformance
    });
  } catch (error) {
    throw error;
  }
};
