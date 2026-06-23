import { useCallback, useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Shield } from 'lucide-react';
import { adminAPI } from '../../api/adminAPI';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import AvatarInitial from '../../components/common/AvatarInitial';

const LIMIT = 5;

export default function TutorManagement() {
    const [tutors, setTutors] = useState([]);
    const [summary, setSummary] = useState({ total: 0, active: 0, blocked: 0, approved: 0, pending: 0 });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalFiltered: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, user: null });

    const fetchTutors = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (filter) params.status = filter;
            if (search) params.search = search;
            const res = await adminAPI.getTutors(params);
            setTutors(res.data.tutors);
            setSummary(res.data.summary);
            setPagination(res.data.pagination);
        } catch {
            toast.error('Failed to load tutors', { id: 'fetch-tutors' });
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    useEffect(() => { fetchTutors(); }, [fetchTutors]);

    useEffect(() => {
        const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleApproval = async (tutorId, action) => {
        const prevApprovalStatus = tutors.find(t => t._id === tutorId)?.tutorProfile?.approvalStatus || 'pending';
        setActionLoading(`approval-${tutorId}`);
        try {
            const res = action === 'approve'
                ? await adminAPI.approveTutor(tutorId)
                : await adminAPI.rejectTutor(tutorId);

            const updated = res.data;
            setTutors(prev => prev.map(t => t._id === tutorId ? updated : t));
            setSelectedTutor(updated);

            setSummary(prev => {
                const next = { ...prev };
                if (prevApprovalStatus === 'pending') next.pending = Math.max(0, prev.pending - 1);
                if (action === 'approve') {
                    next.approved = prev.approved + 1;
                } else if (action === 'reject' && prevApprovalStatus === 'approved') {
                    next.approved = Math.max(0, prev.approved - 1);
                }
                return next;
            });

            toast.success(action === 'approve' ? 'Tutor approved' : 'Tutor rejected');
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} tutor`);
        } finally {
            setActionLoading(null);
        }
    };

    const openConfirm = (action, user) => setConfirmModal({ isOpen: true, action, user });
    const closeConfirm = () => setConfirmModal({ isOpen: false, action: null, user: null });

    const handleConfirmAction = async () => {
        const { action, user } = confirmModal;
        const userId = user._id;
        setActionLoading(userId);
        try {
            const res = action === 'block'
                ? await adminAPI.blockUser(userId)
                : await adminAPI.unblockUser(userId);

            const updated = res.data;
            setTutors(prev => {
                const mapped = prev.map(t => t._id === userId ? updated : t);
                if (filter) return mapped.filter(t => t.status === filter);
                return mapped;
            });

            if (action === 'block') {
                setSummary(prev => ({ ...prev, active: prev.active - 1, blocked: prev.blocked + 1 }));
                toast('Tutor blocked', { icon: '🚫' });
            } else {
                setSummary(prev => ({ ...prev, active: prev.active + 1, blocked: prev.blocked - 1 }));
                toast.success('Tutor unblocked');
            }
            closeConfirm();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} tutor`);
        } finally {
            setActionLoading(null);
        }
    };

    const approvalStatus = selectedTutor?.tutorProfile?.approvalStatus || 'pending';
    const isApprovalLoading = actionLoading?.startsWith('approval-');

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Tutor Management</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                <StatCard label="Total Tutors" value={summary.total} />
                <StatCard label="Active" value={summary.active} color="text-green-600" />
                <StatCard label="Blocked" value={summary.blocked} color="text-red-500" />
                <StatCard label="Approved" value={summary.approved} color="text-blue-600" />
                <StatCard label="Pending Approval" value={summary.pending} color="text-yellow-600" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <select
                    value={filter}
                    onChange={e => { setFilter(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Tutors</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>

                <SearchInput
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onClear={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                    placeholder="Search by name or email..."
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20 text-gray-400 text-sm">Loading tutors...</div>
                    ) : tutors.length === 0 ? (
                        <div className="flex justify-center items-center py-20 text-gray-400 text-sm">No tutors found</div>
                    ) : (
                        <table className="w-full text-sm min-w-[640px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {['Tutor', 'Contact', 'Approval', 'Status', 'Verified', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tutors.map(tutor => {
                                    const approval = tutor.tutorProfile?.approvalStatus || 'pending';
                                    return (
                                        <tr key={tutor._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <AvatarInitial name={tutor.name} color="purple" />
                                                    <div>
                                                        <p className="font-medium text-gray-800">{tutor.name}</p>
                                                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{tutor._id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-gray-700">{tutor.email}</p>
                                                <p className="text-xs text-gray-400">{tutor.phone || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={approval} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={tutor.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={tutor.isVerified ? 'verified' : 'unverified'} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedTutor(tutor)}
                                                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => openConfirm(tutor.status === 'active' ? 'block' : 'unblock', tutor)}
                                                        disabled={actionLoading === tutor._id}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                                                            tutor.status === 'active'
                                                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                                : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                        }`}
                                                    >
                                                        {actionLoading === tutor._id ? '...' : tutor.status === 'active' ? 'Block' : 'Unblock'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalFiltered={pagination.totalFiltered}
                    limit={LIMIT}
                    onPageChange={setPage}
                    itemLabel="tutors"
                />
            </div>

            {/* Tutor Detail Modal */}
            {selectedTutor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">Tutor Details</h2>
                            <button onClick={() => setSelectedTutor(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-6 pt-5 pb-4 flex items-center gap-4">
                            <AvatarInitial name={selectedTutor.name} color="purple" size="lg" />
                            <div>
                                <p className="font-semibold text-gray-900 text-lg leading-tight">{selectedTutor.name}</p>
                                <p className="text-sm text-gray-400 capitalize">{selectedTutor.role}</p>
                                <div className="mt-1">
                                    <StatusBadge status={approvalStatus} />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-4 space-y-3 text-sm">
                            {[
                                { label: 'Email', value: selectedTutor.email },
                                { label: 'Phone', value: selectedTutor.phone || '—' },
                                { label: 'Joined', value: formatDate(selectedTutor.createdAt) },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="text-gray-800 font-medium">{value}</span>
                                </div>
                            ))}

                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Account Status</span>
                                <StatusBadge status={selectedTutor.status} />
                            </div>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Email Verified</span>
                                <StatusBadge status={selectedTutor.isVerified ? 'verified' : 'unverified'} />
                            </div>

                            {selectedTutor.tutorProfile?.bio && (
                                <div className="py-2">
                                    <span className="text-gray-500 block mb-1">Bio</span>
                                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{selectedTutor.tutorProfile.bio}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Admin Approval</span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApproval(selectedTutor._id, 'approve')}
                                    disabled={approvalStatus === 'approved' || isApprovalLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {isApprovalLoading ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleApproval(selectedTutor._id, 'reject')}
                                    disabled={approvalStatus === 'rejected' || isApprovalLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    {isApprovalLoading ? 'Processing...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmActionModal
                isOpen={confirmModal.isOpen}
                action={confirmModal.action}
                userName={confirmModal.user?.name}
                onConfirm={handleConfirmAction}
                onClose={closeConfirm}
                loading={!!actionLoading}
            />
        </div>
    );
}
