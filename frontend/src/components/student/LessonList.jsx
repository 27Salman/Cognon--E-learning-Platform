import { CheckCircle, Circle, Clock } from 'lucide-react';

export default function LessonList({ lessons = [], currentLessonId, onSelect }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">
                    Course Content ({lessons.length} lessons)
                </h3>
            </div>
            <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {lessons.map((lesson) => {
                    const isCompleted = !!lesson.isCompleted;
                    const isCurrent = lesson._id === currentLessonId;

                    return (
                        <li
                            key={lesson._id}
                            onClick={() => onSelect(lesson)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                isCurrent
                                    ? 'bg-purple-50 border-l-4 border-purple-600'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                                <Circle className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-purple-600' : 'text-gray-300'}`} />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm truncate ${isCurrent ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                                    {lesson.order}. {lesson.title}
                                </p>
                                {lesson.duration > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                        <Clock className="w-3 h-3" />
                                        {lesson.duration} min
                                    </span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
