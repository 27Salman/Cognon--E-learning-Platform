import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourseDetails,
  fetchCourseProgress,
  markLessonComplete,
  fetchPublishedCourses,
} from "../../store/slices/studentSlice";
import VideoPlayer from "../../components/student/VideoPlayer";
import {
  CheckCircle,
  ChevronLeft,
  Download,
  MessageSquare,
  Clock,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { ROUTES } from "../../utils/constants";
import QuizOpen from "../../components/student/QuizOpen";

export default function LessonViewer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentCourse, progress, loading, catalog } = useSelector(
    (state) => state.student,
  );
  const [currentLesson, setCurrentLesson] = useState(null);
  const [marking, setMarking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const [openChapters, setOpenChapters] = useState({});

  useEffect(() => {
    dispatch(fetchCourseDetails(courseId));
    dispatch(fetchCourseProgress(courseId));
    dispatch(fetchPublishedCourses({}));
  }, [dispatch, courseId]);

  useEffect(() => {
    if (currentCourse?.lessons?.length && !currentLesson) {
      const targetId = location.state?.lessonId;
      const target = targetId
        ? currentCourse.lessons.find((l) => l._id === targetId)
        : null;
      setCurrentLesson(target || currentCourse.lessons[0]);
    }
  }, [currentCourse]);

  const lessons = (currentCourse?.lessons || [])
    .slice()
    .sort((a, b) => a.order - b.order);
  const progressLessons = Array.isArray(progress?.lessons)
    ? progress.lessons
    : [];
  const currentIndex = lessons.findIndex((l) => l._id === currentLesson?._id);
  const currentProgressLesson = progressLessons.find(
    (l) => l._id?.toString() === currentLesson?._id?.toString(),
  );
  const isCompleted = currentProgressLesson?.isCompleted ?? false;

  const chapMap = {};
  lessons.forEach((l) => {
    const key = l.chapter?.order ?? 1;
    if (!chapMap[key])
      chapMap[key] = {
        order: key,
        title: l.chapter?.title ?? "Chapter 1",
        lessons: [],
      };
    chapMap[key].lessons.push(l);
  });
  const chapters = Object.values(chapMap)
    .sort((a, b) => a.order - b.order)
    .map((ch) => ({
      ...ch,
      lessons: ch.lessons.sort((a, b) => a.order - b.order),
    }));

  useEffect(() => {
    if (chapters.length > 0 && Object.keys(openChapters).length === 0) {
      const allOpen = {};
      chapters.forEach((ch) => {
        allOpen[ch.order] = true;
      });
      setOpenChapters(allOpen);
    }
  }, [chapters.length]);

  useEffect(() => {
    if (!currentLesson?._id) return;
    clearInterval(timerRef.current);
    setTimerActive(false);
    const key = `lesson_elapsed_${currentLesson._id}`;
    const saved = parseInt(localStorage.getItem(key) || "0", 10);
    setElapsed(isCompleted ? Infinity : saved);
  }, [currentLesson?._id, isCompleted]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (timerActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          if (currentLesson?._id) {
            localStorage.setItem(`lesson_elapsed_${currentLesson._id}`, next);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, isCompleted, currentLesson?._id]);

  const handleVideoPlay = () => {
    if (!isCompleted) setTimerActive(true);
  };

  // 80% of lesson duration in seconds
  const requiredSeconds = currentLesson?.duration
    ? currentLesson.duration * 60 * 0.8
    : 0;
  const canMarkComplete =
    isCompleted || requiredSeconds === 0 || elapsed >= requiredSeconds;
  const remainingMin = Math.ceil((requiredSeconds - elapsed) / 60);

  const isLessonAccessible = (index) => {
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    return (
      progressLessons.find(
        (p) => p._id?.toString() === prevLesson._id?.toString(),
      )?.isCompleted ?? false
    );
  };

  const alsoBoought = catalog.filter((c) => c._id !== courseId).slice(0, 4);

  const handleMarkComplete = async () => {
    if (!currentLesson || isCompleted) return;
    setMarking(true);
    try {
      await dispatch(
        markLessonComplete({ courseId, lessonId: currentLesson._id }),
      ).unwrap();
      localStorage.removeItem(`lesson_elapsed_${currentLesson._id}`);
      setTimerActive(false);
      clearInterval(timerRef.current);
      dispatch(fetchCourseProgress(courseId));
      toast.success("Lesson marked as complete!");
    } catch (err) {
      toast.error(err || "Failed to mark complete");
    } finally {
      setMarking(false);
    }
  };

  const handleDownloadPdf = async () => {
    const pdfUrl = currentLesson?.pdfNotesURL || currentLesson?.pdfNotes;
    if (!pdfUrl) {
      toast.error("No PDF available for this lesson");
      return;
    }

    try {
      if (pdfUrl.includes("cloudinary.com")) {
        const parts = pdfUrl.split("/upload/");
        if (parts.length === 2) {
          const downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
          window.open(downloadUrl, "_blank");
          return;
        }
      }

      if (pdfUrl.startsWith("http")) {
        window.open(pdfUrl, "_blank");
        return;
      }

      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/lessons/${currentLesson._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentLesson.title}-Notes.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Could not download the PDF");
    }
  };

  const selectLesson = (lesson) => {
    const full = lessons.find((l) => l._id === lesson._id) || lesson;
    setCurrentLesson(full);
  };

  if (loading || !currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-32 bg-purple-700 animate-pulse" />
        <div className="p-6 grid grid-cols-3 gap-6">
          <div className="bg-gray-100 rounded-xl h-96 animate-pulse" />
          <div className="col-span-2 bg-gray-100 rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  const tutor = currentCourse.tutor;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Purple header */}
      <div className="bg-purple-700 text-white px-5 py-4">
        <div className="flex items-start justify-between">
          <button
            onClick={() => navigate(`/student/courses/${courseId}/lessons`)}
            className="flex items-center gap-1.5 text-purple-200 hover:text-white text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl font-bold">{currentCourse.title}</h1>
            {currentCourse.description && (
              <p className="text-purple-200 text-sm mt-0.5 line-clamp-1">
                {currentCourse.description}
              </p>
            )}
          </div>
          {currentCourse.totalDuration > 0 && (
            <span className="flex items-center gap-1.5 text-purple-200 text-sm flex-shrink-0">
              <Clock className="w-4 h-4" />
              {currentCourse.totalDuration >= 60
                ? `${Math.round(currentCourse.totalDuration / 60)} hr`
                : `${currentCourse.totalDuration} min`}
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="px-3 pt-3 pb-4">
            {chapters.map((chapter) => {
              const isOpen = openChapters[chapter.order] !== false;
              const completedInChapter = chapter.lessons.filter(
                (l) =>
                  progressLessons.find(
                    (p) => p._id?.toString() === l._id?.toString(),
                  )?.isCompleted,
              ).length;
              return (
                <div key={chapter.order} className="mb-2">
                  {/* Chapter header — clickable toggle */}
                  <button
                    onClick={() =>
                      setOpenChapters((prev) => ({
                        ...prev,
                        [chapter.order]: !isOpen,
                      }))
                    }
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mb-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[9px] font-bold">
                          {chapter.order}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {chapter.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {completedInChapter}/{chapter.lessons.length}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Lessons in this chapter */}
                  {isOpen &&
                    chapter.lessons.map((lesson, index) => {
                      const lessonIndex = lessons.findIndex(
                        (l) => l._id === lesson._id,
                      );
                      const pl = progressLessons.find(
                        (p) => p._id?.toString() === lesson._id?.toString(),
                      );
                      const accessible = isLessonAccessible(lessonIndex);
                      return (
                        <LessonRow
                          key={lesson._id}
                          lesson={lesson}
                          index={index}
                          isActive={currentLesson?._id === lesson._id}
                          isCompleted={pl?.isCompleted ?? false}
                          isLocked={!accessible}
                          onClick={() => accessible && selectLesson(lesson)}
                        />
                      );
                    })}
                </div>
              );
            })}
            <QuizOpen courseId={courseId} courseProgress={progress?.progress} />
          </div>
        </aside>

        {/* Right — video + content */}
        <main className="flex-1 overflow-y-auto">
          {/* Video */}
          <div className="bg-black">
            <div className="max-w-4xl mx-auto">
              <VideoPlayer
                videoUrl={currentLesson?.videoUrl}
                onPlay={handleVideoPlay}
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-5 py-5">
            {/* Lesson title */}
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {currentLesson?.title}
            </h2>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Slide
              </button>

              {isCompleted ? (
                <span className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-200">
                  <CheckCircle className="w-4 h-4" /> Completed
                </span>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  disabled={marking || !canMarkComplete}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  title={
                    !canMarkComplete
                      ? `Watch ${remainingMin} more min to unlock`
                      : ""
                  }
                >
                  <CheckCircle className="w-4 h-4" />
                  {marking
                    ? "Saving..."
                    : !canMarkComplete
                      ? `${remainingMin} min left`
                      : "Mark Complete"}
                </button>
              )}

              <button
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                onClick={() => navigate(ROUTES.STUDENT_CHAT)}
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Tutor
              </button>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() =>
                  currentIndex > 0 && selectLesson(lessons[currentIndex - 1])
                }
                disabled={currentIndex <= 0}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() =>
                  currentIndex < lessons.length - 1 &&
                  selectLesson(lessons[currentIndex + 1])
                }
                disabled={
                  currentIndex >= lessons.length - 1 ||
                  !isLessonAccessible(currentIndex + 1)
                }
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            {currentLesson?.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {currentLesson.description}
              </p>
            )}

            {/* Tutor card */}
            {tutor && (
              <div className="bg-purple-700 rounded-xl p-4 flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {tutor.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div>
                  <p className="font-semibold text-white">{tutor.name}</p>
                  {tutor.tutorProfile?.subject && (
                    <p className="text-purple-200 text-xs mt-0.5">
                      {tutor.tutorProfile.subject}
                    </p>
                  )}
                  {tutor.tutorProfile?.bio && (
                    <p className="text-purple-100 text-sm mt-2 line-clamp-3">
                      {tutor.tutorProfile.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Student also bought */}
            {alsoBoought.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Student also bought
                  </h3>
                  <button
                    onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                    className="text-sm text-purple-600 font-medium hover:underline"
                  >
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {alsoBoought.map((course) => (
                    <div
                      key={course._id}
                      onClick={() => navigate(`/student/courses/${course._id}`)}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                    >
                      <div className="w-full h-28 bg-gray-100 overflow-hidden">
                        {course.thumbnailURL ? (
                          <img
                            src={course.thumbnailURL}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-purple-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-purple-500 font-medium mb-0.5">
                          {course.category}
                        </p>
                        <h4 className="font-semibold text-gray-800 text-xs line-clamp-2 mb-1">
                          {course.title}
                        </h4>
                        <p className="text-xs text-gray-500 mb-1">
                          {course.tutor?.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-600 font-bold text-sm">
                            {course.price === 0 ? "Free" : `₹${course.price}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  index = 0,
  isActive,
  isCompleted,
  isLocked,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-colors ${
        isLocked
          ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
          : isActive
            ? "bg-purple-600 text-white"
            : isCompleted
              ? "bg-orange-50 text-gray-700 hover:bg-orange-100"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
    >
      <div
        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
          isLocked
            ? "bg-gray-200"
            : isActive
              ? "bg-white/20"
              : isCompleted
                ? "bg-orange-200"
                : "bg-gray-200"
        }`}
      >
        {isLocked ? (
          <Lock className="w-3 h-3 text-gray-400" />
        ) : isCompleted ? (
          <CheckCircle
            className={`w-3 h-3 ${isActive ? "text-white" : "text-orange-600"}`}
          />
        ) : (
          <BookOpen
            className={`w-3 h-3 ${isActive ? "text-white" : "text-gray-500"}`}
          />
        )}
      </div>
      <span className="flex-1 text-xs font-medium truncate">
        {index + 1}. {lesson.title}
      </span>
      {lesson.duration > 0 && (
        <span
          className={`text-xs flex-shrink-0 ${isActive ? "text-purple-200" : "text-gray-400"}`}
        >
          {lesson.duration}m
        </span>
      )}
    </button>
  );
}
