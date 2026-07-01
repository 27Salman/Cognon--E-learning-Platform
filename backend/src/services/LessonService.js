const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const path = require('path');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES, NOTIFICATION_ACTIONS } = require('../config/constants');

function groupByChapter(lessons) {
    const map = {};
    for (const lesson of lessons) {
        const key = lesson.chapter?.order ?? 1;
        if (!map[key]) {
            map[key] = { order: key, title: lesson.chapter?.title ?? 'Chapter 1', lessons: [] };
        }
        map[key].lessons.push(lesson);
    }
    return Object.values(map)
        .sort((a, b) => a.order - b.order)
        .map(ch => ({ ...ch, lessons: ch.lessons.sort((a, b) => a.order - b.order) }));
}

const lessonService = {
    async createLesson(courseId, tutorId, lessonData, files = {}) {
        const { title, description, videoUrl, duration, order, chapterTitle, chapterOrder } = lessonData;

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
            course: courseId,
            chapter: {
                title: chapterTitle || 'Chapter 1',
                order: parseInt(chapterOrder) || 1
            },
            thumbnail: files.thumbnail ? files.thumbnail[0].filename : null,
            pdfNotes: files.pdfNotes ? files.pdfNotes[0].filename : null,
        });

        await lesson.save();

        await lessonService.updateCourseTotals(courseId);

        const enrolledCourse = await Course.findById(courseId).select('studentsEnrolled title');
        if (enrolledCourse?.studentsEnrolled?.length > 0) {
            await notificationService.createBulk(enrolledCourse.studentsEnrolled, {
                type: NOTIFICATION_TYPES.COURSE_CONTENT_UPDATED,
                title: `New lesson added to "${enrolledCourse.title}"`,
                message: `A new lesson "${title}" has been added to your enrolled course.`,
                priority: 'low',
                actionUrl: NOTIFICATION_ACTIONS.STUDENT_MY_COURSES(),
                data: { courseId, lessonId: lesson._id, lessonTitle: title }
            });
        }

        return await Lesson.findById(lesson._id).populate('course', 'title');
    },

    async updateLesson(lessonId, tutorId, updateData, files = {}) {
        const lesson = await Lesson.findById(lessonId).populate('course');
        if (!lesson) throw new Error('Lesson not found');

        if (lesson.course.tutor.toString() !== tutorId) {
            throw new Error('Unauthorized to update this lesson');
        }

        const { title, description, videoUrl, duration, order, chapterTitle, chapterOrder } = updateData;

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
        if (chapterTitle !== undefined || chapterOrder !== undefined) {
            lesson.chapter = {
                title: chapterTitle ?? lesson.chapter?.title ?? 'Chapter 1',
                order: parseInt(chapterOrder) || lesson.chapter?.order || 1
            };
        }
        if (files.thumbnail) lesson.thumbnail = files.thumbnail[0].filename;
        if (files.pdfNotes) lesson.pdfNotes = files.pdfNotes[0].filename;

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
            .sort({ 'chapter.order': 1, order: 1 })
            .populate('course', 'title status');

        const mappedLessons = lessons.map(l => {
            const lesson = l.toJSON();
            if (!isOwner && !isEnrolled) {
                delete lesson.videoUrl;
                delete lesson.pdfNotes;
                delete lesson.pdfNotesURL;
            }
            return lesson;
        });

        return {
            lessons: mappedLessons,
            chapters: groupByChapter(mappedLessons)
        };
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

        const lessonData = lesson.toJSON();
        if (!isOwner && !isEnrolled) {
            delete lessonData.videoUrl;
            delete lessonData.pdfNotes;
            delete lessonData.pdfNotesURL;
        }
        return lessonData;
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

    async getPdfFilePath(lessonId, userId) {
        const lesson = await Lesson.findById(lessonId).populate('course');

        if (!lesson || !lesson.pdfNotes) {
            throw new Error('PDF not found');
        }

        const isOwner = lesson.course.tutor.toString() === userId;
        const isEnrolled = lesson.course.studentsEnrolled.map(s => s.toString()).includes(userId);

        if (!isOwner && !isEnrolled) {
            const err = new Error('Enroll in this course to access the PDF');
            err.statusCode = 403;
            throw err;
        }

        return path.join(__dirname, '../uploads/pdfs', lesson.pdfNotes);
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
