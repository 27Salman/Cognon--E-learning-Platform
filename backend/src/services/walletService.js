const Wallet = require('../models/Wallet');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');
const { PLATFORM_COMMISSION, TUTOR_HOLD_DAYS } = require('../config/constants');

const round = (n) => Math.round(n * 100) / 100;

const walletService = {

    async getOrCreateWallet(userId, ownerType) {
        let wallet = await Wallet.findOne({ owner: userId });
        if (!wallet) {
            if (!ownerType) {
                throw new Error('ownerType is required when creating a new wallet');
            }
            wallet = await Wallet.create({
                owner: userId,
                ownerType,
                balance: 0,
                totalEarnings: 0,
                totalWithdrawals: 0,
                transactions: []
            });
        }
        return wallet;
    },


    async creditFromOrder(order) {
        const releaseAt = new Date(Date.now() + TUTOR_HOLD_DAYS * 24 * 60 * 60 * 1000);

        // Tutor hold
        for (const item of order.courses) {
            const tutorWallet = await walletService.getOrCreateWallet(item.tutor, 'tutor');
            tutorWallet.totalEarnings = round(tutorWallet.totalEarnings + item.tutorShare);
            tutorWallet.transactions.push({
                type: 'credit',
                amount: item.tutorShare,
                description: `Earnings from order ${order.orderId} — ${item.courseTitle}`,
                orderId: order.orderId,
                orderRef: order._id,
                status: 'pending',
                releaseAt
            });
            await tutorWallet.save();
        }

        // Admin escrow
        const adminUser = await User.findOne({ role: 'admin' }).select('_id');
        if (adminUser) {
            const adminWallet = await walletService.getOrCreateWallet(adminUser._id, 'admin');
            const platformTotal = round(
                order.courses.reduce((sum, item) => sum + (item.platformShare || 0), 0)
            );
            const commissionPct = Math.round(PLATFORM_COMMISSION.RATE * 100);

            adminWallet.totalEarnings = round(adminWallet.totalEarnings + order.finalAmount);
            adminWallet.transactions.push({
                type: 'credit',
                amount: order.finalAmount,       // escrow amount
                platformShare: platformTotal,    
                description: `Order ${order.orderId} — escrow (${commissionPct}% commission)`,
                orderId: order.orderId,
                orderRef: order._id,
                status: 'pending',
                releaseAt
            });
            await adminWallet.save();
        }
    },

    async releaseMatureHolds(wallet) {
        const now = new Date();
        let released = 0;

        for (const txn of wallet.transactions) {
            if (txn.status === 'pending' && txn.releaseAt && txn.releaseAt <= now) {
                txn.status = 'completed';
                if (wallet.ownerType === 'admin') {
                    const toRelease = txn.platformShare != null
                        ? txn.platformShare
                        : round(txn.amount * PLATFORM_COMMISSION.RATE);
                    released = round(released + toRelease);
                } else {
                    released = round(released + txn.amount);
                }
            }
        }

        if (released > 0) {
            wallet.balance = round(wallet.balance + released);
            await wallet.save();
        }

        return released;
    },


    async reverseEarning(tutorId, orderRef, amount) {
        const wallet = await Wallet.findOne({ owner: tutorId });
        if (!wallet) throw new Error('Tutor wallet not found');

        const transaction = wallet.transactions.find(
            t => t.orderRef?.toString() === orderRef.toString()
        );

        if (!transaction) throw new Error('Earning transaction not found for this order');
        if (transaction.status === 'refunded' || transaction.status === 'cancelled') {
            throw new Error('This earning has already been reversed');
        }

        const now = new Date();
        const isStillHeld = transaction.releaseAt && transaction.releaseAt > now;

        if (isStillHeld) {
            transaction.status = 'cancelled';
            wallet.totalEarnings = round(wallet.totalEarnings - amount);
        } else {
            transaction.status = 'refunded';
            wallet.balance = round(wallet.balance - amount);
            wallet.totalEarnings = round(wallet.totalEarnings - amount);
        }

        await wallet.save();
        return { message: 'Tutor earning reversed', wasHeld: isStillHeld };
    },

    async reverseAdminEscrow(orderRef, fullAmount) {
        const adminUser = await User.findOne({ role: 'admin' }).select('_id');
        if (!adminUser) return;

        const wallet = await Wallet.findOne({ owner: adminUser._id });
        if (!wallet) return;

        const transaction = wallet.transactions.find(
            t => t.orderRef?.toString() === orderRef.toString()
        );

        if (!transaction) return; 
        if (transaction.status === 'cancelled' || transaction.status === 'refunded') return;

        const now = new Date();
        const isStillHeld = transaction.releaseAt && transaction.releaseAt > now;

        if (isStillHeld) {
            transaction.status = 'cancelled';
            wallet.totalEarnings = round(wallet.totalEarnings - fullAmount);
        } else {
            transaction.status = 'refunded';
            const commission = transaction.platformShare != null
                ? transaction.platformShare
                : round(fullAmount * PLATFORM_COMMISSION.RATE);
            wallet.balance = round(wallet.balance - commission);
            wallet.totalEarnings = round(wallet.totalEarnings - fullAmount);
        }

        await wallet.save();
    },

    async refundToStudent(studentId, amount, orderId) {
        const studentWallet = await walletService.getOrCreateWallet(studentId, 'student');
        studentWallet.balance = round(studentWallet.balance + amount);
        studentWallet.transactions.push({
            type: 'credit',
            amount,
            description: `Refund for order ${orderId}`,
            orderId,
            status: 'completed'
        });
        await studentWallet.save();
        return { message: 'Refund processed successfully', refundAmount: amount };
    },

    async getStudentWallet(userId) {
        const wallet = await walletService.getOrCreateWallet(userId, 'student');
        const transactions = [...(wallet.transactions || [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
            balance: round(wallet.balance),
            totalEarnings: round(wallet.totalEarnings || 0),
            totalWithdrawals: round(wallet.totalWithdrawals || 0),
            ownerType: 'student',
            transactions,
        };
    },

    async getWallet(userId, { page = 1, limit = 10, type } = {}) {
       
        const user = await User.findById(userId).select('role');
        const actualOwnerType = user?.role === 'admin' ? 'admin' : 'tutor';

        const wallet = await walletService.getOrCreateWallet(userId, actualOwnerType);

        if (wallet.ownerType !== actualOwnerType) {
            wallet.ownerType = actualOwnerType;
            await wallet.save();
        }

        if (actualOwnerType === 'tutor') {
            return await walletService.getWalletWithHold(userId, 'tutor');
        }

        // Admin wallet
        await walletService.releaseMatureHolds(wallet);
        const freshWallet = await Wallet.findOne({ owner: userId });

        const now = new Date();

        const pendingEscrow = round(
            freshWallet.transactions
                .filter(t => t.status === 'pending' && t.type === 'credit')
                .reduce((sum, t) => {
                    const commission = t.platformShare != null
                        ? t.platformShare
                        : round(t.amount * PLATFORM_COMMISSION.RATE);
                    return sum + commission;
                }, 0)
        );

        let txns = [...freshWallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (type && ['credit', 'debit'].includes(type)) {
            txns = txns.filter(t => t.type === type);
        }

        const total = txns.length;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
        const paginated = txns.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        const paidOutAgg = await WithdrawalRequest.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalPaidOut = round(paidOutAgg[0]?.total || 0);

        return {
            balance: freshWallet.balance,
            totalEarnings: freshWallet.totalEarnings,
            totalPaidOut,
            ownerType: freshWallet.ownerType,
            pendingAmount: 0,
            pendingEscrow,   
            availableBalance: freshWallet.balance,
            transactions: paginated,
            pendingWithdrawals: [],
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalFiltered: total,
                limit: limitNum
            }
        };
    },

    async getWalletWithHold(userId, ownerType) {
        const wallet = await walletService.getOrCreateWallet(userId, ownerType);

        await walletService.releaseMatureHolds(wallet);
        const freshWallet = await Wallet.findOne({ owner: userId });

        const now = new Date();
        const pendingAmount = round(
            freshWallet.transactions
                .filter(t => t.status === 'pending' && t.releaseAt && t.releaseAt > now)
                .reduce((sum, t) => sum + t.amount, 0)
        );

        const availableBalance = round(freshWallet.balance);

        let txns = [...freshWallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const total = txns.length;
        const paginated = txns.slice(0, 10);

        let pendingWithdrawals = [];
        if (ownerType === 'tutor') {
            pendingWithdrawals = await WithdrawalRequest.find({
                tutor: userId,
                status: 'pending'
            }).sort({ createdAt: -1 });
        }

        return {
            balance: freshWallet.balance,
            totalEarnings: freshWallet.totalEarnings,
            totalWithdrawals: freshWallet.totalWithdrawals,
            ownerType: freshWallet.ownerType,
            pendingAmount,
            availableBalance,
            transactions: paginated,
            pendingWithdrawals,
            pagination: {
                currentPage: 1,
                totalPages: Math.ceil(total / 10),
                totalFiltered: total,
                limit: 10
            }
        };
    },

    async requestWithdrawal(tutorId, amount) {
        const wallet = await Wallet.findOne({ owner: tutorId });
        if (!wallet) throw new Error('Wallet not found');
        if (amount <= 0) throw new Error('Withdrawal amount must be greater than 0');

        await walletService.releaseMatureHolds(wallet);
        const freshWallet = await Wallet.findOne({ owner: tutorId });

        const pendingTotal = await WithdrawalRequest.aggregate([
            { $match: { tutor: tutorId, status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingWithdrawalAmount = pendingTotal[0]?.total || 0;
        const availableBalance = round(freshWallet.balance - pendingWithdrawalAmount);

        if (amount > availableBalance) {
            throw new Error(
                `Insufficient available balance. Available: ₹${availableBalance.toFixed(2)}` +
                (pendingWithdrawalAmount > 0 ? ` (₹${pendingWithdrawalAmount.toFixed(2)} pending approval)` : '')
            );
        }

        const request = await WithdrawalRequest.create({ tutor: tutorId, amount, status: 'pending' });
        return { request, message: `Withdrawal request of ₹${amount} submitted. Awaiting admin approval.` };
    },

    async getPendingWithdrawals({ page = 1, limit = 10, status = 'pending' } = {}) {
        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) query.status = status;

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

        const requestsWithBalance = await Promise.all(
            requests.map(async (req) => {
                const reqObj = req.toObject();
                if (req.tutor?._id) {
                    const tutorWallet = await Wallet.findOne({ owner: req.tutor._id }).select('balance');
                    reqObj.tutorBalance = tutorWallet ? round(tutorWallet.balance) : 0;
                } else {
                    reqObj.tutorBalance = 0;
                }
                return reqObj;
            })
        );

        return {
            requests: requestsWithBalance,
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

        wallet.balance = round(wallet.balance - request.amount);
        wallet.totalWithdrawals = round(wallet.totalWithdrawals + request.amount);
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
    },
};

module.exports = walletService;
