const asyncHandler = require('../middleware/asyncHandler');
const quizService = require('../services/quizService');
const { HTTP_STATUS } = require('../config/constants');

//Tutor
exports.createQuiz = asyncHandler(async (req, res) => {
    const quiz = await quizService.createQuiz(req.user._id, req.body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: quiz });
});

exports.updateQuiz = asyncHandler(async (req, res) => {
    const quiz = await quizService.updateQuiz(req.user._id, req.params.quizId, req.body);
    res.status(HTTP_STATUS.OK).json({ success: true, data: quiz });
});

exports.getQuizByCourse = asyncHandler(async (req, res) => {
    const quiz = await quizService.getQuizByCourse(req.params.courseId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: quiz });
});

//Student
exports.getStudentQuizStatus = asyncHandler(async (req, res) => {
    const status = await quizService.getStudentQuizStatus(req.user._id, req.params.courseId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: status });
});

exports.startAttempt = asyncHandler(async (req, res) => {
    const attempt = await quizService.startAttempt(req.user._id, req.params.quizId);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data: attempt });
});

exports.autosaveAttempt = asyncHandler(async (req, res) => {
    const attempt = await quizService.autosaveAttempt(req.user._id, req.params.attemptId, req.body.answers);
    res.status(HTTP_STATUS.OK).json({ success: true, data: attempt });
});

exports.submitAttempt = asyncHandler(async (req, res) => {
    const reason = req.body.reason || 'submitted';
    const attempt = await quizService.submitAttempt(req.user._id, req.params.attemptId, reason);
    res.status(HTTP_STATUS.OK).json({ success: true, data: attempt });
});


