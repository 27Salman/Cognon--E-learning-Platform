import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchEnrolledCourses } from "../../store/slices/studentSlice";
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { ROUTES, COURSE_STATUS } from "../../utils/constants";
import { studentAPI } from "../../api/studentAPI";
import StarRating from "../../components/common/StarRating";
import ReviewModal from "../../components/student/ReviewModal";

function CourseCard({ course, onClick, onRateClick, refreshTrigger }) {
  const progress = course.progress || 0;
  const isCompleted = progress >= 100;
  const isUnavailable =
    course.status && course.status !== COURSE_STATUS.PUBLISHED;

  const [myReview, setMyReview] = useState(null);

  useEffect(() => {
    if (course._id) {
      studentAPI
        .getMyReview(course._id)
        .then((res) => {
          if (res?.data) {
            setMyReview(res.data);
          } else {
            setMyReview(null);
          }
        })
        .catch(() => {});
    }
  }, [course._id, refreshTrigger]);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition hover:shadow-md cursor-pointer h-full flex flex-col justify-between"
    >
      <div>
        <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
          {course.thumbnailURL ? (
            <img
              src={course.thumbnailURL}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-purple-300" />
            </div>
          )}
          {isUnavailable && (
            <div className="absolute top-2 left-2">
              <span className="bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Temporarily Unavailable
              </span>
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col pb-0">
          <h3 className="font-semibold text-gray-800 text-base leading-snug mb-2 line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-purple-600 font-medium mb-4">
            By {course.tutor?.name || "Tutor"}
          </p>
          {isUnavailable && (
            <p className="text-sm text-yellow-600 mb-3">
              This course is unlisted. Your access is unaffected.
            </p>
          )}
        </div>
      </div>

      <div className="p-5 pt-0">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-purple-600"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">{progress}% complete</span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" /> Done
            </span>
          )}
        </div>

        {/* Rating Display / Option */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
          {myReview ? (
            <div className="flex items-center gap-1">
              <StarRating rating={myReview.rating} size={14} />
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not rated yet</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRateClick(course._id);
            }}
            className="text-xs font-semibold text-purple-600 hover:text-purple-750 transition hover:underline bg-purple-50 hover:bg-purple-100/70 px-2.5 py-1.5 rounded-lg"
          >
            {myReview ? "Edit Review" : "Rate Course"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyCourses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enrolledCourses, loading } = useSelector((state) => state.student);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'in-progress', 'completed'
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const coursesPerPage = 8; // Shows up to 8 courses per tab page

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, categoryFilter, sortBy, activeTab]);

  const categoriesList = [
    "All",
    ...new Set(enrolledCourses.map((c) => c.category).filter(Boolean)),
  ];

  // Filter by Tab
  const tabFilteredCourses = enrolledCourses.filter((course) => {
    if (activeTab === "in-progress") return (course.progress || 0) < 100;
    if (activeTab === "completed") return (course.progress || 0) >= 100;
    return true; // 'all'
  });

  // Apply Search and Category Filters
  const filteredCourses = tabFilteredCourses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Apply Sorting
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "alphabetical") {
      return (a.title || "").localeCompare(b.title || "");
    } else if (sortBy === "progress-desc") {
      return (b.progress || 0) - (a.progress || 0);
    } else if (sortBy === "progress-asc") {
      return (a.progress || 0) - (b.progress || 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
  const startIndex = currentPage * coursesPerPage;
  const displayedCourses = sortedCourses.slice(
    startIndex,
    startIndex + coursesPerPage,
  );

  const handleRateClick = (courseId) => {
    setSelectedCourseForReview(courseId);
  };

  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
    dispatch(fetchEnrolledCourses());
  };

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
        <p className="text-gray-500 mb-4 text-lg">
          You haven't enrolled in any courses yet
        </p>
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
    <div className="p-8 max-w-7xl mx-auto">
      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Learning</h1>
        <p className="text-gray-550 text-sm">
          Track your progress and continue learning where you left off.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-8 overflow-x-auto scrollbar-hide">
        {[
          { id: "all", label: "All Courses" },
          { id: "in-progress", label: "In Progress" },
          { id: "completed", label: "Completed" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 text-sm font-semibold relative transition-colors whitespace-nowrap focus:outline-none ${
                isActive
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-purple-500"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search courses or tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-550/15 focus:border-purple-500 transition shadow-inner bg-white text-gray-800 placeholder-gray-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Select */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pr-9 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-550/15 focus:border-purple-500 transition bg-white text-gray-700 font-medium cursor-pointer shadow-sm min-w-[150px]"
            >
              <option value="All">All Categories</option>
              {categoriesList
                .filter((cat) => cat !== "All")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </span>
          </div>

          {/* Sort Select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pr-9 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-550/15 focus:border-purple-500 transition bg-white text-gray-700 font-medium cursor-pointer shadow-sm min-w-[155px]"
            >
              <option value="default">Sort by: Default</option>
              <option value="alphabetical">Sort by: A-Z</option>
              <option value="progress-desc">Sort by: Highest Progress</option>
              <option value="progress-asc">Sort by: Lowest Progress</option>
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Courses Display or Empty State */}
      {sortedCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm animate-fadeIn">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">
            No courses found matching your query or active tab
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("All");
              setSortBy("default");
            }}
            className="text-xs text-purple-600 font-semibold hover:underline bg-purple-50 px-3.5 py-2 rounded-lg transition hover:bg-purple-100"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onClick={() =>
                  navigate(`/student/courses/${course._id}/lessons`)
                }
                onRateClick={handleRateClick}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </div>

          {/* Centered Pagination controls at the bottom */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-gray-100 pt-6 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className={`p-2 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition ${
                  currentPage === 0
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 bg-white shadow-sm"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-lg shadow-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage === totalPages - 1}
                className={`p-2 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition ${
                  currentPage === totalPages - 1
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 bg-white shadow-sm"
                }`}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for reviews */}
      <ReviewModal
        isOpen={!!selectedCourseForReview}
        courseId={selectedCourseForReview}
        onClose={() => setSelectedCourseForReview(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
