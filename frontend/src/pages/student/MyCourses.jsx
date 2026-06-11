import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses } from '../../store/slices/studentSlice';
import { BookOpen, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

function CourseCard({ course, onClick }) {
    const progress = course.progress || 0;
    const isCompleted = progress >= 100;
    const isUnavailable = course.status && course.status !== 'published';

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition hover:shadow-md cursor-pointer h-full flex flex-col"
        >
            <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-purple-300" />
                    </div>
                )}
                {isUnavailable && (
                    <div className="absolute top-2 left-2">
                        <span className="bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> Temporarly Unavailable
                        </span>
                    </div>
                )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 text-base leading-snug mb-2 line-clamp-2">
                    {course.title}
                </h3>
                <p className="text-sm text-purple-600 font-medium mb-4">
                    By {course.tutor?.name || 'Tutor'}
                </p>
                {isUnavailable && (
                    <p className="text-sm text-yellow-600 mb-3">
                        This course is unlisted. Your access is unaffected.
                    </p>
                )}
                <div className="mt-auto">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-purple-600'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{progress}% complete</span>
                        {isCompleted && (
                            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                <CheckCircle className="w-4 h-4" /> Done
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MyCourses() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enrolledCourses, loading } = useSelector(state => state.student);
    const [inProgressPage, setInProgressPage] = useState(0);
    const [completedPage, setCompletedPage] = useState(0);
    const coursesPerPage = 4;

    useEffect(() => {
        dispatch(fetchEnrolledCourses());
    }, [dispatch]);

    const inProgress = enrolledCourses.filter(c => (c.progress || 0) < 100);
    const completed = enrolledCourses.filter(c => (c.progress || 0) >= 100);

    const inProgressTotalPages = Math.ceil(inProgress.length / coursesPerPage);
    const completedTotalPages = Math.ceil(completed.length / coursesPerPage);

    const inProgressStart = inProgressPage * coursesPerPage;
    const inProgressEnd = inProgressStart + coursesPerPage;
    const displayedInProgress = inProgress.slice(inProgressStart, inProgressEnd);

    const completedStart = completedPage * coursesPerPage;
    const completedEnd = completedStart + coursesPerPage;
    const displayedCompleted = completed.slice(completedStart, completedEnd);

    if (loading) {
        return (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />
                ))}
            </div>
        );
    }

    if (enrolledCourses.length === 0) {
        return (
            <div className="p-8 text-center py-24">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4 text-lg">You haven't enrolled in any courses yet</p>
                <button
                    onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                    Browse Courses
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            {inProgress.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Enrolled Courses</h2>
                        {inProgressTotalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setInProgressPage(p => Math.max(0, p - 1))}
                                    disabled={inProgressPage === 0}
                                    className={`p-1.5 rounded-lg border ${
                                        inProgressPage === 0
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-600">
                                    {inProgressPage + 1} / {inProgressTotalPages}
                                </span>
                                <button
                                    onClick={() => setInProgressPage(p => Math.min(inProgressTotalPages - 1, p + 1))}
                                    disabled={inProgressPage === inProgressTotalPages - 1}
                                    className={`p-1.5 rounded-lg border ${
                                        inProgressPage === inProgressTotalPages - 1
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedInProgress.map(course => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onClick={() => navigate(`/student/courses/${course._id}/lessons`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {completed.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Completed Courses</h2>
                        {completedTotalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCompletedPage(p => Math.max(0, p - 1))}
                                    disabled={completedPage === 0}
                                    className={`p-1.5 rounded-lg border ${
                                        completedPage === 0
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-gray-600">
                                    {completedPage + 1} / {completedTotalPages}
                                </span>
                                <button
                                    onClick={() => setCompletedPage(p => Math.min(completedTotalPages - 1, p + 1))}
                                    disabled={completedPage === completedTotalPages - 1}
                                    className={`p-1.5 rounded-lg border ${
                                        completedPage === completedTotalPages - 1
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedCompleted.map(course => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onClick={() => navigate(`/student/courses/${course._id}/lessons`)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
