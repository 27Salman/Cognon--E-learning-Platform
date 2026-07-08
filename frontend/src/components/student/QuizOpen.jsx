import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, PlayCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { quizAPI } from '../../api/quizAPI';

export default function QuizOpen({ courseId, courseProgress }) {
    const navigate = useNavigate();
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await quizAPI.getStudentQuizStatus(courseId);
                setStatusData(res.data);
            } catch (error) {
                console.log("No quiz available for this course yet.");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [courseId, courseProgress]);

    
    //cool-down
    useEffect(() => {
        if (!statusData?.cooldownActive || !statusData?.cooldownEndsAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(statusData.cooldownEndsAt).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft('Ready. Please refresh.');
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = '';
            if (hours > 0) timeString += `${hours}h `;
            timeString += `${minutes}m ${seconds}s`;
            setTimeLeft(timeString);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [statusData]);

    if (loading) return <div className="animate-pulse bg-gray-200 h-24 rounded-xl w-full mt-6"></div>;
    if (!statusData || !statusData.quiz) return null;
    const { quiz, isCourseCompleted, cooldownActive, cooldownEndsAt, attempts, attemptsTodayCount } = statusData;

    const passedAttempt = attempts?.find(a => a.passed);
    if (passedAttempt) {
        return (
            <div className="mt-4 mb-2">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <h3 className="text-sm font-bold text-green-800 flex items-center gap-1.5 pl-2">
                        <CheckCircle2 className="w-4 h-4" /> Passed!
                    </h3>
                    <p className="text-xs text-green-700 mt-1 pl-2">Score: <span className="font-bold">{passedAttempt.score}</span> / {quiz.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || (quiz.totalQuestions || 0)}</p>
                    <button 
                        onClick={() => navigate('/student/certificates')}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                        View Certificate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mt-4 mb-2">
                <div className="bg-white border border-purple-200 shadow-sm rounded-xl p-3 relative overflow-hidden group hover:border-purple-300 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                    
                    <h3 className="text-sm font-bold text-gray-800 mb-2 pl-2 truncate" title={quiz.title}>
                        {quiz.title}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-xs text-gray-600 mb-3 pl-2">
                        <div className="flex items-center gap-1" title="Duration">
                            <Clock className="w-3.5 h-3.5 text-purple-500" />
                            <span className="font-medium">{quiz.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1" title="Passing Marks">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="font-medium">{quiz.passingMarks} marks</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <span className="text-gray-500 font-medium">Attempts</span>
                            <span className={`font-bold ${attemptsTodayCount >= quiz.maxAttempts ? 'text-red-500' : 'text-purple-600'}`}>
                                {attemptsTodayCount || 0} / {quiz.maxAttempts}
                            </span>
                        </div>
                    </div>

                    <div className="px-1">
                        {!isCourseCompleted ? (
                            <div className="flex flex-col items-center justify-center text-amber-600 bg-amber-50 px-2 py-2 rounded-lg border border-amber-100">
                                <Lock className="w-4 h-4 mb-1" />
                                <span className="text-[10px] font-bold text-center leading-tight">Complete all lessons to unlock</span>
                            </div>
                        ) : cooldownActive ? (
                            <div className="flex flex-col items-center justify-center bg-red-50 px-2 py-2 rounded-lg border border-red-100">
                                <Clock className="w-4 h-4 text-red-500 mb-1" />
                                <span className="text-[10px] font-bold text-red-700">Cool-down Active</span>
                                <span className="text-[10px] text-red-500 mt-0.5 font-medium">
                                    Wait: {timeLeft}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                                <PlayCircle className="w-4 h-4" />
                                {attempts?.some(a => a.status === 'started') ? 'Resume Quiz' : 'Start Exam'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Ready to start?</h2>
                        <div className="bg-purple-50 p-4 rounded-xl mb-4">
                            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4">
                                <li>The exam will run for <span className="font-bold">{quiz.duration} minutes</span>.</li>
                                <li>The timer <span className="font-bold">cannot be paused</span> once started.</li>
                                <li>Do <span className="font-bold text-red-600">NOT</span> switch tabs or exit fullscreen, or your exam may be auto-submitted.</li>
                                <li>Make sure you have a stable internet connection.</li>
                            </ul>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => navigate(`/student/courses/${courseId}/quiz/${quiz._id}`)}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                Yes, Start Exam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
