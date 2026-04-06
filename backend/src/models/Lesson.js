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
                    return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
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
    return lesson;
};

module.exports = mongoose.model('Lesson', lessonSchema);
