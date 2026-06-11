import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api/adminAPI';
import { Search, Filter, ArrowLeft, BookOpen, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
};

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: '-createdAt', label: 'Newest First' },
  { value: '-studentsEnrolled', label: 'Most Popular' },
];

const LISTING_FILTERS = [
  { value: 'all', label: 'All Courses' },
  { value: 'published', label: 'Listed' },
  { value: 'archived', label: 'Unlisted' },
];

// Course Card 
function CourseCard({ course, onView }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative">
        {course.thumbnailURL ? (
          <img src={course.thumbnailURL} alt={course.title} className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-purple-400" />
          </div>
        )}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[course.status] || 'bg-gray-100 text-gray-600'}`}>
          {course.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>{course.category}</span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {course.rating?.toFixed(1) || '0.0'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">{course.title}</h3>
        <p className="text-xs text-gray-500 mb-2">{course.tutor?.name}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{course.studentsEnrolled?.length || 0}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 line-through mr-1">₹{Math.round(course.price * 1.2)}</span>
            <span className="text-sm font-bold text-purple-700">₹{course.price}</span>
          </div>
        </div>

        <button
          onClick={() => onView(course)}
          className="mt-3 w-full bg-purple-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          VIEW COURSE
        </button>
      </div>
    </div>
  );
}

// Pagination 
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
            p === current ? 'bg-purple-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {String(p).padStart(2, '0')}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

//  Main Component 
export default function AdminCourseManagement() {
  const [view, setView] = useState('categories'); 

  const [categoryCourses, setCategoryCourses] = useState({}); 
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [listingFilter, setListingFilter] = useState('all');
  const [searchCourses, setSearchCourses] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchPagination, setSearchPagination] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonPage, setLessonPage] = useState(1);
  const LESSONS_PER_PAGE = 6;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminAPI.getCategories({ limit: 100, isActive: 'true' });
        const cats = res.data.categories || [];
        setCategories(cats);
      } catch {
      }
    };
    loadCategories();
  }, []);

  // Load courses per category 
  const loadCategoryPage = useCallback(async (categoryName, page = 1) => {
    setCatLoading(true);
    try {
      const res = await adminAPI.getAdminCourses({ category: categoryName, page, limit: 3 });
      setCategoryCourses(prev => ({
        ...prev,
        [categoryName]: {
          courses: res.data.courses || [],
          page,
          totalPages: res.data.pagination?.totalPages || 1,
        }
      }));
    } catch {
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'categories' && categories.length > 0) {
      categories.forEach(cat => {
        if (!categoryCourses[cat.name]) {
          loadCategoryPage(cat.name, 1);
        }
      });
    }
  }, [view, categories]);

  //  Search view fetch 
  const fetchSearchCourses = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = { search, page: searchPage, limit: 9 };
      if (sort) params.sort = sort;
      if (listingFilter !== 'all') params.status = listingFilter;
      const res = await adminAPI.getAdminCourses(params);
      setSearchCourses(res.data.courses || []);
      setSearchPagination(res.data.pagination || {});
    } catch {
      toast.error('Failed to load courses', { id: 'admin-courses-error' });
    } finally {
      setSearchLoading(false);
    }
  }, [search, sort, listingFilter, searchPage]);

  useEffect(() => {
    if (view === 'search') fetchSearchCourses();
  }, [view, search, sort, listingFilter, searchPage]);

  const openDetail = async (course) => {
    setDetailLoading(true);
    setView('detail');
    setLessonPage(1);
    try {
      const res = await adminAPI.getAdminCourseById(course._id);
      setSelectedCourse(res.data);
    } catch {
      toast.error('Failed to load course details', { id: 'course-detail-error' });
      setView('categories');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleListing = async (courseId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'archived' : 'published';
    try {
      await adminAPI.updateCourseStatus(courseId, newStatus);
      toast.success(`Course ${newStatus === 'published' ? 'listed' : 'unlisted'} successfully`);
      if (selectedCourse?._id === courseId) {
        setSelectedCourse(prev => ({ ...prev, status: newStatus }));
      }
      categories.forEach(cat => loadCategoryPage(cat.name, categoryCourses[cat.name]?.page || 1));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const lessons = selectedCourse?.lessons || [];
  const totalLessonPages = Math.ceil(lessons.length / LESSONS_PER_PAGE);
  const visibleLessons = lessons.slice((lessonPage - 1) * LESSONS_PER_PAGE, lessonPage * LESSONS_PER_PAGE);

  // VIEW: DETAIL
  if (view === 'detail') {
    if (detailLoading) {
      return (
        <div className="p-6 flex items-center justify-center min-h-64">
          <div className="text-gray-400">Loading course details...</div>
        </div>
      );
    }
    if (!selectedCourse) return null;

    const isListed = selectedCourse.status === 'published';

    return (
      <div className="p-6">
        {/* Back */}
        <button
          onClick={() => setView('categories')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Course info + lessons */}
          <div className="flex-1">
            {/* Hero thumbnail */}
            {selectedCourse.thumbnailURL ? (
              <img src={selectedCourse.thumbnailURL} alt={selectedCourse.title} className="w-full h-56 object-cover rounded-2xl mb-5" />
            ) : (
              <div className="w-full h-56 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-5 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-purple-400" />
              </div>
            )}

            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-5">
              <div className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full">
                TOTAL STUDENTS: {selectedCourse.studentsEnrolled?.length || 0}
              </div>
            </div>

            {/* Course Structure — chapter-wise */}
              <h2 className="text-lg font-bold text-gray-800 mb-3">Course Structure</h2>
              <div className="space-y-3 mb-6">
                {lessons.length === 0 ? (
                  <p className="text-gray-400 text-sm">No lessons added yet.</p>
                ) : (() => {
                  const chapMap = {};
                  lessons.forEach(l => {
                    const key = l.chapter?.order ?? 1;
                    if (!chapMap[key]) chapMap[key] = { order: key, title: l.chapter?.title ?? 'Chapter 1', lessons: [] };
                    chapMap[key].lessons.push(l);
                  });
                  return Object.values(chapMap)
                    .sort((a, b) => a.order - b.order)
                    .map(ch => ({ ...ch, lessons: ch.lessons.slice().sort((a, b) => a.order - b.order) }))
                    .map(chapter => (
                      <div key={chapter.order} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Chapter header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-purple-50">
                          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{chapter.order}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              Chapter {chapter.order}: {chapter.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {/* Lessons */}
                        <div className="divide-y divide-gray-100">
                          {chapter.lessons.map((lesson, idx) => (
                            <div key={lesson._id || idx} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-3 h-3 text-purple-600" />
                                </div>
                                <span className="font-medium text-gray-700">{idx + 1}. {lesson.title}</span>
                              </div>
                              <span className="text-gray-400 text-xs flex-shrink-0">
                                {lesson.duration ? `${lesson.duration} mins` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                })()}
              </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleToggleListing(selectedCourse._id, selectedCourse.status)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isListed
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isListed ? 'Unlist Course' : 'List Course'}
              </button>
            </div>

            {/* Lessons grid */}
            {lessons.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Lessons ({lessons.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visibleLessons.map((lesson, i) => (
                    <div
                      key={lesson._id || i}
                      onClick={() => setSelectedLesson(lesson)}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group"
                    >
                      {lesson.thumbnailURL ? (
                        <img src={lesson.thumbnailURL} alt={lesson.title} className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity" />
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-purple-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-semibold text-gray-700 line-clamp-2 mb-1">{lesson.title}</p>
                        <div className="flex items-center justify-between">
                          {lesson.duration && (
                            <span className="text-xs text-gray-400">{lesson.duration} mins</span>
                          )}
                          <span className="text-xs text-purple-600 font-medium group-hover:underline">View →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination current={lessonPage} total={totalLessonPages} onChange={setLessonPage} />
              </div>
            )}

            {/* Lesson Detail Modal */}
            {selectedLesson && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800 pr-4">{selectedLesson.title}</h2>
                      <button
                        onClick={() => setSelectedLesson(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>

                    {/* Thumbnail */}
                    {selectedLesson.thumbnailURL ? (
                      <img src={selectedLesson.thumbnailURL} alt={selectedLesson.title} className="w-full h-48 object-cover rounded-xl mb-4" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-purple-300" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3 text-sm">
                      {selectedLesson.duration && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium text-gray-700">Duration:</span>
                          <span>{selectedLesson.duration} minutes</span>
                        </div>
                      )}

                      {selectedLesson.description && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Description</p>
                          <p className="text-gray-600 leading-relaxed">{selectedLesson.description}</p>
                        </div>
                      )}

                      {selectedLesson.videoUrl && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">Video</p>
                          {selectedLesson.videoUrl.includes('youtube.com') || selectedLesson.videoUrl.includes('youtu.be') ? (
                            <div className="aspect-video rounded-xl overflow-hidden bg-black">
                              <iframe
                                src={selectedLesson.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                className="w-full h-full"
                                allowFullScreen
                                title={selectedLesson.title}
                              />
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl overflow-hidden bg-black">
                              <video
                                src={selectedLesson.videoUrl}
                                controls
                                className="w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {!selectedLesson.videoUrl && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">
                          No video available for this lesson
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedLesson(null)}
                      className="mt-5 w-full bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Course info card */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 sticky top-24">
              {selectedCourse.thumbnailURL ? (
                <img src={selectedCourse.thumbnailURL} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
              ) : (
                <div className="w-full h-32 bg-purple-200 rounded-xl mb-3 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-purple-400" />
                </div>
              )}
              <h3 className="font-bold text-gray-800 text-sm mb-2">{selectedCourse.title}</h3>

              {/* Tutor */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-purple-300 flex items-center justify-center text-white text-xs font-bold">
                  {selectedCourse.tutor?.name?.charAt(0) || 'T'}
                </div>
                <span className="text-xs text-gray-600">{selectedCourse.tutor?.name}</span>
              </div>

              {/* Price with real offer percentage */}
              <div className="flex items-center gap-2 mb-4">
                {selectedCourse.offerPercentage > 0 ? (
                  <>
                    <span className="text-lg font-bold text-gray-800">
                      ₹{Math.round(selectedCourse.price * (1 - selectedCourse.offerPercentage / 100))}
                    </span>
                    <span className="text-sm text-gray-400 line-through">₹{selectedCourse.price}</span>
                    <span className="text-xs text-green-600 font-medium">{selectedCourse.offerPercentage}% off</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-gray-800">₹{selectedCourse.price}</span>
                )}
              </div>

              {/* Course stats */}
              <div className="space-y-1.5 mb-4 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{selectedCourse.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lessons</span>
                  <span className="font-medium">{lessons.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Students</span>
                  <span className="font-medium">{selectedCourse.studentsEnrolled?.length || 0}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className={`text-center py-1.5 rounded-lg text-xs font-semibold ${
                isListed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isListed ? 'Listed' : 'Unlisted'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: SEARCH
  if (view === 'search') {
    return (
      <div className="p-6">
        {/* Back */}
        <button
          onClick={() => setView('categories')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Search + Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Courses"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Listing filter tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {LISTING_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setListingFilter(f.value); setSearchPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  listingFilter === f.value ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setSearchPage(1); }}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {searchLoading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : searchCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No courses found</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchCourses.map(course => (
                <CourseCard key={course._id} course={course} onView={openDetail} />
              ))}
            </div>
            <Pagination
              current={searchPage}
              total={searchPagination.totalPages || 1}
              onChange={setSearchPage}
            />
          </>
        )}
      </div>
    );
  }


  // VIEW: CATEGORIES (default)
  return (
    <div className="p-6">
      {/* Top search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Courses"
            onFocus={() => setView('search')}
            readOnly
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={() => setView('search')}
          className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Category sections */}
      {categories.length === 0 && catLoading && (
        <div className="text-center py-16 text-gray-400">Loading courses...</div>
      )}

      {categories.map(cat => {
        const catData = categoryCourses[cat.name];
        const courses = catData?.courses || [];
        const currentPage = catData?.page || 1;
        const totalPages = catData?.totalPages || 1;

        return (
          <div key={cat._id} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{cat.name}</h2>

            {courses.length === 0 ? (
              <p className="text-gray-400 text-sm mb-4">No courses in this category yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map(course => (
                  <CourseCard key={course._id} course={course} onView={openDetail} />
                ))}
              </div>
            )}

            <Pagination
              current={currentPage}
              total={totalPages}
              onChange={(p) => loadCategoryPage(cat.name, p)}
            />
          </div>
        );
      })}
    </div>
  );
}
