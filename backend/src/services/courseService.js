const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const notificationService = require('./notificationService');
const { COURSE_STATUS, NOTIFICATION_TYPES, NOTIFICATION_ACTIONS } = require('../config/constants');

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

const courseService = {

    async createCourse(tutorId, courseData, file){
        const { title, description, price, offerPercentage, category } = courseData;

        const categoryDoc = await Category.findOne({ name: category, isActive: true });
        if (!categoryDoc) {
            throw new Error('The selected category is not available. Please choose an active category.');
        }

        const course = new Course({
            title, 
            description,
            price: price || 0,
            offerPercentage: Number(offerPercentage) || 0,
            category,
            tutor: tutorId,
            thumbnail: file ? file.filename : null
        });

        await course.save();

        await User.findByIdAndUpdate(
            tutorId,
            { $push: { 'tutorProfile.coursesCreated': course._id } }
        );

        return await Course.findById(course._id).populate('tutor', 'name email');
    },

    async updateCourse(courseId, tutorId, updateData, file) {
        const course = await Course.findOne({ _id: courseId, tutor: tutorId });
        if(!course) throw new Error('Course not found or unauthorized');

        const { title, description, price, offerPercentage, category, status } = updateData;

        if(title) course.title = title;
        if(description) course.description = description;
        if(price !== undefined) course.price = price;
        if(offerPercentage !== undefined) course.offerPercentage = Number(offerPercentage) || 0;
        if(category) course.category = category;
        const statusChanged = status && status !== course.status && Object.values(COURSE_STATUS).includes(status);
        if(statusChanged){
            course.status = status;
        }
        if(file) course.thumbnail = file.filename;

        await course.save();

        if (statusChanged) {
            try {
                const tutorUser = await User.findById(tutorId).select('name');
                const tutorName = tutorUser ? tutorUser.name : 'Tutor';
                const admin = await User.findOne({ role: 'admin' }).select('_id');
                if (admin) {
                    await notificationService.create({
                        recipient: admin._id,
                        type: NOTIFICATION_TYPES.COURSE_STATUS_CHANGED,
                        title: `Course status updated by tutor`,
                        message: `Tutor "${tutorName}" has updated "${course.title}" status to "${status}".`,
                        priority: 'medium',
                        actionUrl: NOTIFICATION_ACTIONS.ADMIN_COURSES(),
                        data: { courseId: course._id, status }
                    });
                }
            } catch (err) {
                console.error('Failed to notify admin on course status change:', err.message);
            }
        }

        const change = title || description;
        if (change && course.studentsEnrolled?.length > 0) {
            await notificationService.createBulk(course.studentsEnrolled, {
                type: NOTIFICATION_TYPES.COURSE_CONTENT_UPDATED,
                title: `"${course.title}" has been updated`,
                message: 'Your enrolled course has been updated by the tutor.',
                priority: 'low',
                actionUrl: NOTIFICATION_ACTIONS.STUDENT_MY_COURSES(),
                data: { courseId: course._id }
            });
        }

        return await Course.findById(course._id).populate('tutor', 'name email');
    },

    async deleteCourse(courseId, tutorId) {
        const course = await Course.findOne({ _id: courseId, tutor: tutorId });
        if(!course) throw new Error('Course not found or unauthorized');

        if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
            throw new Error(`Cannot delete this course — ${course.studentsEnrolled.length} student(s) are enrolled. Set it to draft or archived instead.`);
        }

        await Lesson.deleteMany({ course: courseId });

        await Cart.updateMany({}, { $pull: { items: { course: courseId } } });
        await Wishlist.updateMany({}, { $pull: { courses: courseId } });

        await User.findByIdAndUpdate(
            tutorId,
            { $pull: { 'tutorProfile.coursesCreated': courseId } }
        );

        await Course.findByIdAndDelete(courseId);
        return { message: 'Course deleted successfully' };
    },

    async getTutorCourses(tutorId, page = 1, limit = 5){
        const skip = (page - 1) * limit;

        const courses = await Course.find({ tutor: tutorId })
            .populate('tutor', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await Course.countDocuments({ tutor: tutorId });

        return {
            courses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalCourses: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    },

    async getAllPublishedCourses(filters = {}, page = 1, limit = 5){
        const skip = (page -1) * limit;
        const query = { status: COURSE_STATUS.PUBLISHED };

        if(filters.category){
            query.category = new RegExp(filters.category, 'i');
        }

        const courses = await Course.find(query)
            .populate('tutor', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Course.countDocuments(query);

        return {
            courses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalCourses: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        }; 
    },

    async getCourseById(courseId, userId = null, userRole = null) {
        const course = await Course.findById(courseId)
            .populate('tutor', 'name email profileImage tutorProfile totalCourses totalStudents');

        if (!course) throw new Error('Course not found');

        const isEnrolled = userId ? course.studentsEnrolled.some(id => id.toString() === userId) : false;
        const isOwner = userId ? course.tutor._id.toString() === userId : false;

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            if (!isOwner && !isEnrolled) {
                throw new Error('Course not available');
            }
        }

        const lessons = await Lesson.find({ course: courseId }).sort({ 'chapter.order': 1, order: 1 });

        const sanitizedLessons = lessons.map(l => {
            const lesson = l.toJSON();
            if (!isEnrolled && !isOwner) {
                delete lesson.videoUrl;
                delete lesson.pdfNotes;
                delete lesson.pdfNotesURL;
            }
            return lesson;
        });
        
        const courseObj = course.toJSON();
        delete courseObj.studentsEnrolled;
        return {
            ...courseObj,
            lessons: sanitizedLessons,
            chapters: groupByChapter(sanitizedLessons),
            isEnrolled
        };
    },

    //Student 
    async enrollStudent(courseId, studentId){
        const course = await Course.findById(courseId);
        if(!course) throw new Error('Course not found');

        if(course.status !== COURSE_STATUS.PUBLISHED){
            throw new Error('Course is not available for enrollment');
        }

        if(course.studentsEnrolled.includes(studentId)){
            throw new Error('Already enrolled in this course');
        }

        course.studentsEnrolled.push(studentId);
        await course.save();

        await User.findByIdAndUpdate(
            studentId,
            {
                $push: {
                    'studentProfile.enrolledCourses': {
                        courseId: courseId,
                        enrolledAt: new Date(),
                        progress: 0
                    }
                }
            }
        );

        return await Course.findById(courseId).populate('tutor', 'name email');
    },

    async getEnrolledCourses(studentId, page = 1, limit = 5) {
        const skip = (page - 1) * limit;
        
        const student = await User.findById(studentId)
            .populate({
                path: 'studentProfile.enrolledCourses.courseId',
                populate: {
                    path: 'tutor',
                    select: 'name email'
                }
            });

        if (!student) throw new Error('Student not found');

        const enrolledCourses = student.studentProfile.enrolledCourses
            .filter(enrollment => enrollment.courseId != null) // skip deleted courses
            .slice(skip, skip + limit)
            .map(enrollment => ({
                ...enrollment.courseId.toJSON(),
                enrolledAt: enrollment.enrolledAt,
                progress: enrollment.progress
            }));

        const total = student.studentProfile.enrolledCourses.filter(e => e.courseId != null).length;

        return {
            courses: enrolledCourses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalCourses: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    },

    async checkEnrollmentStatus(studentId, courseId){
        const student = await User.findById(studentId);
        if(!student) throw new Error('Student not found');

        const enrollment = student.studentProfile.enrolledCourses.find(
            ec => ec.courseId.toString() === courseId
        );

        if(!enrollment){
            return { isEnrolled: false, progress: 0, completedLessons: [] }
        }

        return {
            isEnrolled: true,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons
        };
    },

}

module.exports = courseService;




