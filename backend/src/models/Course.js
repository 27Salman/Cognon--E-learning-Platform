const mongoose = require('mongoose');
const { COURSE_STATUS } = require('../config/constants');

const courseSchema = new mongoose.Schema(
    {
        tittle: {
            type: String,
            required: [true, 'Course tittle is required'],
            trim: true,
            minlength: [3, 'Course tittle must be at leat 3 characters'],
            maxlength: [3, 'Course tittle cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
            trim: true,
            minlength: [10, 'Course description must be at least 10 characters'],
            maxlength: [1000, 'Course description cannot exceed 1000 characters']
        },
        price: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative']
        },
        category: {
            type: String,
            required: [true, 'Course category is required'],
            trim: true
        },
        thumbnail: {
            typr: String,
            default: null
        },
        tutor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Course must have a tutor']
        },
        studentsEnrolled: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: {
                values: Object.values(COURSE_STATUS),
                message: 'Invalid course status'
            },
            default: COURSE_STATUS.DRAFT
        },
        totalLessons: {
            type: Number,
            default: 0
        },
        totalDuration: {
            type: Number,
            default: 0 // in minutes
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

courseSchema.virtual('enrolledCount').get(function() {
    return this.studentsEnrolled ? this.studentsEnrolled.length : 0;
});

courseSchema.virtual('thumbnailURL').get(function() {
    if (!this.thumbnail) return null;
    if (this.thumbnail.startsWith('http')) return this.thumbnail;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/${this.thumbnail}`;
});

courseSchema.index({ tutor: 1, status: 1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ status: 1, createdAt: -1 });

courseSchema.methods.toJSON = function() {
    const course = this.toObject();
    delete course.__v;
    
    if (course.thumbnail) {
        course.thumbnailURL = this.thumbnailURL;
    }
    
    return course;
};

module.exports = mongoose.model('Course', courseSchema);



