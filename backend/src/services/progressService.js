const User = require('../models/User');
const Lesson = require('../models/Lesson');

const progressService = {

    async markLessonComplete(studentId, courseId, lessonId) {
        const student = await User.findById(studentId);
        if (!student) throw new Error('Student not found');

        const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
        if (!lesson) throw new Error('Lesson not found or does not belong to this course');

        const enrollment = student.studentProfile.enrolledCourses.find(
            ec => ec.courseId.toString() === courseId
        );

        if (!enrollment) {
            throw new Error('Student is not enrolled in this course');
        }

        const isAlreadyCompleted = enrollment.completedLessons.some(
            completedId => completedId.toString() === lessonId
        );

        if (isAlreadyCompleted) {
            throw new Error('Lesson already marked as complete');
        }

        enrollment.completedLessons.push(lessonId);

        const totalLessons = await Lesson.countDocuments({ course: courseId });

        enrollment.progress = this.calculateProgress(
            enrollment.completedLessons.length,
            totalLessons
        );

        await student.save();

        return {
            courseId,
            lessonId,
            completedLessons: enrollment.completedLessons.length,
            totalLessons,
            progress: enrollment.progress
        };
    },

    async getCourseProgress(studentId, courseId) {
        const student = await User.findById(studentId);
        if (!student) throw new Error('Student not found');

        const enrollment = student.studentProfile.enrolledCourses.find(
            ec => ec.courseId.toString() === courseId
        );

        if (!enrollment) {
            throw new Error('Student is not enrolled in this course');
        }

        const totalLessons = await Lesson.countDocuments({ course: courseId });

        const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
        
        const lessonsWithStatus = lessons.map(lesson => ({
            ...lesson.toJSON(),
            isCompleted: enrollment.completedLessons.some(
                completedId => completedId.toString() === lesson._id.toString()
            )
        }));

        return {
            courseId,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons.length,
            totalLessons,
            lessons: lessonsWithStatus
        };
    },

    calculateProgress(completedCount, totalCount) {
        if (totalCount === 0) return 0;
        return Math.round((completedCount / totalCount) * 100);
    }

};

module.exports = progressService;
