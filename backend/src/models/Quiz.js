const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        unique: true
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    passingMarks: {
        type: Number,
        required: true,
        min: 1
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true },
        marks: { type: Number, required: true, default: 1, min: 1 },
        explanation: { type: String, default: '' }
    }],
    shuffleQuestions: {
        type: Boolean,
        default: false
    },
    shuffleOptions: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);



