import { useNavigate } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';

export default function CourseCard({ course }) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/student/courses/${course._id}`)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
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
            <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm truncate">{course.title}</h3>
                <p className="text-xs text-gray-500 mt-1">By {course.tutor?.name}</p>
                <div className="flex items-center justify-between mt-3">
                    <span className="text-purple-600 font-bold text-sm">
                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {course.enrolledCount || 0}
                    </span>
                </div>
            </div>
        </div>
    );
}
