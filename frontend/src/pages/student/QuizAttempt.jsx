import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AlertCircle, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { quizAPI } from "../../api/quizAPI";

export default function QuizAttempt() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const maxViolations = 3;
  const timerRef = useRef(null);
  const autosaveRef = useRef(null);

  //Quiz
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const status = await quizAPI.getStudentQuizStatus(courseId);
        const statusData = status.data;
        setQuizDetails(statusData.quiz);

        const attempt = await quizAPI.startAttempt(quizId);
        const currentAttempt = attempt.data;

        if (currentAttempt.status !== "started") {
          toast.error("This attempt is already finished.");
          navigate(`/student/courses/${courseId}`);
          return;
        }

        setAttempt(currentAttempt);
        setAnswers(currentAttempt.answers || []);

        const endTime =
          new Date(currentAttempt.startTime).getTime() +
          statusData.quiz.duration * 60 * 1000;
        const remainingSeconds = Math.max(
          0,
          Math.floor((endTime - Date.now()) / 1000),
        );
        setTimeLeft(remainingSeconds);

        document.documentElement.requestFullscreen().catch(() => {
          console.log("Fullscreen request denied by user or browser");
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to start quiz");
        navigate(`/student/courses/${courseId}`);
      } finally {
        setLoading(false);
      }
    };
    initQuiz();
  }, [courseId, quizId, navigate]);

  //Timer
  useEffect(() => {
    if (!attempt || timeLeft <= 0 || submitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [attempt, submitting]);

  //Visibility & Blur tracking
  useEffect(() => {
    if (!attempt || attempt.status !== "started" || submitting) return;

    const handleFocusLoss = () => {
      setViolationCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= maxViolations) {
          handleSubmit("auto_submitted_violation");
          toast.error(
            "Exam automatically submitted due to multiple rule violations.",
          );
        } else {
          setShowWarning(true);
          toast.error(
            `Warning ${newCount}/${maxViolations}: Please stay on the exam tab!`,
          );
        }
        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleFocusLoss();
    };
    const handleBlur = () => {
      handleFocusLoss();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [attempt, submitting]);

  //Autosave
  useEffect(() => {
    if (!attempt || submitting) return;

    autosaveRef.current = setInterval(async () => {
      try {
        await quizAPI.autosaveAttempt(attempt._id, answers);
      } catch (error) {
        console.error("Autosave failed", error);
      }
    }, 15000);

    return () => clearInterval(autosaveRef.current);
  }, [attempt, answers, submitting]);

  // Handlers
  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionId === questionId);
      const updated = [...prev];
      if (existingIndex >= 0) {
        updated[existingIndex].selectedOptionIndex = optionIndex;
      } else {
        updated.push({ questionId, selectedOptionIndex: optionIndex });
      }
      return updated;
    });
  };

  const handleSubmit = async (reason = "submitted") => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autosaveRef.current);

    try {
      await quizAPI.autosaveAttempt(attempt._id, answers);
      const res = await quizAPI.submitAttempt(attempt._id, reason);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.log(err));
      }

      toast.success("Exam submitted successfully!");
      setResult(res.data);
    } catch (error) {
      toast.error("Error submitting exam.");
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Preparing your exam...
      </div>
    );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md text-center shadow-2xl">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Warning!</h2>
            <p className="text-gray-700 mb-6 font-medium">
              You navigated away from the exam window. This is strike{" "}
              {violationCount} of {maxViolations}. If you reach {maxViolations}{" "}
              strikes, your exam will be automatically submitted.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg w-full transition-colors"
            >
              I Understand, Return to Exam
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header Stickied to Top */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 sticky top-4 z-40 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {quizDetails?.title}
            </h1>
            <p className="text-sm text-gray-500">
              Attempt ID: {attempt?._id.slice(-6)}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div
              className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-gray-700"}`}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => handleSubmit("submitted")}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              {submitting ? "Submitting..." : "Finish Exam"}
            </button>
          </div>
        </div>

        {/* Questions Map */}
        <div className="space-y-6">
          {attempt?.questionsSnapshot.map((q, index) => {
            const currentAnswer = answers.find(
              (a) => a.questionId === q.questionId,
            );

            return (
              <div
                key={q.questionId}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    <span className="text-purple-600 font-bold mr-2">
                      Q{index + 1}.
                    </span>
                    {q.questionText}
                  </h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {q.marks} Mark{q.marks > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3 mt-4">
                  {q.options.map((opt, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                        currentAnswer?.selectedOptionIndex === optIndex
                          ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.questionId}`}
                        checked={
                          currentAnswer?.selectedOptionIndex === optIndex
                        }
                        onChange={() =>
                          handleSelectOption(q.questionId, optIndex)
                        }
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-2 ${result.passed ? "bg-green-500" : "bg-red-500"}`}
            ></div>

            {result.passed ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            )}

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {result.passed ? "Congratulations!" : "Almost There!"}
            </h2>

            <p className="text-gray-600 mb-6 text-lg">
              {result.passed
                ? "You have successfully passed the exam."
                : "You did not pass this time. Better luck next time!"}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <div className="text-sm text-gray-500 mb-1">Your Score</div>
              <div
                className={`text-4xl font-black ${result.passed ? "text-green-600" : "text-red-600"}`}
              >
                {result.score}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Passing marks required: {quizDetails?.passingMarks}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {result.passed ? (
                <button
                  onClick={() => navigate("/student/certificates")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-purple-200"
                >
                  View Certificate
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-purple-200"
                >
                  Return to Course
                </button>
              )}
              {result.passed && (
                <button
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Return to Course
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
