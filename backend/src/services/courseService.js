const Course = require('../models/Course');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const { COURSE_STATUS } = require('../config/constants');

const courseService = {

    async createCourse(tutorId, courseData, file){
        const { title, description, price, category } = courseData;

        const course = new Course({
            title, 
            description,
            price: price || 0,
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

        const { title, description, price, category, status } = updateData;

        if(title) course.title = title;
        if(description) course.description = description;
        if(price !== undefined) course.price = price;
        if(category) course.category = category;
        if(status && Object.values(COURSE_STATUS).includes(status)){
            course.status = status;
        }
        if(file) course.thumbnail = file.filename;

        await course.save();
        return await Course.findById(course._id).populate('tutor', 'name email');
    },

    async deleteCourse(courseId, tutorId) {
        const course = await Course.findOne({ _id: courseId, tutor: tutorId });
        if(!course) throw new Error('Course not found or unauthorized');

        await Lesson.deleteMany({ course: courseId });

        await User.findByIdAndUpdate(
            tutorId,
            { $pull: { 'tutorProfile.coursesCreated': courseId } }
        );

        await User.updateMany(
            { 'studentProfile.enrolledCourses.courseId': courseId },
            { $pull: { 'studentProfile.enrolledCourses': { courseId: courseId } } }
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
            .populate('tutor', 'name email profileImage tutorProfile')
            .populate('studentsEnrolled', 'name email');

        if (!course) throw new Error('Course not found');

        if (course.status !== COURSE_STATUS.PUBLISHED) {
            if (!userId || course.tutor._id.toString() !== userId) {
                throw new Error('Course not available');
            }
        }

        const isEnrolled = userId ? course.studentsEnrolled.some(s => s._id.toString() === userId) : false;
        const isOwner = userId ? course.tutor._id.toString() === userId : false;

        const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

        // Strip sensitive content for unenrolled users
        const sanitizedLessons = lessons.map(l => {
            const lesson = l.toJSON();
            if (!isEnrolled && !isOwner) {
                delete lesson.videoUrl;
                delete lesson.pdfNotes;
                delete lesson.pdfNotesURL;
            }
            return lesson;
        });
        
        return {
            ...course.toJSON(),
            lessons: sanitizedLessons,
            isEnrolled
        };
    },

    //Student enrollment
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
            .slice(skip, skip + limit)
            .map(enrollment => ({
                ...enrollment.courseId.toJSON(),
                enrolledAt: enrollment.enrolledAt,
                progress: enrollment.progress
            }));

        const total = student.studentProfile.enrolledCourses.length;

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




