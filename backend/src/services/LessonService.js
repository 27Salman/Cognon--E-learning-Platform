const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

const lessonService = {
    async createLesson(courseId, tutorId, lessonData) {
        const { title, description, videoUrl, duration, order } = lessonData;

        const course = await Course.findOne({ _id: courseId, tutor: tutorId });
        if (!course) throw new Error('Course not found or unauthorized');

        const existingLesson = await Lesson.findOne({ course: courseId, order });
        if (existingLesson) {
            throw new Error(`Lesson with order ${order} already exists for this course`);
        }

        const lesson = new Lesson({
            title,
            description,
            videoUrl,
            duration: duration || 0,
            order,
            course: courseId
        });

        await lesson.save();

        await this.updateCourseTotals(courseId);

        return await Lesson.findById(lesson._id).populate('course', 'title');
    },

    async updateLesson(lessonId, tutorId, updateData) {
        const lesson = await Lesson.findById(lessonId).populate('course');
        if (!lesson) throw new Error('Lesson not found');

        if (lesson.course.tutor.toString() !== tutorId) {
            throw new Error('Unauthorized to update this lesson');
        }

        const { title, description, videoUrl, duration, order } = updateData;

        if (order && order !== lesson.order) {
            const existingLesson = await Lesson.findOne({ 
                course: lesson.course._id, 
                order,
                _id: { $ne: lessonId }
            });
            if (existingLesson) {
                throw new Error(`Lesson with order ${order} already exists for this course`);
            }
        }

        if (title) lesson.title = title;
        if (description !== undefined) lesson.description = description;
        if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
        if (duration !== undefined) lesson.duration = duration;
        if (order) lesson.order = order;

        await lesson.save();

        await this.updateCourseTotals(lesson.course._id);

        return await Lesson.findById(lesson._id).populate('course', 'title');
    },

    async deleteLesson(lessonId, tutorId) {
        const lesson = await Lesson.findById(lessonId).populate('course');
        if (!lesson) throw new Error('Lesson not found');

        if (lesson.course.tutor.toString() !== tutorId) {
            throw new Error('Unauthorized to delete this lesson');
        }

        const courseId = lesson.course._id;
        await Lesson.findByIdAndDelete(lessonId);

        await this.updateCourseTotals(courseId);

        return { message: 'Lesson deleted successfully' };
    },

    async getLessonsByCourse(courseId, userId = null, userRole = null) {
        const course = await Course.findById(courseId);
        if (!course) throw new Error('Course not found');

        const isOwner = userId && course.tutor.toString() === userId;
        const isEnrolled = userId && course.studentsEnrolled.includes(userId);
        const isPublished = course.status === 'published';

        if (!isOwner && !isEnrolled && !isPublished) {
            throw new Error('Access denied to course lessons');
        }

        const lessons = await Lesson.find({ course: courseId })
            .sort({ order: 1 })
            .populate('course', 'title status');

        return lessons;
    },

    async getLessonById(lessonId, userId = null, userRole = null) {
        const lesson = await Lesson.findById(lessonId).populate('course');
        if (!lesson) throw new Error('Lesson not found');

        const isOwner = userId && lesson.course.tutor.toString() === userId;
        const isEnrolled = userId && lesson.course.studentsEnrolled.includes(userId);
        const isPublished = lesson.course.status === 'published';

        if (!isOwner && !isEnrolled && !isPublished) {
            throw new Error('Access denied to this lesson');
        }

        return lesson;
    },

    async reorderLessons(courseId, tutorId, lessonOrders) {
        const course = await Course.findOne({ _id: courseId, tutor: tutorId });
        if (!course) throw new Error('Course not found or unauthorized');

        const updatePromises = lessonOrders.map(({ lessonId, order }) =>
            Lesson.findOneAndUpdate(
                { _id: lessonId, course: courseId },
                { order },
                { new: true }
            )
        );

        await Promise.all(updatePromises);

        return await Lesson.find({ course: courseId }).sort({ order: 1 });
    },

    async updateCourseTotals(courseId) {
        const lessons = await Lesson.find({ course: courseId });
        
        const totalLessons = lessons.length;
        const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

        await Course.findByIdAndUpdate(courseId, {
            totalLessons,
            totalDuration
        });
    }
};

module.exports = lessonService;
