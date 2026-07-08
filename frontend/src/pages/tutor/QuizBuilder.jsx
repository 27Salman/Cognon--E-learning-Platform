import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { quizAPI } from "../../api/quizAPI";
import { Trash2 } from "lucide-react";

export default function QuizBuilder() {

    const { id: courseId } = useParams();

    const [isLoaded, setIsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quizId, setQuizId] = useState(null);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(0);
    const [passingMarks, setPassingMarks] = useState(0);
    const [maxAttempts, setMaxAttempts] = useState(0);
    const [isPublished, setIsPublished] = useState(false);
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [shuffleOptions, setShuffleOptions] = useState(false);

    const [questions, setQuestions] = useState([
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }
    ]);

        useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await quizAPI.getQuizForTutor(courseId);
                if (res.success && res.data) {
                    const q = res.data;
                    setQuizId(q._id);
                    setTitle(q.title);
                    setDuration(q.duration);
                    setPassingMarks(q.passingMarks);
                    setMaxAttempts(q.maxAttempts);
                    setIsPublished(q.isPublished);
                    setShuffleQuestions(q.shuffleQuestions);
                    setShuffleOptions(q.shuffleOptions);
                    setQuestions(q.questions);

                    const draftStr = localStorage.getItem(`quiz_draft_${courseId}`);
                    if (draftStr) {
                        try {
                            const parsed = JSON.parse(draftStr);
                            const isDifferent = 
                                parsed.title !== q.title ||
                                parsed.duration !== q.duration ||
                                parsed.passingMarks !== q.passingMarks ||
                                parsed.maxAttempts !== q.maxAttempts ||
                                parsed.isPublished !== q.isPublished ||
                                parsed.shuffleQuestions !== q.shuffleQuestions ||
                                parsed.shuffleOptions !== q.shuffleOptions ||
                                JSON.stringify(parsed.questions.map(({ _id, ...rest }) => rest)) !== JSON.stringify(q.questions.map(({ _id, ...rest }) => rest));

                            if (isDifferent) {
                                setTitle(parsed.title);
                                setDuration(parsed.duration);
                                setPassingMarks(parsed.passingMarks);
                                setMaxAttempts(parsed.maxAttempts);
                                setIsPublished(parsed.isPublished);
                                setShuffleQuestions(parsed.shuffleQuestions);
                                setShuffleOptions(parsed.shuffleOptions);
                                setQuestions(parsed.questions);
                                toast.success('Restored your unsaved draft!');
                            }
                        } catch (e) {
                            localStorage.removeItem(`quiz_draft_${courseId}`);
                        }
                    }
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    const draftStr = localStorage.getItem(`quiz_draft_${courseId}`);
                    if (draftStr) {
                        try {
                            const parsed = JSON.parse(draftStr);
                            const isEmpty = 
                                parsed.title === '' &&
                                parsed.duration === 0 &&
                                parsed.passingMarks === 0 &&
                                parsed.maxAttempts === 0 &&
                                !parsed.isPublished &&
                                !parsed.shuffleQuestions &&
                                !parsed.shuffleOptions &&
                                parsed.questions.length === 1 &&
                                parsed.questions[0].questionText === '' &&
                                parsed.questions[0].options.every(opt => opt === '');

                            if (!isEmpty) {
                                setTitle(parsed.title);
                                setDuration(parsed.duration);
                                setPassingMarks(parsed.passingMarks);
                                setMaxAttempts(parsed.maxAttempts);
                                setIsPublished(parsed.isPublished);
                                setShuffleQuestions(parsed.shuffleQuestions);
                                setShuffleOptions(parsed.shuffleOptions);
                                setQuestions(parsed.questions);
                                toast.success('Restored your unsaved draft!');
                            }
                        } catch (e) {
                            localStorage.removeItem(`quiz_draft_${courseId}`);
                        }
                    }
                } else {
                    toast.error('Failed to load quiz data');
                }
            } finally {
                setIsLoaded(true);
            }
        }
        fetchQuiz();
    }, [courseId]);


    useEffect(() => {
        if (!isLoaded) return;
        const draft = {
            title, duration, passingMarks, maxAttempts,
            isPublished, shuffleQuestions, shuffleOptions, questions
        };
        localStorage.setItem(`quiz_draft_${courseId}`, JSON.stringify(draft));
    }, [title, duration, passingMarks, maxAttempts, isPublished, shuffleQuestions,
        shuffleOptions, questions, courseId, isLoaded]);

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            questionText: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            marks: 1
        }]);
        toast.success('Question added successfully');
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);

        toast.success('Question removed successfully');
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[optIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const quizData = {
                courseId,
                title,
                duration,
                passingMarks,
                maxAttempts,
                isPublished,
                shuffleQuestions,
                shuffleOptions,
                questions,
            }
            if (quizId) {
                await quizAPI.updateQuiz(quizId, quizData);
                toast.success('Quiz updated successfully');
            } else {
                const create = await quizAPI.createQuiz(quizData);
                toast.success('Quiz created successfully');
                setQuizId(create.data._id);
                localStorage.removeItem(`quiz_draft_${courseId}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    }

    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Quiz Builder</h1>
                <div className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-semibold">
                    Total Marks: {totalMarks}
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                    {loading ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>

            {/* Configuration Box */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Final React Exam" 
                            value={title || ''} 
                            onChange={(e) => setTitle(e.target.value)}
                            className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <input 
                            type="number" 
                            value={duration || ''} 
                            onChange={(e) => setDuration(Number(e.target.value))}
                            placeholder="30"
                            className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
                        <input 
                            type="number" 
                            value={passingMarks || ''} 
                            onChange={(e) => setPassingMarks(Number(e.target.value))}
                            placeholder="10"
                            className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Max Attempts Per Day</label>
                        <input 
                            type="number" 
                            value={maxAttempts || ''} 
                            onChange={(e) => setMaxAttempts(Number(e.target.value))}
                            placeholder="3"
                            className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <label className="flex items-center gap-2 col-span-2">
                        <input
                            type="checkbox"
                            checked={shuffleQuestions}
                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                        />
                        Shuffle Questions
                    </label>
                    <label className="flex items-center gap-2 col-span-2">
                        <input
                            type="checkbox"
                            checked={shuffleOptions}
                            onChange={(e) => setShuffleOptions(e.target.checked)}
                        />
                        Shuffle Options
                    </label>


                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                        />
                        Published
                    </label>
                </div>
            </div>

            {/* Questions List */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Questions</h2>
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm mb-4 border">
                        <div className="flex justify-between mb-8">
                            <h3 className="font-medium">Question {qIndex + 1}</h3>
                            <button
                                onClick={() => handleRemoveQuestion(qIndex)}
                                className="text-red-500 text-sm"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Question Text"
                            value={q.questionText || q.text || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                        />

                        {/* Options */}
                        <div className="space-y-3">
                            {q.options.map((opt, optIndex) => {
                                const isCorrect = q.correctOptionIndex === optIndex;
                                return (
                                    <div 
                                        key={optIndex} 
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                            isCorrect ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`correct_${qIndex}`}
                                            checked={isCorrect}
                                            onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIndex)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Option ${optIndex + 1}`}
                                            value={opt}
                                            onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                            className={`w-full bg-transparent outline-none ${
                                                isCorrect ? 'text-green-900 placeholder-green-700/50' : 'text-gray-900'
                                            }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm">Marks for this question:</label>
                            <input
                                type="number"
                                value={q.marks}
                                onChange={(e) => handleQuestionChange(qIndex, 'marks', Number(e.target.value))}
                                className="border p-2 rounded w-24"
                            />
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddQuestion}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500 font-medium"
                >
                    + Add Another Question
                </button>
            </div>
        </div>
    );
}


