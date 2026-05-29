const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    orderId: {
        type: String  
    },
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    platformShare: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed', 'refunded', 'cancelled'],
        default: 'completed'
    },
    releaseAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const walletSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        ownerType: {
            type: String,
            enum: ['admin', 'tutor','student'],
            required: true
        },
        balance: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        totalWithdrawals: {
            type: Number,
            default: 0
        },
        transactions: [walletTransactionSchema]
    },
    { timestamps: true }
);

walletSchema.index({ owner: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
