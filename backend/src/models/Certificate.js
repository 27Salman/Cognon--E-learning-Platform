const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true
    },
    score: {
        type: Number,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Certificate', certificateSchema)


