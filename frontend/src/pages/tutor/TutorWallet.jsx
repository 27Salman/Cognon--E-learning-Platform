import { useState, useEffect, useCallback } from 'react';
import { tutorAPI } from '../../api/tutorAPI';
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function WithdrawModal({ balance, pendingAmount, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const availableBalance = balance - pendingAmount;

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const val = Number(amount);
        if (!val || val <= 0) return toast.error('Enter a valid amount');
        if (val > availableBalance) return toast.error(`Insufficient available balance. Available: ₹${availableBalance.toFixed(2)}`);
        setLoading(true);
        try {
            await tutorAPI.requestWithdrawal(val);
            toast.success('Withdrawal request submitted. Awaiting admin approval.');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-800">Request Withdrawal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-700">
                    Withdrawal requests require admin approval before funds are transferred.
                </div>
                <p className="text-sm text-gray-500 mb-1">
                    Total balance: <span className="font-bold text-gray-800">₹{balance.toFixed(2)}</span>
                </p>
                {pendingAmount > 0 && (
                    <p className="text-sm text-orange-500 mb-1">
                        Pending approval: <span className="font-bold">₹{pendingAmount.toFixed(2)}</span>
                    </p>
                )}
                <p className="text-sm text-green-600 mb-4">
                    Available: <span className="font-bold">₹{availableBalance.toFixed(2)}</span>
                </p>
                <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="1"
                            max={availableBalance}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                            {loading ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TutorWallet() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [page, setPage] = useState(1);
    const [showBalance, setShowBalance] = useState(true);
    const [showWithdraw, setShowWithdraw] = useState(false);

    const fetchWallet = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await tutorAPI.getWallet({ page: p, limit: 10 });
            setWallet(res.data);
        } catch {
            toast.error('Failed to load wallet', { id: 'wallet-error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchWallet(page); }, [fetchWallet, page]);

    const recentTxns = wallet?.transactions?.slice(0, 5) || [];
    const allTxns = wallet?.transactions || [];
    const totalPages = wallet?.pagination?.totalPages || 1;
    const pendingWithdrawals = wallet?.pendingWithdrawals || [];
    const pendingAmount = pendingWithdrawals.reduce((sum, r) => sum + r.amount, 0);
    // 3-day hold amount from backend (tutor earnings not yet released to balance)
    const holdAmount = wallet?.pendingAmount || 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>
                        <p className="text-sm text-gray-500">Manage your earnings and withdrawals</p>
                    </div>
                </div>
                <div className="relative group">
                    <button
                        onClick={() => setShowWithdraw(true)}
                        disabled={!wallet || (wallet.balance - pendingAmount) <= 0}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        Withdraw
                    </button>
                    {wallet && (wallet.balance - pendingAmount) <= 0 && (
                        <div className="absolute right-0 top-10 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-48 hidden group-hover:block z-10 shadow-lg">
                            {wallet.balance <= 0
                                ? 'No balance available to withdraw'
                                : `₹${pendingAmount.toFixed(2)} is pending approval`}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-200 text-sm">
                            <Wallet className="w-4 h-4" />
                            Available Balance
                        </div>
                        <button onClick={() => setShowBalance(v => !v)} className="text-purple-200 hover:text-white">
                            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-3xl font-bold">
                        {loading ? '…' : showBalance ? fmt((wallet?.balance || 0) - pendingAmount) : '₹ ••••••'}
                    </p>
                    <p className="text-xs text-purple-200 mt-1">
                        {pendingAmount > 0 ? `₹${pendingAmount.toFixed(2)} pending approval` : 'Ready to withdraw'}
                    </p>
                </div>

                {/* Confirmed Earnings (totalEarnings minus hold) */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Confirmed Earnings
                    </div>
                    <p className="text-3xl font-bold text-gray-800">
                        {loading ? '…' : fmt((wallet?.totalEarnings || 0) - holdAmount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Released to wallet</p>
                </div>

                {/* On Hold — 3-day hold */}
                <div className="bg-white border border-yellow-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <TrendingUp className="w-4 h-4 text-yellow-500" />
                        On Hold (3-day)
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">
                        {loading ? '…' : fmt(holdAmount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Releases after 3 days</p>
                </div>

                {/* Total Withdrawals */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Total Withdrawals
                    </div>
                    <p className="text-3xl font-bold text-gray-800">
                        {loading ? '…' : fmt(wallet?.totalWithdrawals)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Approved & paid out</p>
                </div>
            </div>

            {/* Pending Withdrawal Requests */}
            {pendingWithdrawals.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-orange-800 mb-3 text-sm">Pending Withdrawal Requests</h3>
                    <div className="space-y-2">
                        {pendingWithdrawals.map(req => (
                            <div key={req._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-orange-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">₹{req.amount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">
                                        Requested {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                    Awaiting Approval
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex border-b border-gray-100">
                    {['overview', 'all'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setPage(1); }}
                            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'overview' ? 'Overview' : 'All Transactions'}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    <h3 className="font-semibold text-gray-700 mb-4">
                        {activeTab === 'overview' ? 'Recent Transactions' : 'All Transactions'}
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (activeTab === 'overview' ? recentTxns : allTxns).length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <Wallet className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
                            <p className="text-gray-400 text-xs mt-1">Transactions will appear here when you receive payments or make withdrawals</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(activeTab === 'overview' ? recentTxns : allTxns).map((txn, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            {txn.type === 'credit'
                                                ? <TrendingUp className="w-4 h-4 text-green-600" />
                                                : <TrendingDown className="w-4 h-4 text-red-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{txn.description}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(txn.createdAt).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {txn.type === 'credit' ? '+' : '-'}{fmt(txn.amount)}
                                        </p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                            txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            txn.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {txn.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination for All Transactions */}
                    {activeTab === 'all' && totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                                        p === page ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showWithdraw && (
                <WithdrawModal
                    balance={wallet?.balance || 0}
                    pendingAmount={pendingAmount}
                    onClose={() => setShowWithdraw(false)}
                    onSuccess={() => fetchWallet(1)}
                />
            )}
        </div>
    );
}
