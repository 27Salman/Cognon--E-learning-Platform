import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { fetchMyCourses, deleteCourse } from '../../store/slices/courseSlice';
import { courseAPI } from '../../api/courseAPI';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { ROUTES, COURSE_STATUS } from '../../utils/constants';

function StatusToggle({ course, onToggle }) {
    const isListed = course.status === COURSE_STATUS.PUBLISHED;
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await onToggle(course._id, isListed ? COURSE_STATUS.DRAFT : COURSE_STATUS.PUBLISHED);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-medium ${isListed ? 'text-purple-600' : 'text-red-400'}`}>
                {isListed ? 'Listed' : 'Unlisted'}
            </span>
            <button
                type="button"
                onClick={handleToggle}
                disabled={loading}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${
                    isListed ? 'bg-purple-600' : 'bg-red-300'
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                        isListed ? 'translate-x-8' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

export default function TutorCourses() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: courses, loading, pagination } = useSelector(state => state.courses);
    const [confirm, setConfirm] = useState({ open: false, id: null, title: '' });
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const LIMIT = 10;

    useEffect(() => {
        dispatch(fetchMyCourses({ page: currentPage, limit: LIMIT }));
    }, [dispatch, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleToggleStatus = async (courseId, newStatus) => {
        try {
            await courseAPI.toggleStatus(courseId, newStatus);
            dispatch(fetchMyCourses({ page: currentPage, limit: LIMIT }));
            toast.success(newStatus === COURSE_STATUS.PUBLISHED ? 'Course listed' : 'Course unlisted');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteClick = (course) => {
        setConfirm({ open: true, id: course._id, title: course.title });
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await dispatch(deleteCourse(confirm.id)).unwrap();
            toast.success('Course deleted');
            setConfirm({ open: false, id: null, title: '' });
            const newTotal = pagination.totalCourses - 1;
            const newTotalPages = Math.ceil(newTotal / LIMIT);
            const targetPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
            setCurrentPage(targetPage);
            dispatch(fetchMyCourses({ page: targetPage, limit: LIMIT }));
        } catch (err) {
            toast.error(err || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    My Courses ({pagination.totalCourses})
                </h1>
                <button
                    onClick={() => navigate(ROUTES.TUTOR_CREATE_COURSE)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add New Course
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No courses yet.</div>
            ) : (
                <div className="space-y-4">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-5">
                            {/* Thumbnail - clickable */}
                            <div
                                onClick={() => navigate(`/tutor/courses/${course._id}`)}
                                className="w-36 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                {course.thumbnailURL ? (
                                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-400 text-xs">No image</div>
                                )}
                            </div>

                            {/* Info + toggle below title */}
                            <div className="flex-1 min-w-0">
                                <p
                                    onClick={() => navigate(`/tutor/courses/${course._id}`)}
                                    className="font-bold text-gray-900 text-base truncate cursor-pointer hover:text-purple-600 transition-colors"
                                >
                                    {course.title}
                                </p>
                                <StatusToggle course={course} onToggle={handleToggleStatus} />
                            </div>

                            {/* Actions stacked */}
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                    onClick={() => navigate(`/tutor/courses/${course._id}/edit`)}
                                    className="bg-purple-600 text-white px-5 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(course)}
                                    className="bg-red-500 text-white px-5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * LIMIT + 1}–{Math.min(currentPage * LIMIT, pagination.totalCourses)} of {pagination.totalCourses} courses
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                    page === currentPage
                                        ? 'bg-purple-600 text-white'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNext}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirm.open}
                title="Delete Course"
                message={`Are you sure you want to delete "${confirm.title}"? This will also delete all lessons and cannot be undone.`}
                confirmText="Yes, Delete"
                loading={deleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setConfirm({ open: false, id: null, title: '' })}
            />
        </div>
    );
}
