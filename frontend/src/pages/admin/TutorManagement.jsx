import { useCallback, useEffect, useState } from "react";
import { Search, X } from 'lucide-react';
import { adminAPI } from "../../api/adminAPI";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/helpers";

const LIMIT = 10;

export default function TutorManagement() {
    const [tutors, setTutors] = useState([]);
    const [summary, setSummary] = useState({ total:0, active:0, blocked:0 });
    const [pagination , setPagination] = useState({ currentPage: 1, totalPages: 1, totalFiltered: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [selectedTutor, setSelectedTutor] = useState(null);

    const fetchTutors = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit:LIMIT};
            if(filter) params.status = filter;
            if(search) params.search = search;

            const res = await adminAPI.getTutors(params);
            setTutors(res.data.tutors);
            setSummary(res.data.summary);
            setPagination(res.data.pagination);

        } catch (error) {
            toast.error('Failed to load tutors', { id: 'fetch-tutors' });
        } finally {
            setLoading(false);
        }
    },[filter, search, page]);

    useEffect(()=>{
        fetchTutors();
    },[fetchTutors]);

    //Debounce
    useEffect(()=>{
        const timer = setTimeout(()=>{
            setSearch(searchInput);
            setPage(1);
        },500);
        return () => clearTimeout(timer);
    },[searchInput]);

    const handleFilterChange = (value) => {
        setFilter(value);
        setPage(1);
    }

    const handleBlock = async (userId) => {
        setActionLoading(userId);
        try {
            const res = await adminAPI.blockUser(userId);

            setTutors(prev =>
                prev.map(t => t._id === userId ? res.data : t)
            );

            setSummary(prev => ({
                ...prev,
                active: prev.active - 1,
                blocked: prev.blocked + 1
            }));
            toast('Tutor blocked', { icon: '🚫' });

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to block tutor');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblock = async (userId) => {
        setActionLoading(userId);
        try {
            const res = await adminAPI.unblockUser(userId);

            setTutors(prev =>
                prev.map(t => t._id === userId ? res.data : t)
            );

            setSummary(prev => ({
                ...prev,
                active: prev.active + 1,
                blocked: prev.blocked - 1,
            }));

            toast.success('Tutor unblocked');

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to unblock tutor');
        } finally {
            setActionLoading(null);
        }
    };

    const getPaginationNumbers = () => {
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Tutor Management</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Tutors</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{summary.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Active Tutors</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{summary.active}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Blocked Tutors</p>
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
                    <option value="">All Tutors</option>
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
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
                        Loading tutors...
                    </div>
                ) : tutors.length === 0 ? (
                    <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
                        No tutors found
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tutor</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tutors.map(tutor => (
                                <tr key={tutor._id} className="hover:bg-gray-50 transition-colors">
                                    {/* Tutor column */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-semibold flex items-center justify-center flex-shrink-0">
                                                {tutor.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{tutor.name}</p>
                                                <p className="text-xs text-gray-400">{tutor._id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact column */}
                                    <td className="px-5 py-4">
                                        <p className="text-gray-700">{tutor.email}</p>
                                        <p className="text-xs text-gray-400">{tutor.phone || '—'}</p>
                                    </td>

                                    {/* Status column */}
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            tutor.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-600'
                                        }`}>
                                            {tutor.status === 'active' ? 'Active' : 'Blocked'}
                                        </span>
                                    </td>

                                    {/* Verification column */}
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            tutor.isVerified
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {tutor.isVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                    </td>

                                    {/* Actions column */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedTutor(tutor)}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                View
                                            </button>

                                            {tutor.status === 'active' ? (
                                                <button
                                                    onClick={() => handleBlock(tutor._id)}
                                                    disabled={actionLoading === tutor._id}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === tutor._id ? '...' : 'Block'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnblock(tutor._id)}
                                                    disabled={actionLoading === tutor._id}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === tutor._id ? '...' : 'Unblock'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/*Pagination controls*/}
                {!loading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {((pagination.currentPage - 1) * LIMIT) + 1}–{Math.min(pagination.currentPage * LIMIT, pagination.totalFiltered)} of {pagination.totalFiltered} tutors
                        </p>

                        <div className="flex items-center gap-1">
                            {/* Previous */}
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page numbers */}
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

                            {/* Next */}
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

            {/* Detail Modal */}
            {selectedTutor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800">Tutor Details</h2>
                            <button
                                onClick={() => setSelectedTutor(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 font-bold text-xl flex items-center justify-center">
                                    {selectedTutor.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-lg">{selectedTutor.name}</p>
                                    <p className="text-sm text-gray-500">{selectedTutor.role}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email</span>
                                    <span className="text-gray-800 font-medium">{selectedTutor.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phone</span>
                                    <span className="text-gray-800 font-medium">{selectedTutor.phone || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`font-medium ${selectedTutor.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                                        {selectedTutor.status === 'active' ? 'Active' : 'Blocked'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Verified</span>
                                    <span className={`font-medium ${selectedTutor.isVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {selectedTutor.isVerified ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Joined</span>
                                    <span className="text-gray-800 font-medium">{formatDate(selectedTutor.createdAt)}</span>
                                </div>
                                {selectedTutor.tutorProfile?.bio && (
                                    <div>
                                        <span className="text-gray-500">Bio</span>
                                        <p className="text-gray-800 mt-1">{selectedTutor.tutorProfile.bio}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


