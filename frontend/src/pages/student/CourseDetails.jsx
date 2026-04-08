import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { enrollInCourse, fetchCourseDetails, fetchPublishedCourses } from "../../store/slices/studentSlice";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import { studentAPI } from "../../api/studentAPI";
import toast from "react-hot-toast";
import { BookOpen, Clock, Users, CheckCircle, PlayCircle } from 'lucide-react';

export default function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentCourse, loading, catalog } = useSelector(state => state.student);
    const [enrolling, setEnrolling] = useState(false);
    const [studentInfo, setStudentInfo] = useState(() => {
        try { return JSON.parse(localStorage.getItem("studentInfo")) || {}; } catch { return {}; }
    });

    useEffect(() => {
        dispatch(fetchCourseDetails(id));
        dispatch(fetchPublishedCourses({}));
        studentAPI.getProfile().then(res => setStudentInfo(res.data || res)).catch(() => {});
    }, [dispatch, id]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await dispatch(enrollInCourse(id)).unwrap();
            toast.success('Enrolled successfully!');
            dispatch(fetchCourseDetails(id));
        } catch (err) {
            toast.error(err || 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    const lessons = (currentCourse?.lessons || []).slice().sort((a, b) => a.order - b.order);
    const tutor = currentCourse?.tutor;
    const moreCourses = catalog.filter(c => c._id !== id).slice(0, 4);

    if (loading || !currentCourse) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="h-16 bg-white border-b animate-pulse" />
                <div className="w-full px-6 py-8 grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                    <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar studentInfo={studentInfo} />

            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3 px-6">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <button onClick={() => navigate('/student/dashboard')} className="hover:text-purple-600 transition">Home</button>
                    <span className="text-gray-300">›</span>
                    <button onClick={() => navigate('/student/courses')} className="hover:text-purple-600 transition">Categories</button>
                    <span className="text-gray-300">›</span>
                    <span className="text-purple-600 font-medium truncate max-w-xs">{currentCourse.title}</span>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1">
                <div className="w-full px-6 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* LEFT — course details + instructor + syllabus */}
                        <div className="flex-1 min-w-0">
                            {/* Title & description */}
                            <div className="mb-5">
                                <p className="text-xs text-purple-600 font-medium mb-1">{currentCourse.category}</p>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentCourse.title}</h1>
                                <p className="text-gray-500 text-sm">{currentCourse.description}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    {lessons.length} lessons
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    {currentCourse.enrolledCount || 0} students enrolled
                                </span>
                                {currentCourse.totalDuration > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        {currentCourse.totalDuration >= 60
                                            ? `${Math.round(currentCourse.totalDuration / 60)} hrs`
                                            : `${currentCourse.totalDuration} min`}
                                    </span>
                                )}
                            </div>

                            {/* Instructor */}
                            {tutor && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">Instructor</h2>
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                            {tutor.name?.charAt(0)?.toUpperCase() || 'T'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-base">{tutor.name}</p>
                                            {tutor.tutorProfile?.subject && (
                                                <p className="text-purple-600 text-sm mb-1">{tutor.tutorProfile.subject}</p>
                                            )}
                                            {tutor.tutorProfile?.bio && (
                                                <p className="text-gray-600 text-sm leading-relaxed">{tutor.tutorProfile.bio}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Syllabus */}
                            {lessons.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-bold text-gray-800 mb-3">Syllabus</h2>
                                    <div className="space-y-2">
                                        {lessons.map((lesson, idx) => (
                                            <div
                                                key={lesson._id}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                    <PlayCircle className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {idx + 1}. {lesson.title}
                                                    </p>
                                                </div>
                                                {lesson.duration > 0 && (
                                                    <span className="text-xs text-gray-400 flex-shrink-0">{lesson.duration} min</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT — sticky course card */}
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden lg:sticky lg:top-24">
                                {/* Thumbnail */}
                                <div className="w-full h-44 bg-gray-100 overflow-hidden">
                                    {currentCourse.thumbnailURL ? (
                                        <img src={currentCourse.thumbnailURL} alt={currentCourse.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-purple-300" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    {/* Price */}
                                    <div className="mb-4">
                                        <span className="text-2xl font-bold text-gray-900">
                                            {currentCourse.price === 0 ? 'Free' : `₹${currentCourse.price}`}
                                        </span>
                                    </div>

                                    {/* Action button */}
                                    {currentCourse.isEnrolled ? (
                                        <button
                                            onClick={() => navigate(`/student/courses/${id}/lessons`)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition mb-3"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Go to Course
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-60 transition mb-3"
                                        >
                                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                        </button>
                                    )}

                                    {/* Course meta */}
                                    <ul className="space-y-2 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                                        <li className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-gray-400" />
                                            {lessons.length} lessons
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            {currentCourse.enrolledCount || 0} students
                                        </li>
                                        {currentCourse.totalDuration > 0 && (
                                            <li className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {currentCourse.totalDuration >= 60
                                                    ? `${Math.round(currentCourse.totalDuration / 60)} hrs total`
                                                    : `${currentCourse.totalDuration} min total`}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* More Courses Like This */}
                {moreCourses.length > 0 && (
                    <div className="w-full px-6 py-10 bg-white border-t border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">More Courses Like This</h2>
                            <button
                                onClick={() => navigate('/student/courses')}
                                className="text-sm text-purple-600 font-medium hover:underline"
                            >
                                See all
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                            {moreCourses.map(course => (
                                <div
                                    key={course._id}
                                    onClick={() => navigate(`/student/courses/${course._id}`)}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                                >
                                    <div className="w-full h-36 bg-gray-100 overflow-hidden">
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
                                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{course.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{course.tutor?.name}</p>
                                        <span className="text-purple-600 font-bold text-sm">
                                            {course.price === 0 ? 'Free' : `₹${course.price}`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
