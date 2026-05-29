const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        courses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }],
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

wishlistSchema.index({ user: 1 });

wishlistSchema.virtual('totalItems').get(function () {
    return this.courses.length;
});

wishlistSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

wishlistSchema.methods.toJSON = function () {
    const wishlist = this.toObject();
    delete wishlist.__v;
    return wishlist;
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
