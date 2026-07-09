import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Globe, Twitter, Youtube, BookOpen, Star } from "lucide-react";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import StarRating from "../../components/common/StarRating";
import { studentAPI } from "../../api/studentAPI";

function formatDuration(minutes) {
    if (!minutes || minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.round(minutes / 60);
    return `${hrs} hr${hrs !== 1 ? 's' : ''}`;
}

export default function TutorProfileView() {
    const { tutorId } = useParams();
    const navigate = useNavigate();
    const [tutor, setTutor] = useState(null);
    const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalReviews: 0 });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [coursePage, setCoursePage] = useState(0);
    const coursesPerPage = 4;

    useEffect(() => {
        const fetchTutorProfile = async () => {
            setLoading(true);
            try {
                const res = await studentAPI.fetchTutorDetails(tutorId);
                if (res.success) {
                    setTutor(res.data.tutor);
                    setStats(res.data.stats || { totalCourses: 0, totalStudents: 0, totalReviews: 0 });
                }

                const coursesRes = await studentAPI.fetchPublishedCourses({ tutor: tutorId, limit: 100 });
                if (coursesRes.success) {
                    setCourses(coursesRes.data.courses || []);
                }
            } catch (error) {
                console.error("Error fetching tutor profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTutorProfile();
    }, [tutorId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StudentNavbar />
                <div className="flex-1 flex items-center justify-center py-32">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!tutor) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StudentNavbar />
                <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-gray-800">Tutor Not Found</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-6">The tutor profile you are looking for does not exist or has been removed.</p>
                    <button 
                        onClick={() => navigate('/tutors')}
                        className="bg-purple-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
                    >
                        Back to Tutors
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    const totalCoursePages = Math.ceil(courses.length / coursesPerPage);
    const startIdx = coursePage * coursesPerPage;
    const paginatedCourses = courses.slice(startIdx, startIdx + coursesPerPage);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar />

            {/* Breadcrumb section */}
            <div className="bg-white border-b border-gray-100 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 text-xs text-gray-500">
                    <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => navigate('/')}>Home</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => navigate('/tutors')}>Tutors</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-semibold text-gray-800">{tutor.name}</span>
                </div>
            </div>

            {/* Main Profile Info Section */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-8 space-y-8">
                        <div>
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-widest bg-purple-50 px-3.5 py-1.5 rounded-full">
                                Instructor
                            </span>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mt-4">
                                {tutor.name}
                            </h1>
                            <p className="text-lg text-gray-500 font-medium mt-2 leading-relaxed">
                                {tutor.tutorProfile?.subject || "Expert Educator"}
                            </p>
                        </div>

                        {/* Stats Summary cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                            </div>
                            <div className="border-l border-gray-100 pl-6">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Reviews</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReviews}</p>
                            </div>
                            <div className="border-l border-gray-100 pl-6 col-span-2 sm:col-span-1">
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Courses Created</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCourses}</p>
                            </div>
                        </div>

                        {/* About/Bio section */}
                        {tutor.tutorProfile?.bio && (
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-3">
                                    About {tutor.name}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                                    {tutor.tutorProfile.bio}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Avatar & Social details */}
                    <div className="lg:col-span-4 flex flex-col items-center lg:sticky lg:top-24 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <div className="w-48 h-48 rounded-full bg-purple-50 overflow-hidden border-4 border-gray-50 shadow-md flex items-center justify-center mb-8">
                            {tutor.profileImageURL ? (
                                <img
                                    src={tutor.profileImageURL}
                                    alt={tutor.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-5xl font-bold text-purple-600 select-none">
                                    {tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Slider Section - More Courses */}
            {courses.length > 0 && (
                <section className="bg-purple-50/50 py-16 px-6 border-t border-purple-100">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    More Courses by <span className="text-purple-600">{tutor.name}</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Browse active courses published by this tutor.</p>
                            </div>

                            {/* Carousel controls */}
                            {totalCoursePages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCoursePage(p => Math.max(0, p - 1))}
                                        disabled={coursePage === 0}
                                        className={`p-2 rounded-full border transition-colors ${
                                            coursePage === 0
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-white border-purple-200 hover:bg-purple-100 text-purple-700'
                                        }`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-semibold text-gray-500 self-center select-none px-1">
                                        {coursePage + 1} / {totalCoursePages}
                                    </span>
                                    <button
                                        onClick={() => setCoursePage(p => Math.min(totalCoursePages - 1, p + 1))}
                                        disabled={coursePage === totalCoursePages - 1}
                                        className={`p-2 rounded-full border transition-colors ${
                                            coursePage === totalCoursePages - 1
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Course Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {paginatedCourses.map((course) => (
                                <div
                                    key={course._id}
                                    onClick={() => navigate(`/student/courses/${course._id}`)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col group"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full h-44 bg-gray-100 overflow-hidden relative">
                                        {course.thumbnailURL ? (
                                            <img
                                                src={course.thumbnailURL}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-purple-300" />
                                            </div>
                                        )}
                                        {/* Category badge */}
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-purple-700 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                            {course.category || "General"}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <StarRating rating={course.rating || 0} size={11} />
                                                <span className="text-[10px] font-semibold text-gray-400">
                                                    ({course.reviewCount || 0} Reviews)
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-medium mt-2">
                                                {formatDuration(course.totalDuration)} • {course.totalLessons} Lectures • Beginner
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            <span className="text-xs text-gray-500 font-medium">By {tutor.name}</span>
                                            <div className="flex items-center gap-1.5">
                                                {course.offer && course.offer.discountedPrice < course.price ? (
                                                    <>
                                                        <span className="text-[10px] text-gray-400 line-through">₹{course.price}</span>
                                                        <span className="text-purple-600 font-bold text-sm">₹{course.offer.discountedPrice}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-purple-600 font-bold text-sm">
                                                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                                                    </span> 
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}
