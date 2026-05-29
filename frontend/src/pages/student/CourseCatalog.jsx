import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPublishedCourses, fetchEnrolledCourses } from "../../store/slices/studentSlice";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import { studentAPI } from "../../api/studentAPI";
import {
    BookOpen, ChevronLeft, ChevronRight,
    Clock, Heart, Tag
} from "lucide-react";

function formatDuration(minutes) {
    if (!minutes || minutes === 0) return null;
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.round(minutes / 60);
    return `${hrs} hr${hrs !== 1 ? 's' : ''}`;
}

function CourseCardLarge({ course }) {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/student/courses/${course._id}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
        >
            <div className="w-full h-40 bg-gray-100 overflow-hidden">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-purple-300" />
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span className="text-purple-500 font-medium">{course.category || "Design"}</span>
                    {formatDuration(course.totalDuration) && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(course.totalDuration)}</span>
                    )}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
                {course.description && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{course.description}</p>}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                            {course.tutor?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <span className="text-xs text-gray-600">{course.tutor?.name || "Tutor"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {course.originalPrice && course.originalPrice > course.price && (
                            <span className="text-xs text-gray-400 line-through">₹{course.originalPrice}</span>
                        )}
                        <span className="text-purple-600 font-bold text-sm">
                            {course.price === 0 ? "Free" : `₹${course.price}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourseCardCompact({ course }) {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/student/courses/${course._id}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
        >
            <div className="relative w-full h-36 bg-gray-100 overflow-hidden">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-purple-300" />
                    </div>
                )}
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
                >
                    <Heart className="w-3.5 h-3.5 text-gray-400" />
                </button>
            </div>
            <div className="p-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span className="text-purple-500 font-medium">{course.category || "Design"}</span>
                    {formatDuration(course.totalDuration) && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(course.totalDuration)}</span>
                    )}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 mb-2">{course.title}</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                            {course.tutor?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <span className="text-xs text-gray-600">{course.tutor?.name || "Tutor"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {course.originalPrice && course.originalPrice > course.price && (
                            <span className="text-xs text-gray-400 line-through">₹{course.originalPrice}</span>
                        )}
                        <span className="text-purple-600 font-bold text-sm">
                            {course.price === 0 ? "Free" : `₹${course.price}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CourseCatalog() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { catalog, enrolledCourses, loading } = useSelector(state => state.student);

    const [studentInfo, setStudentInfo] = useState(() => {
        try { return JSON.parse(localStorage.getItem("studentInfo")) || {}; } catch { return {}; }
    });

    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [recommendedPage, setRecommendedPage] = useState(0);
    const [topRatedPage, setTopRatedPage] = useState(0);
    const coursesPerPage = 4;

    useEffect(() => {
        studentAPI.getProfile()
            .then(res => {
                const data = res.data || res;
                setStudentInfo({ ...data, profileImage: data.profileImageURL || data.profileImage || null });
            })
            .catch(() => {});
        dispatch(fetchPublishedCourses({}));
        dispatch(fetchEnrolledCourses());

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/categories/public`)
            .then(r => r.json())
            .then(data => {
                const cats = data?.data?.categories || [];
                setDynamicCategories(cats);
            })
            .catch(() => {});
    }, [dispatch]);

    const handleCategoryClick = (label) => {
        navigate(`/student/categories?category=${encodeURIComponent(label)}`);
    };

    const enrolledIds = new Set(enrolledCourses.map(c => c._id));

    const unenrolled = catalog.filter(c => !enrolledIds.has(c._id));

    const recommended = unenrolled;
    const technical = unenrolled.filter(c =>
        ["Development", "Web Development", "Data Science"].includes(c.category)
    );
    const topRated = unenrolled.slice().sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));

    const inProgress = enrolledCourses.filter(c => (c.progress || 0) < 100).slice(0, 6);

    const recommendedTotalPages = Math.ceil(recommended.length / coursesPerPage);
    const topRatedTotalPages = Math.ceil(topRated.length / coursesPerPage);

    const recommendedStart = recommendedPage * coursesPerPage;
    const recommendedEnd = recommendedStart + coursesPerPage;
    const displayedRecommended = recommended.slice(recommendedStart, recommendedEnd);

    const topRatedStart = topRatedPage * coursesPerPage;
    const topRatedEnd = topRatedStart + coursesPerPage;
    const displayedTopRated = topRated.slice(topRatedStart, topRatedEnd);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <StudentNavbar studentInfo={studentInfo} />

            <div className="flex-1">
                        {/* Welcome back / In Progress */}
                        {inProgress.length > 0 && (
                            <div className="bg-[#ede9f8] py-8 px-6">
                                <div className="max-w-7xl mx-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-800">Welcome back, ready for your next lesson?</h2>
                                        <button
                                            onClick={() => navigate("/student/my-courses")}
                                            className="text-sm text-purple-600 font-medium hover:underline"
                                        >
                                            View history
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {inProgress.map(course => (
                                            <div
                                                key={course._id}
                                                onClick={() => navigate(`/student/courses/${course._id}/learn`)}
                                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                                            >
                                                <div className="w-full h-32 bg-gray-100 overflow-hidden">
                                                    {course.thumbnailURL ? (
                                                        <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                            <BookOpen className="w-8 h-8 text-purple-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-semibold text-gray-800 text-xs truncate mb-1">{course.title}</h3>
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                                                            {course.tutor?.name?.charAt(0)?.toUpperCase() || "T"}
                                                        </div>
                                                        <span className="text-xs text-gray-500 truncate">{course.tutor?.name}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                                        <div
                                                            className="bg-purple-600 h-1.5 rounded-full transition-all"
                                                            style={{ width: `${course.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        {course.progress || 0}% complete
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        <div className="max-w-7xl mx-auto px-6 py-10">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Choice favourite course from top category</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {dynamicCategories.map((cat, i) => {
                                    const colors = [
                                        'bg-green-100 text-green-600',
                                        'bg-blue-100 text-blue-500',
                                        'bg-purple-100 text-purple-600',
                                        'bg-teal-100 text-teal-600',
                                        'bg-yellow-100 text-yellow-600',
                                        'bg-red-100 text-red-500',
                                        'bg-gray-100 text-gray-600',
                                        'bg-orange-100 text-orange-600',
                                    ];
                                    const color = colors[i % colors.length];
                                    return (
                                        <button
                                            key={cat._id}
                                            onClick={() => handleCategoryClick(cat.name)}
                                            className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition text-center"
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                                                <Tag className="w-6 h-6" />
                                            </div>
                                            <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                                        </button>
                                    );
                                })}
                                {dynamicCategories.length === 0 && (
                                    <p className="col-span-4 text-gray-400 text-sm text-center py-4">No categories available</p>
                                )}
                            </div>
                        </div>

                        {/* Recommended for you */}
                        {recommended.length > 0 && (
                            <div className="bg-[#ede9f8] py-10 px-6">
                                <div className="max-w-7xl mx-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-800">Recommended for you</h2>
                                        <button className="text-sm text-purple-600 font-medium hover:underline">See all</button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                                        {displayedRecommended.map(c => <CourseCardLarge key={c._id} course={c} />)}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => setRecommendedPage(p => Math.max(0, p - 1))}
                                            disabled={recommendedPage === 0}
                                            className={`p-2 rounded-full ${
                                                recommendedPage === 0
                                                    ? 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <span className="text-sm text-gray-600 self-center">
                                            {recommendedPage + 1} / {recommendedTotalPages}
                                        </span>
                                        <button
                                            onClick={() => setRecommendedPage(p => Math.min(recommendedTotalPages - 1, p + 1))}
                                            disabled={recommendedPage === recommendedTotalPages - 1}
                                            className={`p-2 rounded-full ${
                                                recommendedPage === recommendedTotalPages - 1
                                                    ? 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            <ChevronRight className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Technical Courses */}
                        {technical.length > 0 && (
                            <div className="max-w-7xl mx-auto px-6 py-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-800">Technical Courses</h2>
                                    <button
                                        onClick={() => handleCategoryClick("Development")}
                                        className="text-sm text-purple-600 font-medium hover:underline"
                                    >
                                        See all
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                                    {technical.map(c => <CourseCardCompact key={c._id} course={c} />)}
                                </div>
                            </div>
                        )}

                        {/* Top Rated Courses */}
                        {topRated.length > 0 && (
                            <div className="bg-[#ede9f8] py-10 px-6">
                                <div className="max-w-7xl mx-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-800">Top Rated Courses</h2>
                                        <button className="text-sm text-purple-600 font-medium hover:underline">See all</button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                                        {displayedTopRated.map(c => <CourseCardLarge key={c._id} course={c} />)}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => setTopRatedPage(p => Math.max(0, p - 1))}
                                            disabled={topRatedPage === 0}
                                            className={`p-2 rounded-full ${
                                                topRatedPage === 0
                                                    ? 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <span className="text-sm text-gray-600 self-center">
                                            {topRatedPage + 1} / {topRatedTotalPages}
                                        </span>
                                        <button
                                            onClick={() => setTopRatedPage(p => Math.min(topRatedTotalPages - 1, p + 1))}
                                            disabled={topRatedPage === topRatedTotalPages - 1}
                                            className={`p-2 rounded-full ${
                                                topRatedPage === topRatedTotalPages - 1
                                                    ? 'bg-gray-100 border border-gray-200 cursor-not-allowed'
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                        >
                                            <ChevronRight className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && catalog.length === 0 && (
                            <div className="text-center py-24">
                                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No courses available yet</p>
                            </div>
                        )}
            </div>

            <Footer />
        </div>
    );
}
