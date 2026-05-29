import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api/adminAPI';
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, Filter, Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

//Reject Modal 
function RejectModal({ request, onClose, onSuccess }) {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReject = async (e) => {
        e.preventDefault();
        if (!note.trim()) return toast.error('Please provide a reason for rejection');
        setLoading(true);
        try {
            await adminAPI.rejectWithdrawal(request._id, note);
            toast.success('Withdrawal request rejected');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Reject Withdrawal</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Rejecting <span className="font-bold">{fmt(request.amount)}</span> request from <span className="font-bold">{request.tutor?.name}</span>
                </p>
                <form onSubmit={handleReject} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            placeholder="e.g. Bank details not verified"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                            {loading ? 'Rejecting…' : 'Reject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

//Main Component 
export default function AdminWallet() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [page, setPage] = useState(1);
    const [showBalance, setShowBalance] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [showFilter, setShowFilter] = useState(false);

    // Withdrawal requests
    const [withdrawals, setWithdrawals] = useState([]);
    const [wPage, setWPage] = useState(1);
    const [wStatus, setWStatus] = useState('pending');
    const [wLoading, setWLoading] = useState(false);
    const [wPagination, setWPagination] = useState({});
    const [rejectTarget, setRejectTarget] = useState(null);
    const [approvingId, setApprovingId] = useState(null);

    const fetchWallet = useCallback(async (p = 1, type = '') => {
        setLoading(true);
        try {
            const params = { page: p, limit: 5 };
            if (type) params.type = type;
            const res = await adminAPI.getWallet(params);
            setWallet(res.data);
        } catch {
            toast.error('Failed to load wallet', { id: 'admin-wallet-error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchWithdrawals = useCallback(async (p = 1, status = 'pending') => {
        setWLoading(true);
        try {
            const res = await adminAPI.getWithdrawalRequests({ page: p, limit: 5, status });
            setWithdrawals(res.data.requests || []);
            setWPagination(res.data.pagination || {});
        } catch {
            toast.error('Failed to load withdrawal requests');
        } finally {
            setWLoading(false);
        }
    }, []);

    useEffect(() => { fetchWallet(page, filterType); }, [fetchWallet, page, filterType]);
    useEffect(() => { fetchWithdrawals(wPage, wStatus); }, [fetchWithdrawals, wPage, wStatus]);

    const handleApprove = async (id) => {
        setApprovingId(id);
        try {
            await adminAPI.approveWithdrawal(id);
            toast.success('Withdrawal approved');
            fetchWithdrawals(wPage, wStatus);
            fetchWallet(page, filterType); // refresh admin wallet balance
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally {
            setApprovingId(null);
        }
    };

    const recentTxns = wallet?.transactions?.slice(0, 5) || [];
    const allTxns = wallet?.transactions || [];
    const totalPages = wallet?.pagination?.totalPages || 1;
    const pendingCount = wStatus === 'pending' ? withdrawals.length : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Wallet Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage platform earnings and tutor payments</p>
            </div>

            {/* Admin Wallet section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">Admin Wallet</h2>
                        <p className="text-xs text-gray-500">Platform commission earnings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-purple-200 text-sm">
                                <Wallet className="w-4 h-4" /> Current Balance
                            </div>
                            <button onClick={() => setShowBalance(v => !v)} className="text-purple-200 hover:text-white">
                                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-3xl font-bold">
                            {loading ? '…' : showBalance ? fmt(wallet?.balance) : '₹ ••••••'}
                        </p>
                        <p className="text-xs text-purple-200 mt-1">Released commission earnings</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                            <TrendingUp className="w-4 h-4 text-green-500" /> Total Processed
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {loading ? '…' : fmt(wallet?.totalEarnings)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">All orders through platform</p>
                    </div>
                    <div className="border border-yellow-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                            <TrendingUp className="w-4 h-4 text-yellow-500" /> Pending Commission
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">
                            {loading ? '…' : fmt(wallet?.pendingEscrow || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Releasing after 3-day hold</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                            <TrendingDown className="w-4 h-4 text-red-500" /> Total Paid Out
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {loading ? '…' : fmt(wallet?.totalPaidOut)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Approved withdrawals</p>
                    </div>
                </div>
            </div>

            {/* Withdrawal Requests */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-700">Tutor Withdrawal Requests</h2>
                        {wStatus === 'pending' && withdrawals.length > 0 && (
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {withdrawals.length}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => { setWStatus(s); setWPage(1); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                                    wStatus === s ? 'bg-purple-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {wLoading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                    ) : withdrawals.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">No {wStatus} withdrawal requests</p>
                        </div>
                    ) : withdrawals.map(req => (
                        <div key={req._id} className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-purple-600 font-bold text-sm">
                                        {req.tutor?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{req.tutor?.name}</p>
                                    <p className="text-xs text-gray-400">{req.tutor?.email}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(req.createdAt).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                    {req.adminNote && (
                                        <p className="text-xs text-gray-500 mt-0.5 italic">Note: {req.adminNote}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                    <p className="text-base font-bold text-gray-800">{fmt(req.amount)}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Wallet: <span className="font-medium text-gray-600">{fmt(req.tutorBalance ?? 0)}</span>
                                    </p>
                                </div>
                                {req.status === 'pending' ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req._id)}
                                            disabled={approvingId === req._id}
                                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            {approvingId === req._id ? '…' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => setRejectTarget(req)}
                                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Reject
                                        </button>
                                    </div>
                                ) : (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                                        req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {req.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {wPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-50">
                        {Array.from({ length: wPagination.totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setWPage(p)}
                                className={`w-8 h-8 rounded-full text-sm font-medium ${
                                    p === wPage ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}>
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex border-b border-gray-100">
                    {['overview', 'all'].map(tab => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); setFilterType(''); }}
                            className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}>
                            {tab === 'overview' ? 'Overview' : 'All Transactions'}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">
                            {activeTab === 'overview' ? 'Recent Transactions' : 'All Transactions'}
                        </h3>
                        {activeTab === 'all' && (
                            <div className="relative">
                                <button onClick={() => setShowFilter(v => !v)}
                                    className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    <Filter className="w-3.5 h-3.5" />
                                    Filter
                                    {filterType && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 ml-0.5" />}
                                </button>
                                {showFilter && (
                                    <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36 py-1">
                                        {[['', 'All'], ['credit', 'Credits'], ['debit', 'Debits']].map(([val, label]) => (
                                            <button key={val} onClick={() => { setFilterType(val); setPage(1); setShowFilter(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterType === val ? 'text-purple-600 font-medium' : 'text-gray-700'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (activeTab === 'overview' ? recentTxns : allTxns).length === 0 ? (
                        <div className="text-center py-12">
                            <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">No transactions yet</p>
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
                                            'bg-red-100 text-red-700'
                                        }`}>{txn.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

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

            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onSuccess={() => fetchWithdrawals(wPage, wStatus)}
                />
            )}
        </div>
    );
}
