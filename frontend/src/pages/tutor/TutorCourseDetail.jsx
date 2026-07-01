import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Users, Clock, BookOpen,  } from 'lucide-react';
import { courseAPI } from '../../api/courseAPI';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { ROUTES, COURSE_STATUS } from '../../utils/constants';

export default function TutorCourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmLesson, setConfirmLesson] = useState({ open: false, id: null, title: '' });
    const [deletingLesson, setDeletingLesson] = useState(false);

    useEffect(() => {
        loadCourse();
    }, [id]);

    const loadCourse = async () => {
        setLoading(true);
        try {
            const res = await courseAPI.getCourseById(id);
            const data = res?.data || res;
            setCourse(data);
            setLessons(data.lessons || []);
        } catch {
            toast.error('Failed to load course', { id: 'tutor-course-error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLesson = async () => {
        setDeletingLesson(true);
        try {
            await courseAPI.deleteLesson(confirmLesson.id);
            setLessons(prev => prev.filter(l => l._id !== confirmLesson.id));
            toast.success('Lesson deleted');
            setConfirmLesson({ open: false, id: null, title: '' });
        } catch {
            toast.error('Failed to delete lesson');
        } finally {
            setDeletingLesson(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-52 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
            </div>
        );
    }

    if (!course) return null;

    const isPublished = course.status === COURSE_STATUS.PUBLISHED;

    return (
        <div className="p-6 max-w-5xl">
            {/* Back */}
            <button
                onClick={() => navigate(ROUTES.TUTOR_COURSES)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5"
            >
                <ArrowLeft className="w-4 h-4" /> My Courses
            </button>

            {/* Hero thumbnail */}
            <div className="w-full h-56 rounded-2xl overflow-hidden bg-gray-100 mb-5">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-purple-300" />
                    </div>
                )}
            </div>

            {/* Action buttons row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(`/tutor/courses/${id}/edit`)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add New Lesson
                </button>
                <button
                    onClick={() => navigate(`/tutor/courses/${id}/edit`)}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                    <Pencil className="w-4 h-4" /> Edit Course Details
                </button>
                <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium">
                    <Users className="w-4 h-4" />
                    Total Students: {course.enrolledCount || 0}
                </div>
                <span className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                    {isPublished ? 'Published' : 'Draft'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Course structure */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Course Structure</h2>
                        {lessons.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
                                No lessons yet. Click "Add New Lesson" to get started.
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {/* Group lessons by chapter */}
                                {(() => {
                                    const chapMap = {};
                                    lessons.forEach(l => {
                                        const key = l.chapter?.order ?? 1;
                                        if (!chapMap[key]) chapMap[key] = { order: key, title: l.chapter?.title ?? 'Chapter 1', lessons: [] };
                                        chapMap[key].lessons.push(l);
                                    });
                                    return Object.values(chapMap)
                                        .sort((a, b) => a.order - b.order)
                                        .map(ch => ({
                                            ...ch,
                                            lessons: ch.lessons.slice().sort((a, b) => a.order - b.order)
                                        }))
                                        .map(chapter => (
                                            <div key={chapter.order} className="border border-gray-200 rounded-xl overflow-hidden">
                                                {/* Chapter header */}
                                                <div className="flex items-center gap-3 px-4 py-3 bg-purple-50">
                                                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{chapter.order}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800 text-sm">
                                                            Chapter {chapter.order}: {chapter.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Lessons in chapter */}
                                                <div className="divide-y divide-gray-100">
                                                    {chapter.lessons.map((lesson, idx) => (
                                                        <div key={lesson._id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition">
                                                            <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                                                            </div>
                                                            <span className="flex-1 text-sm text-gray-700 truncate">
                                                                {idx + 1}. {lesson.title}
                                                            </span>
                                                            {lesson.duration > 0 && (
                                                                <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                                                    <Clock className="w-3 h-3" /> {lesson.duration} mins
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                })()}
                            </div>
                        )}

                    {/* Lessons grid */}
                    {lessons.length > 0 && (
                        <>
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Lessons</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {lessons.map((lesson) => (
                                    <div key={lesson._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="w-full h-32 bg-gray-100 overflow-hidden">
                                            {lesson.thumbnailURL ? (
                                                <img src={lesson.thumbnailURL} alt={lesson.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                                                    <BookOpen className="w-8 h-8 text-purple-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{lesson.title}</p>
                                            {lesson.duration > 0 && (
                                                <p className="text-xs text-gray-400 mt-0.5">{lesson.duration} mins</p>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => navigate(`/tutor/courses/${id}/edit`)}
                                                    className="flex-1 text-xs bg-purple-600 text-white py-1.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setConfirmLesson({ open: true, id: lesson._id, title: lesson.title })}
                                                    className="flex-1 text-xs bg-red-500 text-white py-1.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Course info card */}
                <div className="lg:col-span-1">
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 sticky top-6">
                        <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-100 mb-4">
                            {course.thumbnailURL ? (
                                <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-purple-300" />
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-base mb-1">{course.title}</h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Price</span>
                                <span className="font-semibold text-purple-700">
                                    {course.price === 0 ? 'Free' : `₹${course.price}`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Category</span>
                                <span className="font-medium text-gray-700">{course.category}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Lessons</span>
                                <span className="font-medium text-gray-700">{lessons.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Duration</span>
                                <span className="font-medium text-gray-700">{course.totalDuration || 0} mins</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Students</span>
                                <span className="font-medium text-gray-700">{course.enrolledCount || 0}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/tutor/courses/${id}/edit`)}
                            className="w-full mt-4 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                            Edit Course Details
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmLesson.open}
                title="Delete Lesson"
                message={`Are you sure you want to delete "${confirmLesson.title}"?`}
                confirmText="Yes, Delete"
                loading={deletingLesson}
                onConfirm={handleDeleteLesson}
                onClose={() => setConfirmLesson({ open: false, id: null, title: '' })}
            />
        </div>
    );
}
