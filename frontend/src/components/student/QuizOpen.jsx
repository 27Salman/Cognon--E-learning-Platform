import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, PlayCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { quizAPI } from '../../api/quizAPI';

export default function QuizOpen({ courseId, courseProgress }) {
    const navigate = useNavigate();
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await quizAPI.getStudentQuizStatus(courseId);
                setStatusData(res.data.data);
            } catch (error) {
                console.log("No quiz available for this course yet.");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [courseId, courseProgress]);

    if (loading) return <div className="animate-pulse bg-gray-200 h-24 rounded-xl w-full mt-6"></div>;
    if (!statusData || !statusData.quiz) return null;
    const { quiz, isCourseCompleted, cooldownActive, cooldownEndsAt, attempts } = statusData;

    const passedAttempt = attempts?.find(a => a.passed);
    if (passedAttempt) {
        return (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Quiz Completed!
                    </h3>
                    <p className="text-green-600 mt-1">You passed this course's final exam with a score of {passedAttempt.score}.</p>
                </div>
            </div>
        );
    }

    if (attempts?.length >= quiz.maxAttempts) {
        return (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Maximum Attempts Reached
                </h3>
                <p className="text-red-600 mt-1">You have used all {quiz.maxAttempts} attempts for this exam.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white border border-purple-100 shadow-sm rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {quiz.duration} mins</span>
                        <span>Passing: {quiz.passingMarks} marks</span>
                        <span>Attempts: {attempts?.length || 0} / {quiz.maxAttempts}</span>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {!isCourseCompleted ? (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg font-medium">
                            <Lock className="w-4 h-4" />
                            Complete all lessons to unlock
                        </div>
                    ) : cooldownActive ? (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg font-medium">
                                <Clock className="w-4 h-4" />
                                Cool-down Active
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Available at: {new Date(cooldownEndsAt).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate(`/student/courses/${courseId}/quiz/${quiz._id}`)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-md shadow-purple-200"
                        >
                            <PlayCircle className="w-5 h-5" />
                            {attempts?.some(a => a.status === 'started') ? 'Resume Quiz' : 'Start Quiz'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
