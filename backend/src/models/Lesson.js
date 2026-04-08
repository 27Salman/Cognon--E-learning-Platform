const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Lesson title is required'],
            trim: true,
            minlength: [3, 'Lesson title must be at least 3 characters'],
            maxlength: [100, 'Lesson title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Lesson description cannot exceed 500 characters']
        },
        videoUrl: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    if (!v) return true; // allow empty
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'Please provide a valid video URL'
            }
        },
        duration: {
            type: Number,
            min: [0, 'Duration cannot be negative'],
            default: 0 // in minutes
        },
        order: {
            type: Number,
            required: [true, 'Lesson order is required'],
            min: [1, 'Lesson order must be at least 1']
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Lesson must belong to a course']
        },
        thumbnail: {
            type: String,
            default: null
        },
        pdfNotes: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

lessonSchema.index({ course: 1, order: 1 }, { unique: true });
lessonSchema.index({ course: 1, createdAt: -1 });

lessonSchema.methods.toJSON = function() {
    const lesson = this.toObject();
    delete lesson.__v;
    if (lesson.thumbnail) {
        const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        lesson.thumbnailURL = `${BASE_URL}/uploads/lessons/${lesson.thumbnail}`;
    }
    if (lesson.pdfNotes) {
        const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        lesson.pdfNotesURL = `${BASE_URL}/uploads/pdfs/${lesson.pdfNotes}`;
    }
    return lesson;
};

module.exports = mongoose.model('Lesson', lessonSchema);
