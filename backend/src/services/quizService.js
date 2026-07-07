const crypto = require('crypto');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { QUIZ_STATUS, HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateQuizData } = require('../validators/quizValidator');
const Certificate = require("../models/Certificate");


const quizService = {
    async createQuiz(tutorId, quizData) {
        validateQuizData(quizData);

        const course = await Course.findOne({ _id: quizData.courseId, tutor: tutorId });
        if (!course) {
            throw new Error('Course not found');
        }

        const existingQuiz = await Quiz.findOne({ courseId: quizData.courseId });

        if (existingQuiz) {
            const updateSet = {
                title: quizData.title,
                duration: quizData.duration,
                passingMarks: quizData.passingMarks,
                isPublished: quizData.isPublished,
                questions: quizData.questions.map(({ _id, __v, ...rest }) => rest),
            };
            if (quizData.maxAttempts !== undefined) updateSet.maxAttempts = quizData.maxAttempts;

            return await Quiz.findByIdAndUpdate(
                existingQuiz._id,
                { $set: updateSet },
                { new: true, runValidators: false }
            );
        }

        const cleanQuestions = quizData.questions.map(({ _id, __v, ...rest }) => rest);
        const quiz = new Quiz({ ...quizData, questions: cleanQuestions, tutorId });
        await quiz.save();
        return quiz;
    },

    async updateQuiz(tutorId, quizId, updateData) {
        validateQuizData(updateData);

        const quiz = await Quiz.findOne({ _id: quizId, tutorId });
        if (!quiz) {
            throw new Error('Quiz not found');
        }

        const updateSet = {};
        const allowedUpdates = ['title', 'duration', 'passingMarks', 'maxAttempts', 'isPublished', 'questions'];
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) updateSet[field] = updateData[field];
        });

        if (updateSet.questions) {
            updateSet.questions = updateSet.questions.map(({ _id, __v, ...rest }) => rest);
        }

        return await Quiz.findByIdAndUpdate(
            quizId,
            { $set: updateSet },
            { new: true, runValidators: false }
        );
    },

    async getQuizByCourse(courseId) {
        const quiz = await Quiz.findOne({ courseId });
        if (!quiz) {
            const error = new Error('No quiz found for this course');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }
        return quiz;
    },

    async getStudentQuizStatus(studentId, courseId) {
        const quiz = await Quiz.findOne({ courseId, isPublished: true });
        if (!quiz) {
            const error = new Error('No published quiz available for this course');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        const student = await User.findById(studentId);

        const enrollment = student.studentProfile.enrolledCourses.find(
            ec => ec.courseId.toString() === courseId
        );
        if (!enrollment) throw new Error('Student is not enrolled in this course');

        //Course Completion Check
        const totalLessons = await Lesson.countDocuments({ course: courseId });
        const completedLessonsCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
        const isCourseCompleted = totalLessons > 0 && completedLessonsCount >= totalLessons;

        //Cool-down Check
        const attempts = await QuizAttempt.find({ studentId, quizId: quiz._id }).sort({ createdAt: -1 });
        let cooldownActive = false;
        let cooldownEndsAt = null;

        if (attempts.length > 0) {
            const lastAttempt = attempts[0];
            if (!lastAttempt.passed && lastAttempt.submittedAt) {
                const cooldownPeriod = 24 * 60 * 60 * 1000;
                const timeSinceLastAttempt = Date.now() - new Date(lastAttempt.submittedAt).getTime();

                if (timeSinceLastAttempt < cooldownPeriod) {
                    cooldownActive = true;
                    cooldownEndsAt = new Date(new Date(lastAttempt.submittedAt).getTime() + cooldownPeriod);
                }
            }
        }
        return {
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                duration: quiz.duration,
                passingMarks: quiz.passingMarks,
                maxAttempts: quiz.maxAttempts,
                totalQuestions: quiz.questions.length
            },
            isCourseCompleted,
            attempts,
            cooldownActive,
            cooldownEndsAt
        };
    },

    async startAttempt(studentId, quizId) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || !quiz.isPublished) throw new Error('Quiz not found or not published.');
        const status = await this.getStudentQuizStatus(studentId, quiz.courseId.toString());

        if (!status.isCourseCompleted) throw new Error('You must complete all lessons before starting the quiz.');
        if (status.cooldownActive) throw new Error('You are currently in a cool-down period. Please wait 24 hours.');
        if (status.attempts.length >= quiz.maxAttempts) throw new Error('Maximum attempts reached.');

        const ongoingAttempt = status.attempts.find(a => a.status === QUIZ_STATUS.STARTED);
        if (ongoingAttempt) {
            const expectedEndTime = new Date(ongoingAttempt.startTime).getTime() + (quiz.duration * 60 * 1000);
            if (Date.now() < expectedEndTime) return ongoingAttempt;

            ongoingAttempt.status = QUIZ_STATUS.TIMEOUT;
            ongoingAttempt.submittedAt = new Date(expectedEndTime);
            await ongoingAttempt.save();
        }

        const questionsSnapshot = quiz.questions.map(q => ({
            questionId: q._id,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks
        }));

        const newAttempt = new QuizAttempt({
            quizId,
            studentId,
            questionsSnapshot,
            answers: []
        });

        await newAttempt.save();
        return newAttempt;
    },

    async autosaveAttempt(studentId, attemptId, answers) {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId });
        if (!attempt) throw new Error('Attempt not found');
        if (attempt.status !== QUIZ_STATUS.STARTED) {
            throw new Error('Cannot save answers. The quiz is already submitted or timed out.');
        }
        attempt.answers = answers;
        await attempt.save();
        return attempt;
    },

    async submitAttempt(studentId, attemptId, reason = 'submitted') {
        const attempt = await QuizAttempt.findOne({ _id: attemptId, studentId });
        if (!attempt) throw new Error('Attempt not found');
        if (attempt.status !== QUIZ_STATUS.STARTED) {
            return attempt;
        }
        const quiz = await Quiz.findById(attempt.quizId);
        if (!quiz) throw new Error('Original Quiz not found');

        let totalScore = 0;

        attempt.answers.forEach(answer => {
            const originalQuestion = quiz.questions.find(q => q._id.toString() === answer.questionId.toString());
            const snapshotQuestion = attempt.questionsSnapshot.find(q => q.questionId.toString() === answer.questionId.toString());
            if (originalQuestion && snapshotQuestion) {
                if (answer.selectedOptionIndex === originalQuestion.correctOptionIndex) {
                    totalScore += snapshotQuestion.marks;
                }
            }
        });
        attempt.score = totalScore;
        attempt.passed = totalScore >= quiz.passingMarks;

        if (attempt.passed) {
            const student = await User.findById(studentId);
            let studentNeedsSave = false;

            const enrollment = student.studentProfile.enrolledCourses.find(
                ec => ec.courseId.toString() === quiz.courseId.toString()
            );

            if (enrollment && enrollment.progress !== 100) {
                const totalLessons = await Lesson.countDocuments({ course: quiz.courseId });
                const completedLessonsCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;

                if (totalLessons === 0 || completedLessonsCount >= totalLessons) {
                    enrollment.progress = 100;
                    studentNeedsSave = true;
                }
            }

            if (student.role === USER_ROLES.STUDENT) {
                const existingCertificate = await Certificate.findOne({
                    student: studentId,
                    course: quiz.courseId
                });

                if (!existingCertificate) {
                    const certificateNumber = `CGN-${crypto.randomUUID()}`;
                    const newCertificate = await Certificate.create({
                        student: studentId,
                        course: quiz.courseId,
                        certificateNumber,
                        score: totalScore,
                        issuedAt: new Date()
                    });
                    student.studentProfile.certificates.push(newCertificate._id);
                    studentNeedsSave = true;
                }
            }

            if (studentNeedsSave) {
                await student.save();
            }
        }


        if (reason === 'auto_submitted_violation') {
            attempt.status = QUIZ_STATUS.AUTO_SUBMISSION_VIOLATION;
        } else if (reason === 'timeout') {
            attempt.status = QUIZ_STATUS.TIMEOUT;
        } else {
            attempt.status = QUIZ_STATUS.SUBMITTED;
        }

        attempt.submittedAt = new Date();
        await attempt.save();

        return attempt;
    }
};

module.exports = quizService;





