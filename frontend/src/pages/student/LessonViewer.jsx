import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseDetails, fetchCourseProgress, markLessonComplete, fetchPublishedCourses } from '../../store/slices/studentSlice';
import VideoPlayer from '../../components/student/VideoPlayer';
import {
    CheckCircle, ChevronLeft, Download, MessageSquare,
    Clock, BookOpen, ArrowLeft, ArrowRight, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonViewer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { currentCourse, progress, loading, catalog } = useSelector(state => state.student);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [marking, setMarking] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchCourseDetails(courseId));
        dispatch(fetchCourseProgress(courseId));
        dispatch(fetchPublishedCourses({}));
    }, [dispatch, courseId]);

    useEffect(() => {
        if (currentCourse?.lessons?.length && !currentLesson) {
            const targetId = location.state?.lessonId;
            const target = targetId ? currentCourse.lessons.find(l => l._id === targetId) : null;
            setCurrentLesson(target || currentCourse.lessons[0]);
        }
    }, [currentCourse]);

    const lessons = (currentCourse?.lessons || []).slice().sort((a, b) => a.order - b.order);
    const progressLessons = Array.isArray(progress?.lessons) ? progress.lessons : [];
    const currentIndex = lessons.findIndex(l => l._id === currentLesson?._id);
    const currentProgressLesson = progressLessons.find(l => l._id?.toString() === currentLesson?._id?.toString());
    const isCompleted = currentProgressLesson?.isCompleted ?? false;

    // --- Timer: reset on lesson change, count up while not completed ---
    useEffect(() => {
        setElapsed(0);
        clearInterval(timerRef.current);
        if (!isCompleted) {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [currentLesson?._id, isCompleted]);

    // Required: 80% of lesson duration in seconds. If no duration set, unlock immediately.
    const requiredSeconds = currentLesson?.duration ? currentLesson.duration * 60 * 0.8 : 0;
    const canMarkComplete = isCompleted || requiredSeconds === 0 || elapsed >= requiredSeconds;
    const remainingMin = Math.ceil((requiredSeconds - elapsed) / 60);

    // --- Sequential lock: lesson N accessible only if lesson N-1 is completed ---
    const isLessonAccessible = (index) => {
        if (index === 0) return true;
        const prevLesson = lessons[index - 1];
        return progressLessons.find(
            p => p._id?.toString() === prevLesson._id?.toString()
        )?.isCompleted ?? false;
    };

    const alsoBoought = catalog.filter(c => c._id !== courseId).slice(0, 4);

    const handleMarkComplete = async () => {
        if (!currentLesson || isCompleted) return;
        setMarking(true);
        try {
            await dispatch(markLessonComplete({ courseId, lessonId: currentLesson._id })).unwrap();
            dispatch(fetchCourseProgress(courseId));
            toast.success('Lesson marked as complete!');
        } catch (err) {
            toast.error(err || 'Failed to mark complete');
        } finally {
            setMarking(false);
        }
    };

    const handleDownloadPdf = () => {
        if (currentLesson?.pdfNotes || currentLesson?.pdfNotesURL) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            window.open(`${API_URL}/lessons/${currentLesson._id}/pdf`, '_blank');
        } else {
            toast.error('No PDF available for this lesson');
        }
    };

    const selectLesson = (lesson) => {
        const full = lessons.find(l => l._id === lesson._id) || lesson;
        setCurrentLesson(full);
    };

    if (loading || !currentCourse) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="h-32 bg-purple-700 animate-pulse" />
                <div className="p-6 grid grid-cols-3 gap-6">
                    <div className="bg-gray-100 rounded-xl h-96 animate-pulse" />
                    <div className="col-span-2 bg-gray-100 rounded-xl h-96 animate-pulse" />
                </div>
            </div>
        );
    }

    const tutor = currentCourse.tutor;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Purple header */}
            <div className="bg-purple-700 text-white px-6 py-5">
                <div className="flex items-start justify-between">
                    <button
                        onClick={() => navigate(`/student/courses/${courseId}/lessons`)}
                        className="flex items-center gap-1.5 text-purple-200 hover:text-white text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="text-center flex-1 px-4">
                        <h1 className="text-xl font-bold">{currentCourse.title}</h1>
                        {currentCourse.description && (
                            <p className="text-purple-200 text-sm mt-0.5 line-clamp-1">{currentCourse.description}</p>
                        )}
                    </div>
                    {currentCourse.totalDuration > 0 && (
                        <span className="flex items-center gap-1.5 text-purple-200 text-sm flex-shrink-0">
                            <Clock className="w-4 h-4" />
                            {currentCourse.totalDuration >= 60
                                ? `${Math.round(currentCourse.totalDuration / 60)} hr`
                                : `${currentCourse.totalDuration} min`}
                        </span>
                    )}
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar — lesson list */}
                <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
                    {/* In-progress section (first few) */}
                    {progressLessons.filter(l => l.isCompleted).length > 0 && (
                        <div className="px-3 pt-4 pb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Completed</p>
                            {progressLessons.filter(l => l.isCompleted).map(pl => {
                                const full = lessons.find(l => l._id === pl._id) || pl;
                                return (
                                    <LessonRow
                                        key={pl._id}
                                        lesson={full}
                                        isActive={currentLesson?._id === full._id}
                                        isCompleted={true}
                                        onClick={() => selectLesson(full)}
                                    />
                                );
                            })}
                        </div>
                    )}
                    <div className="px-3 pt-4 pb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Lessons</p>
                        {lessons.map((lesson, index) => {
                            const pl = progressLessons.find(p => p._id?.toString() === lesson._id?.toString());
                            const accessible = isLessonAccessible(index);
                            return (
                                <LessonRow
                                    key={lesson._id}
                                    lesson={lesson}
                                    isActive={currentLesson?._id === lesson._id}
                                    isCompleted={pl?.isCompleted ?? false}
                                    isLocked={!accessible}
                                    onClick={() => accessible && selectLesson(lesson)}
                                />
                            );
                        })}
                    </div>
                </aside>

                {/* Right — video + content */}
                <main className="flex-1 overflow-y-auto">
                    {/* Video */}
                    <div className="bg-black">
                        <div className="max-w-4xl mx-auto">
                            <VideoPlayer videoUrl={currentLesson?.videoUrl} />
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto px-6 py-6">
                        {/* Lesson title */}
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{currentLesson?.title}</h2>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download Slide
                            </button>

                            {isCompleted ? (
                                <span className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-200">
                                    <CheckCircle className="w-4 h-4" /> Completed
                                </span>
                            ) : (
                                <button
                                    onClick={handleMarkComplete}
                                    disabled={marking || !canMarkComplete}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    title={!canMarkComplete ? `Watch ${remainingMin} more min to unlock` : ''}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {marking ? 'Saving...' : !canMarkComplete ? `${remainingMin} min left` : 'Mark Complete'}
                                </button>
                            )}

                            <button
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                onClick={() => navigate('/student/chat')}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Chat with Tutor
                            </button>
                        </div>

                        {/* Prev / Next */}
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => currentIndex > 0 && selectLesson(lessons[currentIndex - 1])}
                                disabled={currentIndex <= 0}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </button>
                            <button
                                onClick={() => currentIndex < lessons.length - 1 && selectLesson(lessons[currentIndex + 1])}
                                disabled={currentIndex >= lessons.length - 1 || !isLessonAccessible(currentIndex + 1)}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Description */}
                        {currentLesson?.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                {currentLesson.description}
                            </p>
                        )}

                        {/* Tutor card */}
                        {tutor && (
                            <div className="bg-purple-700 rounded-xl p-5 flex items-start gap-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {tutor.name?.charAt(0)?.toUpperCase() || 'T'}
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{tutor.name}</p>
                                    {tutor.tutorProfile?.subject && (
                                        <p className="text-purple-200 text-xs mt-0.5">{tutor.tutorProfile.subject}</p>
                                    )}
                                    {tutor.tutorProfile?.bio && (
                                        <p className="text-purple-100 text-sm mt-2 line-clamp-3">{tutor.tutorProfile.bio}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Student also bought */}
                        {alsoBoought.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">Student also bought</h3>
                                    <button
                                        onClick={() => navigate('/student/courses')}
                                        className="text-sm text-purple-600 font-medium hover:underline"
                                    >
                                        See all
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {alsoBoought.map(course => (
                                        <div
                                            key={course._id}
                                            onClick={() => navigate(`/student/courses/${course._id}`)}
                                            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                                        >
                                            <div className="w-full h-28 bg-gray-100 overflow-hidden">
                                                {course.thumbnailURL ? (
                                                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                        <BookOpen className="w-8 h-8 text-purple-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="text-xs text-purple-500 font-medium mb-0.5">{course.category}</p>
                                                <h4 className="font-semibold text-gray-800 text-xs line-clamp-2 mb-1">{course.title}</h4>
                                                <p className="text-xs text-gray-500 mb-1">{course.tutor?.name}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-purple-600 font-bold text-sm">
                                                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function LessonRow({ lesson, isActive, isCompleted, isLocked, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-colors ${
                isLocked
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    : isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                    ? 'bg-orange-50 text-gray-700 hover:bg-orange-100'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
        >
            <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                isLocked ? 'bg-gray-200' : isActive ? 'bg-white/20' : isCompleted ? 'bg-orange-200' : 'bg-gray-200'
            }`}>
                {isLocked
                    ? <Lock className="w-3 h-3 text-gray-400" />
                    : <BookOpen className={`w-3 h-3 ${isActive ? 'text-white' : isCompleted ? 'text-orange-600' : 'text-gray-500'}`} />
                }
            </div>
            <span className="flex-1 text-xs font-medium truncate">{lesson.title}</span>
            {lesson.duration > 0 && (
                <span className={`text-xs flex-shrink-0 ${isActive ? 'text-purple-200' : 'text-gray-400'}`}>
                    {lesson.duration} min
                </span>
            )}
        </button>
    );
}
