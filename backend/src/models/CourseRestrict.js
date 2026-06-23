const mongoose = require('mongoose');

const couseRestrictSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required: true,
    },
    refundCount: {
        type: Number,
        default: 0
    },
    blocked:{
        type: Boolean,
        default: false
    },
    blockedAt: {
        type: Date,
    }

},{
    timestamps: true
})

module.exports = mongoose.model('CourseRestrict', couseRestrictSchema);
