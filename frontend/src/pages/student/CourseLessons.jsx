import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails, fetchCourseProgress } from '../../store/slices/studentSlice';
import { BookOpen, ChevronLeft, CheckCircle, Clock, PlayCircle } from 'lucide-react';

export default function CourseLessons() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentCourse, progress, loading } = useSelector(state => state.student);

    useEffect(() => {
        dispatch(fetchCourseDetails(courseId));
        dispatch(fetchCourseProgress(courseId));
    }, [dispatch, courseId]);

    const lessons = (currentCourse?.lessons || []).slice().sort((a, b) => a.order - b.order);
    const progressLessons = Array.isArray(progress?.lessons) ? progress.lessons : [];
    const overallProgress = progress?.progress || 0;

    const getIsCompleted = (lessonId) => {
        const pl = progressLessons.find(l => l._id?.toString() === lessonId?.toString());
        return pl?.isCompleted ?? false;
    };

    const completedCount = progressLessons.filter(l => l.isCompleted).length;

    if (loading || !currentCourse) {
        return (
            <div className="p-6">
                <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button
                    onClick={() => navigate('/student/my-courses')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ChevronLeft className="w-4 h-4" />
                    My Courses
                </button>
            </div>

            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{currentCourse.title}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">By {currentCourse.tutor?.name}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">
                        Lessons ({lessons.length})
                    </span>
                    <span>{completedCount}/{lessons.length} completed</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span>Overall Progress</span>
                    <span className="font-medium text-purple-600">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {/* Lesson grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {lessons.map((lesson, index) => {
                    const isCompleted = getIsCompleted(lesson._id);
                    return (
                        <div
                            key={lesson._id}
                            onClick={() => navigate(`/student/courses/${courseId}/learn`, { state: { lessonId: lesson._id } })}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden group"
                        >
                            {/* Thumbnail */}
                            <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                                {lesson.thumbnailURL ? (
                                    <img src={lesson.thumbnailURL} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-purple-400" />
                                    </div>
                                )}
                                {/* Overlay play / completed badge */}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="w-12 h-12 text-white drop-shadow" />
                                </div>
                                {isCompleted && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                                    Lesson {index + 1}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-1">
                                    {lesson.title}
                                </h3>
                                <p className="text-xs text-purple-600 font-medium mb-2">
                                    By {currentCourse.tutor?.name}
                                </p>
                                <div className="flex items-center justify-between">
                                    {lesson.duration > 0 && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {lesson.duration} min
                                        </span>
                                    )}
                                    {isCompleted ? (
                                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Done
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Not started</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
