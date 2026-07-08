const crypto = require('crypto');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { QUIZ_STATUS, HTTP_STATUS, USER_ROLES, NOTIFICATION_TYPES, NOTIFICATION_ACTIONS } = require('../config/constants');
const { validateQuizData } = require('../validators/quizValidator');
const Certificate = require("../models/Certificate");
const notificationService = require('./notificationService');


const quizService = {
    async createQuiz(tutorId, quizData) {
        validateQuizData(quizData);

        const course = await Course.findOne({ _id: quizData.courseId, tutor: tutorId });
        if (!course) {
            throw new Error('Course not found');
        }

        const existingQuiz = await Quiz.findOne({ courseId: quizData.courseId });

        if (existingQuiz) {
            const wasPublished = existingQuiz.isPublished;
            const updateSet = {
                title: quizData.title,
                duration: quizData.duration,
                passingMarks: quizData.passingMarks,
                isPublished: quizData.isPublished,
                shuffleQuestions: quizData.shuffleQuestions,
                shuffleOptions: quizData.shuffleOptions,
                questions: quizData.questions.map(({ _id, __v, ...rest }) => rest),
            };
            if (quizData.maxAttempts !== undefined) updateSet.maxAttempts = quizData.maxAttempts;

            const updatedQuiz = await Quiz.findByIdAndUpdate(
                existingQuiz._id,
                { $set: updateSet },
                { new: true, runValidators: false }
            );

            if (!wasPublished && updatedQuiz.isPublished) {
                if (course && course.studentsEnrolled && course.studentsEnrolled.length > 0) {
                    await notificationService.createBulk(course.studentsEnrolled, {
                        type: NOTIFICATION_TYPES.QUIZ_AVAILABLE,
                        title: 'New Quiz Available!',
                        message: `A new quiz has been added to the course you're enrolled in.`,
                        priority: 'high',
                        actionUrl: NOTIFICATION_ACTIONS.QUIZ_AVAILABLE(course._id),
                        data: { courseId: course._id, quizId: updatedQuiz._id }
                    });
                }
            }
            return updatedQuiz;
        }

        const cleanQuestions = quizData.questions.map(({ _id, __v, ...rest }) => rest);
        const quiz = new Quiz({ ...quizData, questions: cleanQuestions, tutorId });
        await quiz.save();

        if (quiz.isPublished) {
            if (course && course.studentsEnrolled && course.studentsEnrolled.length > 0) {
                await notificationService.createBulk(course.studentsEnrolled, {
                    type: NOTIFICATION_TYPES.QUIZ_AVAILABLE,
                    title: 'New Quiz Available!',
                    message: `A new quiz has been added to the course you're enrolled in.`,
                    priority: 'high',
                    actionUrl: NOTIFICATION_ACTIONS.QUIZ_AVAILABLE(course._id),
                    data: { courseId: course._id, quizId: quiz._id }
                });
            }
        }
        return quiz;
    },

    async updateQuiz(tutorId, quizId, updateData) {
        validateQuizData(updateData);

        const quiz = await Quiz.findOne({ _id: quizId, tutorId });
        if (!quiz) {
            throw new Error('Quiz not found');
        }

        const updateSet = { };
        const allowedUpdates = ['title', 'duration', 'passingMarks', 'maxAttempts', 'isPublished', 'shuffleQuestions', 'shuffleOptions', 'questions'];
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) updateSet[field] = updateData[field];
        });

        if (updateSet.questions) {
            updateSet.questions = updateSet.questions.map(({ _id, __v, ...rest }) => rest);
        }

        const wasPublished = quiz.isPublished;

        const updatedQuiz = await Quiz.findByIdAndUpdate(
            quizId,
            { $set: updateSet },
            { new: true, runValidators: false }
        );

        if (!wasPublished && updatedQuiz.isPublished) {
            const course = await Course.findById(updatedQuiz.courseId);
            if (course && course.studentsEnrolled && course.studentsEnrolled.length > 0) {
                await notificationService.createBulk(course.studentsEnrolled, {
                    type: NOTIFICATION_TYPES.QUIZ_AVAILABLE,
                    title: 'New Quiz Available!',
                    message: `A new quiz has been added to the course you're enrolled in.`,
                    priority: 'high',
                    actionUrl: NOTIFICATION_ACTIONS.QUIZ_AVAILABLE(course._id),
                    data: { courseId: course._id, quizId: updatedQuiz._id }
                });
            }
        }

        return updatedQuiz;
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
        let attemptsTodayCount = 0;

        if (attempts.length > 0) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const attemptsToday = attempts.filter(a => new Date(a.createdAt) >= startOfDay);
            attemptsTodayCount = attemptsToday.length;

            const lastAttempt = attempts[0];
            if (!lastAttempt.passed && lastAttempt.submittedAt) {
                const timeSinceLastAttempt = Date.now() - new Date(lastAttempt.submittedAt).getTime();
                
                if (attemptsTodayCount >= quiz.maxAttempts) {
                    const lockPeriod = 24 * 60 * 60 * 1000; // 24 hours lock
                    if (timeSinceLastAttempt < lockPeriod) {
                        cooldownActive = true;
                        cooldownEndsAt = new Date(new Date(lastAttempt.submittedAt).getTime() + lockPeriod);
                    }
                } else {
                    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes cool-down between attempts
                    if (timeSinceLastAttempt < cooldownPeriod) {
                        cooldownActive = true;
                        cooldownEndsAt = new Date(new Date(lastAttempt.submittedAt).getTime() + cooldownPeriod);
                    }
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
            attemptsTodayCount,
            cooldownActive,
            cooldownEndsAt
        };
    },

    async startAttempt(studentId, quizId) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || !quiz.isPublished) throw new Error('Quiz not found or not published.');
        const status = await this.getStudentQuizStatus(studentId, quiz.courseId.toString());

        if (!status.isCourseCompleted) throw new Error('You must complete all lessons before starting the quiz.');
        if (status.cooldownActive) throw new Error('You are currently in a cool-down period. Please wait.');
        if (status.attemptsTodayCount >= quiz.maxAttempts) throw new Error('Maximum attempts reached for today.');

        const ongoingAttempt = status.attempts.find(a => a.status === QUIZ_STATUS.STARTED);
        if (ongoingAttempt) {
            const expectedEndTime = new Date(ongoingAttempt.startTime).getTime() + (quiz.duration * 60 * 1000);
            if (Date.now() < expectedEndTime) return ongoingAttempt;

            ongoingAttempt.status = QUIZ_STATUS.TIMEOUT;
            ongoingAttempt.submittedAt = new Date(expectedEndTime);
            await ongoingAttempt.save();
        }

        // Fisher-Yates shuffle helper 
        const shuffleArray = (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = crypto.randomInt(0, i + 1);
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        let pool = [...quiz.questions];

        if (quiz.shuffleQuestions) {
            pool = shuffleArray(pool);
        }


        //  Build snapshot
        const questionsSnapshot = pool.map(q => {
            if (quiz.shuffleOptions) {
                const indexed = q.options.map((text, i) => ({ text, originalIndex: i }));
                const shuffledIndexed = shuffleArray(indexed);

                const newCorrectIndex = shuffledIndexed.findIndex(
                    o => o.originalIndex === q.correctOptionIndex
                );

                return {
                    questionId: q._id,
                    questionText: q.questionText,
                    options: shuffledIndexed.map(o => o.text),
                    correctOptionIndex: newCorrectIndex,
                    marks: q.marks,
                };
            }

            return {
                questionId: q._id,
                questionText: q.questionText,
                options: q.options,
                correctOptionIndex: q.correctOptionIndex,
                marks: q.marks,
            };
        });

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
                if (answer.selectedOptionIndex === snapshotQuestion.correctOptionIndex) {
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

                    await notificationService.create({
                        recipient: studentId,
                        type: NOTIFICATION_TYPES.CERTIFICATE_GENERATED,
                        title: 'Certificate Earned!',
                        message: `Congratulations! You have earned a certificate for completing the course.`,
                        priority: 'high',
                        actionUrl: NOTIFICATION_ACTIONS.CERTIFICATE_GENERATED(),
                        data: { certificateId: newCertificate._id }
                    });
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

        await notificationService.create({
            recipient: studentId,
            type: NOTIFICATION_TYPES.QUIZ_RESULT,
            title: 'Quiz Result',
            message: `You scored ${attempt.score} in the quiz. You have ${attempt.passed ? 'passed' : 'failed'}.`,
            priority: 'medium',
            actionUrl: NOTIFICATION_ACTIONS.QUIZ_RESULT(quiz.courseId),
            data: { attemptId: attempt._id }
        });

        return attempt;
    }
};

module.exports = quizService;





