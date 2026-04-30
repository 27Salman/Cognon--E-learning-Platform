const Wallet = require('../models/Wallet');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const { PLATFORM_COMMISSION } = require('../config/constants');

const walletService = {

    async getOrCreateWallet(userId, ownerType) {
        let wallet = await Wallet.findOne({ owner: userId });
        if (!wallet) {
            wallet = await Wallet.create({
                owner: userId,
                ownerType: ownerType || 'tutor',
                balance: 0,
                totalEarnings: 0,
                totalWithdrawals: 0,
                transactions: []
            });
        }
        return wallet;
    },

    async creditFromOrder(order) {
        for (const item of order.courses) {
            const tutorWallet = await walletService.getOrCreateWallet(item.tutor, 'tutor');
            const amount = item.tutorShare;

            tutorWallet.balance = Math.round((tutorWallet.balance + amount) * 100) / 100;
            tutorWallet.totalEarnings = Math.round((tutorWallet.totalEarnings + amount) * 100) / 100;
            tutorWallet.transactions.push({
                type: 'credit',
                amount,
                description: `Earnings from order ${order.orderId} — ${item.courseTitle}`,
                orderId: order.orderId,
                orderRef: order._id,
                status: 'completed'
            });
            await tutorWallet.save();
        }

        const adminUser = await User.findOne({ role: 'admin' }).select('_id');
        if (adminUser) {
            const adminWallet = await walletService.getOrCreateWallet(adminUser._id, 'admin');
            const platformTotal = order.courses.reduce((sum, item) => sum + (item.platformShare || 0), 0);
            const commissionPct = Math.round(PLATFORM_COMMISSION.RATE * 100);

            adminWallet.balance = Math.round((adminWallet.balance + platformTotal) * 100) / 100;
            adminWallet.totalEarnings = Math.round((adminWallet.totalEarnings + platformTotal) * 100) / 100;
            adminWallet.transactions.push({
                type: 'credit',
                amount: platformTotal,
                description: `Commission from order ${order.orderId} (${commissionPct}%)`,
                orderId: order.orderId,
                orderRef: order._id,
                status: 'completed'
            });
            await adminWallet.save();
        }
    },

    async getWallet(userId, { page = 1, limit = 10, type } = {}) {
        const wallet = await walletService.getOrCreateWallet(userId, null);

        if (!wallet.ownerType) {
            const user = await User.findById(userId).select('role');
            wallet.ownerType = user?.role === 'admin' ? 'admin' : 'tutor';
            await wallet.save();
        }

        let txns = [...wallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (type && ['credit', 'debit'].includes(type)) {
            txns = txns.filter(t => t.type === type);
        }

        const total = txns.length;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const paginated = txns.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        let pendingWithdrawals = [];
        if (wallet.ownerType === 'tutor') {
            pendingWithdrawals = await WithdrawalRequest.find({
                tutor: userId,
                status: 'pending'
            }).sort({ createdAt: -1 });
        }

        return {
            balance: wallet.balance,
            totalEarnings: wallet.totalEarnings,
            totalWithdrawals: wallet.totalWithdrawals,
            ownerType: wallet.ownerType,
            transactions: paginated,
            pendingWithdrawals,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalFiltered: total,
                limit: limitNum
            }
        };
    },

    async requestWithdrawal(tutorId, amount) {
        const wallet = await Wallet.findOne({ owner: tutorId });
        if (!wallet) throw new Error('Wallet not found');
        if (amount <= 0) throw new Error('Withdrawal amount must be greater than 0');

        const pendingTotal = await WithdrawalRequest.aggregate([
            { $match: { tutor: tutorId, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingTotal[0]?.total || 0;
        const availableBalance = wallet.balance - pendingAmount;

        if (amount > availableBalance) {
            throw new Error(`Insufficient available balance. Available: ₹${availableBalance.toFixed(2)} (₹${pendingAmount.toFixed(2)} pending approval)`);
        }

        const request = await WithdrawalRequest.create({
            tutor: tutorId,
            amount,
            status: 'pending'
        });

        return {
            request,
            message: `Withdrawal request of ₹${amount} submitted. Awaiting admin approval.`
        };
    },

    async getPendingWithdrawals({ page = 1, limit = 10, status = 'pending' } = {}) {
        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [requests, total] = await Promise.all([
            WithdrawalRequest.find(query)
                .populate('tutor', 'name email profileImage')
                .populate('processedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            WithdrawalRequest.countDocuments(query)
        ]);

        return {
            requests,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalFiltered: total,
                limit: limitNum
            }
        };
    },

    async approveWithdrawal(requestId, adminId, adminNote = '') {
        const request = await WithdrawalRequest.findById(requestId).populate('tutor', 'name email');
        if (!request) throw new Error('Withdrawal request not found');
        if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

        const wallet = await Wallet.findOne({ owner: request.tutor._id });
        if (!wallet) throw new Error('Tutor wallet not found');
        if (wallet.balance < request.amount) {
            throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance}`);
        }

        wallet.balance = Math.round((wallet.balance - request.amount) * 100) / 100;
        wallet.totalWithdrawals = Math.round((wallet.totalWithdrawals + request.amount) * 100) / 100;
        wallet.transactions.push({
            type: 'debit',
            amount: request.amount,
            description: `Withdrawal approved — ₹${request.amount}`,
            status: 'completed'
        });
        await wallet.save();

        request.status = 'approved';
        request.adminNote = adminNote;
        request.processedAt = new Date();
        request.processedBy = adminId;
        await request.save();

        return { request, message: `Withdrawal of ₹${request.amount} approved for ${request.tutor.name}` };
    },

    async rejectWithdrawal(requestId, adminId, adminNote = '') {
        const request = await WithdrawalRequest.findById(requestId).populate('tutor', 'name email');
        if (!request) throw new Error('Withdrawal request not found');
        if (request.status !== 'pending') throw new Error(`Request is already ${request.status}`);

        request.status = 'rejected';
        request.adminNote = adminNote || 'Rejected by admin';
        request.processedAt = new Date();
        request.processedBy = adminId;
        await request.save();

        return { request, message: `Withdrawal request rejected for ${request.tutor.name}` };
    }
};

module.exports = walletService;
