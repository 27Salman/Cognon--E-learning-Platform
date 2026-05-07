import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses } from '../../store/slices/studentSlice';
import { BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

function CourseCard({ course, onClick }) {
    const progress = course.progress || 0;
    const isCompleted = progress >= 100;
    const isUnavailable = course.status && course.status !== 'published';

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition hover:shadow-md cursor-pointer"
        >
            <div className="w-full h-40 bg-gray-100 overflow-hidden relative">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-purple-300" />
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
            <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">
                    {course.title}
                </h3>
                <p className="text-xs text-purple-600 font-medium mb-3">
                    By {course.tutor?.name || 'Tutor'}
                </p>
                {isUnavailable && (
                    <p className="text-xs text-yellow-600 mb-2">
                        This course is unlisted. Your access is unaffected.
                    </p>
                )}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                    <div
                        className={`h-1.5 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-purple-600'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{progress}% complete</span>
                    {isCompleted && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3 h-3" /> Done
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MyCourses() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enrolledCourses, loading } = useSelector(state => state.student);

    useEffect(() => {
        dispatch(fetchEnrolledCourses());
    }, [dispatch]);

    const inProgress = enrolledCourses.filter(c => (c.progress || 0) < 100);
    const completed = enrolledCourses.filter(c => (c.progress || 0) >= 100);

    if (loading) {
        return (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl h-56 animate-pulse" />
                ))}
            </div>
        );
    }

    if (enrolledCourses.length === 0) {
        return (
            <div className="p-6 text-center py-24">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
                <button
                    onClick={() => navigate('/student/courses')}
                    className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                    Browse Courses
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {inProgress.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-5">Enrolled Courses</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {inProgress.map(course => (
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
                    <h2 className="text-xl font-bold text-gray-800 mb-5">Completed Courses</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {completed.map(course => (
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
