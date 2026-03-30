import { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../api/adminAPI';
import toast from 'react-hot-toast';
import ConfirmActionModal from '../../components/admin/ConfirmActionModal';

const LIMIT = 10;

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
            const params = {page, limit: LIMIT};
            if (filter) params.status = filter;
            if (search) params.search = search;

            const res = await adminAPI.getStudents(params);
            setStudents(res.data.students);
            setSummary(res.data.summary);
            setPagination(res.data.pagination);
        } catch (err) {
            toast.error('Failed to load students', { id: 'fetch-students' });
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const openConfirm = (action, user) => {
        setConfirmModal({ isOpen: true, action, user });
    };

    const closeConfirm = () => {
        setConfirmModal({ isOpen: false, action: null, user: null });
    };

    const handleConfirmAction = async () => {
        const { action, user } = confirmModal;
        const userId = user._id;
        setActionLoading(userId);
        try {
            const res = action === 'block'
                ? await adminAPI.blockUser(userId)
                : await adminAPI.unblockUser(userId);

            setStudents(prev => prev.map(s => s._id === userId ? res.data : s));

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

    const getPageNumbers = () => {
        const { totalPages, currentPage } = pagination;
        const delta = 2;
        const range = [];
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);
        for(let i = start; i <= end; i++) range.push(i);
        return range;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Management</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{summary.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Active Students</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{summary.active}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Blocked Students</p>
                    <p className="text-3xl font-bold text-red-500 mt-1">{summary.blocked}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="">All Students</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>

                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
                        Loading students...
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
                        No students found
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => (
                                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                    {/* Student column — indigo avatar to distinguish from tutors */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center flex-shrink-0">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{student.name}</p>
                                                <p className="text-xs text-gray-400">{student._id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-5 py-4">
                                        <p className="text-gray-700">{student.email}</p>
                                        <p className="text-xs text-gray-400">{student.phone || '—'}</p>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            student.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-600'
                                        }`}>
                                            {student.status === 'active' ? 'Active' : 'Blocked'}
                                        </span>
                                    </td>

                                    {/* Verification */}
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            student.isVerified
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {student.isVerified ? 'Verified' : 'Unverified'}
                                        </span>
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
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
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

                {/* Pagination Controls */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.currentPage - 1) * LIMIT) + 1}–{Math.min(pagination.currentPage * LIMIT, pagination.totalFiltered)} of {pagination.totalFiltered} students
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {getPageNumbers().map(num => (
                                <button
                                    key={num}
                                    onClick={() => setPage(num)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                        num === pagination.currentPage
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Confirm Action Modal */}
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
