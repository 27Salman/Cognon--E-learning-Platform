import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api/adminAPI';
import toast from 'react-hot-toast';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import AvatarInitial from '../../components/common/AvatarInitial';

const LIMIT = 5;

export default function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({ total: 0, active: 0, blocked: 0 });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalFiltered: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, user: null });

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (filter) params.status = filter;
            if (search) params.search = search;
            const res = await adminAPI.getStudents(params);
            setStudents(res.data.students);
            setSummary(res.data.summary);
            setPagination(res.data.pagination);
        } catch {
            toast.error('Failed to load students', { id: 'fetch-students' });
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    useEffect(() => {
        const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

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

            setStudents(prev => {
                const updated = prev.map(s => s._id === userId ? res.data : s);
                if (filter) return updated.filter(s => s.status === filter);
                return updated;
            });

            if (action === 'block') {
                setSummary(prev => ({ ...prev, active: prev.active - 1, blocked: prev.blocked + 1 }));
                toast('Student blocked', { icon: '🚫' });
            } else {
                setSummary(prev => ({ ...prev, active: prev.active + 1, blocked: prev.blocked - 1 }));
                toast.success('Student unblocked');
            }
            closeConfirm();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} student`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Management</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard label="Total Students" value={summary.total} />
                <StatCard label="Active Students" value={summary.active} color="text-green-600" />
                <StatCard label="Blocked Students" value={summary.blocked} color="text-red-500" />
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <select
                    value={filter}
                    onChange={e => { setFilter(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Students</option>
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
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">No students found</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {['Student', 'Contact', 'Status', 'Verification', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => (
                                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <AvatarInitial name={student.name} color="indigo" />
                                            <div>
                                                <p className="font-medium text-gray-800">{student.name}</p>
                                                <p className="text-xs text-gray-400">{student._id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-gray-700">{student.email}</p>
                                        <p className="text-xs text-gray-400">{student.phone || '—'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={student.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={student.isVerified ? 'verified' : 'unverified'} />
                                    </td>
                                    <td className="px-5 py-4">
                                        {student.status === 'active' ? (
                                            <button
                                                onClick={() => openConfirm('block', student)}
                                                disabled={actionLoading === student._id}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === student._id ? '...' : 'Block'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => openConfirm('unblock', student)}
                                                disabled={actionLoading === student._id}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === student._id ? '...' : 'Unblock'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalFiltered={pagination.totalFiltered}
                    limit={LIMIT}
                    onPageChange={setPage}
                    itemLabel="students"
                />
            </div>

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
