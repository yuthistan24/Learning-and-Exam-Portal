const Result = require('../models/Result');
const Answer = require('../models/Answer');
const Exam   = require('../models/Exam');
const Question = require('../models/Question');
const { AppError } = require('../middleware/errorHandler');
const { logger }   = require('../utils/logger');
const pythonClient = require('../services/pythonClient');

const canManageExam = (req, exam) => {
  if (!exam) return false;
  if (req.user.role === 'admin') return true;
  if (!exam.createdBy) return false;
  const creatorId = exam.createdBy._id ? exam.createdBy._id.toString() : exam.createdBy.toString();
  return creatorId === req.user.userId;
};

// ── Get result for student ────────────────────────────────────────────────────
exports.getStudentResult = async (req, res) => {
  try {
    const { examId }  = req.params;
    const studentId   = req.user.userId;

    if (req.user.role !== 'student')
      throw new AppError('Use the exam results endpoint to review student results', 403);

    const result = await Result.findOne({ examId, studentId })
      .populate('examId', 'title totalMarks')
      .populate('answers.questionId', 'text marks');

    if (!result) throw new AppError('Result not found', 404);
    res.json(result.toObject());
  } catch (error) { throw error; }
};

// ── Get results for exam (teacher/admin) ──────────────────────────────────────
exports.getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    if (!canManageExam(req, exam)) throw new AppError('Not authorized', 403);

    const results = await Result.find({ examId })
      .populate('studentId', 'name email department')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) { throw error; }
};

// ── Initialize result (called when student submits exam) ──────────────────────
// FIXED: was referencing undefined `answers` variable
exports.initializeResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId  = req.user.userId;
    const { timeTakenSeconds, malpractice } = req.body || {};

    if (req.user.role !== 'student')
      throw new AppError('Only students can submit results', 403);

    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    if (exam.status !== 'active') throw new AppError('Exam is not active', 400);

    // ── FIXED: load answers from DB before building result ─────────────────
    const rawAnswers = await Answer.find({ examId, studentId })
      .populate('questionId', 'marks type rubric text subject');

    // Also load ALL exam questions so unanswered ones get 0 score
    const allQuestions = await Question.find({ examId });
    const answeredQIds = new Set(rawAnswers.map(a => a.questionId?._id?.toString()));

    // Build answer array for result document
    const answerDocs = allQuestions.map(q => {
      const submitted = rawAnswers.find(a => a.questionId?._id?.toString() === q._id.toString());
      return {
        questionId:       q._id,
        studentAnswer:    submitted?.answerText || '',
        score:            0,
        maxScore:         q.marks,
        feedback:         'Pending AI evaluation',
        evaluationMethod: 'pending',
        confidence:       0,
      };
    });

    const mongoose = require('mongoose');

    // Atomic upsert — prevent duplicate results from double-click
    const raw = await Result.collection.findOneAndUpdate(
      {
        examId:    new mongoose.Types.ObjectId(examId),
        studentId: new mongoose.Types.ObjectId(studentId),
      },
      {
        $setOnInsert: {
          answers:          answerDocs,
          submittedAt:      new Date(),
          status:           'pending',
          timeTakenSeconds: typeof timeTakenSeconds === 'number' ? timeTakenSeconds : null,
          malpractice:      malpractice || { violations: 0, flags: [] },
          totalScore:       0,
          totalMarks:       allQuestions.reduce((s, q) => s + q.marks, 0),
          percentage:       0,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const isNewInsert = !raw.lastErrorObject?.updatedExisting;
    const resultDoc   = await Result.findById(raw.value._id);

    if (!isNewInsert && resultDoc.status !== 'pending') {
      throw new AppError('Exam already submitted and graded', 400);
    }

    // Lock all submitted answers
    await Answer.updateMany({ examId, studentId }, { $set: { isLocked: true } });

    if (isNewInsert) {
      logger.info(`Result initialized — Student: ${studentId}, Exam: ${examId}`);
      // Trigger async AI evaluation (non-blocking)
      exports.evaluateAndStoreResult(examId, studentId).catch(err =>
        logger.error(`Async evaluation failed for student ${studentId}: ${err.message}`)
      );
    } else {
      // Allow metadata updates while still pending
      if (typeof timeTakenSeconds === 'number') resultDoc.timeTakenSeconds = timeTakenSeconds;
      if (malpractice) resultDoc.malpractice = malpractice;
      await resultDoc.save();
    }

    res.json({
      message: 'Exam submitted successfully. AI evaluation started.',
      result:  resultDoc.toObject(),
    });
  } catch (error) { throw error; }
};

// ── Core evaluation worker ────────────────────────────────────────────────────
exports.evaluateAndStoreResult = async (examId, studentId) => {
  try {
    const result = await Result.findOne({ examId, studentId })
      .populate('answers.questionId', 'text marks type rubric subject unit topic');

    if (!result) return;

    // Build evaluation requests for Python service
    const evaluationRequests = result.answers.map(ans => {
      const q = ans.questionId || {};
      return {
        answer:        ans.studentAnswer || '',
        question:      q.text || '',
        question_type: q.type || 'short_answer',
        subject:       q.subject || 'general',
        rubric: {
          keywords:     q.rubric?.keywords    || [],
          answerKey:    q.rubric?.answerKey   || '',
          method:       q.rubric?.method      || 'keyword',
          sampleAnswers: q.rubric?.sampleAnswers || [],
          testCases:    q.rubric?.testCases   || [],
          questionText: q.text || '',
        },
      };
    });

    const response = await pythonClient.batchEvaluate(evaluationRequests, examId);

    let totalScore = 0;
    let totalMarks = 0;

    result.answers.forEach((ans, idx) => {
      const evalData = response.results?.[idx];
      if (evalData) {
        ans.score            = Math.round(Number(evalData.score || 0) * ans.maxScore * 100) / 100;
        ans.feedback         = evalData.feedback         || '';
        ans.evaluationMethod = evalData.evaluationMethod || 'ai';
        ans.confidence       = Number(evalData.confidence || 0);
        ans.modelUsed        = evalData.modelUsed        || 'none';
        ans.subjectEvaluated = evalData.subjectEvaluated || 'general';
        ans.testResults      = evalData.testResults      || [];
      }
      totalScore += ans.score || 0;
      totalMarks += ans.maxScore || 0;
    });

    result.totalScore = Math.round(totalScore * 100) / 100;
    result.totalMarks = totalMarks;
    result.percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 10000) / 100 : 0;
    result.status     = 'evaluated';
    result.gradedAt   = new Date();

    await result.save();
    logger.info(`AI evaluation complete — Student: ${studentId}, Exam: ${examId}, Score: ${totalScore}/${totalMarks}`);
  } catch (error) {
    logger.error(`evaluateAndStoreResult error: ${error.message}`);
    // Mark as evaluation_failed so teacher knows to review
    try {
      await Result.findOneAndUpdate(
        { examId, studentId },
        { $set: { status: 'evaluation_failed' } }
      );
    } catch (_) {}
    throw error;
  }
};

// ── Teacher: re-trigger evaluation for a student ──────────────────────────────
exports.reEvaluate = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    if (!canManageExam(req, exam)) throw new AppError('Not authorized', 403);

    const result = await Result.findOne({ examId, studentId });
    if (!result) throw new AppError('Result not found', 404);

    result.status = 'pending';
    await result.save();

    // Non-blocking — runs in background
    exports.evaluateAndStoreResult(examId, studentId).catch(err =>
      logger.error(`Re-evaluation failed: ${err.message}`)
    );

    res.json({ message: 'Re-evaluation started. Refresh in a few seconds.' });
  } catch (error) { throw error; }
};

// ── Teacher: override score for a specific answer ─────────────────────────────
exports.overrideScore = async (req, res) => {
  try {
    const { examId, studentId, questionId } = req.params;
    const { score, feedback }               = req.body;

    if (score === undefined) throw new AppError('score is required', 400);

    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    if (!canManageExam(req, exam)) throw new AppError('Not authorized', 403);

    const result = await Result.findOne({ examId, studentId });
    if (!result) throw new AppError('Result not found', 404);

    const answerEntry = result.answers.find(
      a => a.questionId.toString() === questionId
    );
    if (!answerEntry) throw new AppError('Answer entry not found', 404);

    const clampedScore = Math.min(Math.max(Number(score), 0), answerEntry.maxScore);
    answerEntry.score            = clampedScore;
    answerEntry.feedback         = feedback || answerEntry.feedback;
    answerEntry.evaluationMethod = 'teacher_override';
    answerEntry.confidence       = 1.0;

    // Recalculate totals
    let totalScore = 0;
    result.answers.forEach(a => { totalScore += a.score || 0; });
    result.totalScore = Math.round(totalScore * 100) / 100;
    result.percentage = result.totalMarks > 0
      ? Math.round((totalScore / result.totalMarks) * 10000) / 100
      : 0;
    result.gradedAt   = new Date();

    await result.save();
    logger.info(`Teacher override — Exam: ${examId}, Student: ${studentId}, Q: ${questionId}, Score: ${clampedScore}`);

    res.json({ message: 'Score overridden successfully', result: result.toObject() });
  } catch (error) { throw error; }
};

// ── Detailed report ───────────────────────────────────────────────────────────
exports.getResultReport = async (req, res) => {
  try {
    const { examId, studentId: targetStudentId } = req.params;
    const requesterId  = req.user.userId;
    const requesterRole = req.user.role;

    let studentId = requesterId;

    if (targetStudentId) {
      const exam = await Exam.findById(examId);
      if (!exam) throw new AppError('Exam not found', 404);
      const creatorId = exam.createdBy?._id ? exam.createdBy._id.toString() : exam.createdBy?.toString();
      const isTeacher = creatorId === requesterId;
      if (!isTeacher && requesterRole !== 'admin')
        throw new AppError('Not authorized', 403);
      studentId = targetStudentId;
    }

    const result = await Result.findOne({ examId, studentId })
      .populate('examId',    'title totalMarks subject')
      .populate('studentId', 'name email')
      .populate('answers.questionId', 'text marks type rubric options unit topic subject');

    if (!result) throw new AppError('Result not found', 404);

    const perQuestion = result.answers.map(ans => {
      const question = ans.questionId || {};
      const maxScore = ans.maxScore || question.marks || 0;
      const score    = ans.score    || 0;
      let status = 'Incorrect';
      if (score >= maxScore && maxScore > 0) status = 'Correct';
      else if (score > 0)                    status = 'Partial';

      const expectedAnswer = (() => {
        if (question.type === 'mcq')
          return (question.options || []).filter(o => o.isCorrect).map(o => o.text);
        return question.rubric?.answerKey || question.rubric?.sampleAnswers || [];
      })();

      return {
        questionId:       question._id,
        questionText:     question.text,
        type:             question.type,
        subject:          question.subject || 'general',
        unit:             question.unit    || 'Uncategorized',
        topic:            question.topic   || 'General',
        submittedAnswer:  ans.studentAnswer || '',
        expectedAnswer,
        score,
        maxScore,
        status,
        evaluationMethod: ans.evaluationMethod || 'pending',
        confidence:       ans.confidence       || 0,
        modelUsed:        ans.modelUsed        || 'none',
        subjectEvaluated: ans.subjectEvaluated || 'general',
        feedback:         ans.feedback         || '',
        testResults:      ans.testResults      || [],
        testCases:        question.rubric?.testCases || [],
      };
    });

    const breakdown = {};
    perQuestion.forEach(q => {
      const key = `${q.unit} :: ${q.topic}`;
      if (!breakdown[key])
        breakdown[key] = { unit: q.unit, topic: q.topic, score: 0, maxScore: 0 };
      breakdown[key].score    += q.score;
      breakdown[key].maxScore += q.maxScore;
    });

    res.json({
      exam:             result.examId,
      student:          result.studentId,
      submittedAt:      result.submittedAt,
      gradedAt:         result.gradedAt,
      totalScore:       result.totalScore,
      totalMarks:       result.totalMarks,
      percentage:       result.percentage,
      status:           result.status,
      timeTakenSeconds: result.timeTakenSeconds,
      malpractice:      result.malpractice || { violations: 0, flags: [] },
      perQuestion,
      breakdown:        Object.values(breakdown),
    });
  } catch (error) { throw error; }
};

// ── Update result scores (called programmatically) ────────────────────────────
exports.updateResultScores = async (req, res) => {
  try {
    const { examId }  = req.params;
    const { answers: evaluatedAnswers, studentId } = req.body;
    if (!studentId) throw new AppError('studentId is required', 400);

    const exam = await Exam.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    if (!canManageExam(req, exam)) throw new AppError('Not authorized', 403);

    const result = await Result.findOne({ examId, studentId });
    if (!result) throw new AppError('Result not found', 404);

    let totalScore = 0;
    let totalMarks = 0;

    for (const ans of result.answers) {
      const evaluated = (evaluatedAnswers || []).find(
        e => e.questionId === ans.questionId.toString()
      );
      if (evaluated) {
        ans.score            = Math.round(Number(evaluated.score || 0) * ans.maxScore * 100) / 100;
        ans.feedback         = evaluated.feedback         || '';
        ans.evaluationMethod = evaluated.evaluationMethod || 'ai';
        ans.confidence       = Number(evaluated.confidence || 0.5);
        ans.modelUsed        = evaluated.modelUsed        || 'none';
        ans.subjectEvaluated = evaluated.subjectEvaluated || 'general';
      }
      totalScore += ans.score || 0;
      totalMarks += ans.maxScore || 0;
    }

    result.totalScore = Math.round(totalScore * 100) / 100;
    result.totalMarks = totalMarks;
    result.percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 10000) / 100 : 0;
    result.status     = 'evaluated';
    result.gradedAt   = new Date();
    await result.save();

    res.json({ message: 'Result updated', result: result.toObject() });
  } catch (error) { throw error; }
};

// ── Get all results for student ───────────────────────────────────────────────
exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const results   = await Result.find({ studentId })
      .populate('examId', 'title totalMarks subject')
      .sort({ gradedAt: -1 });
    res.json(results);
  } catch (error) { throw error; }
};

// ── Teacher: aggregate student progress ───────────────────────────────────────
exports.getStudentProgress = async (req, res) => {
  try {
    const User     = require('../models/User');
    const students = await User.find({ role: 'student' }).select('name email');
    const examFilter = req.user.role === 'teacher' ? { createdBy: req.user.userId } : {};
    const exams    = await Exam.find(examFilter).select('_id title');
    const examIds  = exams.map(e => e._id);
    const results  = await Result.find({ examId: { $in: examIds } }).populate('examId', 'title');

    const progressData = students.map(student => {
      const studentResults = results.filter(r => {
        const sId = r.studentId?._id ? r.studentId._id.toString() : r.studentId?.toString();
        return sId === student._id.toString();
      });
      const examsTaken     = studentResults.length;
      const totalPercentage = studentResults.reduce((s, r) => s + (r.percentage || 0), 0);
      const averageScore   = examsTaken > 0 ? (totalPercentage / examsTaken).toFixed(1) : 0;
      return {
        id: student._id, name: student.name, email: student.email,
        examsTaken, averageScore,
        lastActive: studentResults.length > 0
          ? new Date(Math.max(...studentResults.map(e => new Date(e.submittedAt)))).toLocaleDateString()
          : 'Never',
      };
    });

    res.json({ success: true, progress: progressData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
