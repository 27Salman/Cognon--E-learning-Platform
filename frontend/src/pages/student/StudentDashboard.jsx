import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublishedCourses, fetchEnrolledCourses } from '../../store/slices/studentSlice';
import {
  BookOpen, Clock, Award, Flame, ChevronRight, Play, CheckCircle2,
  TrendingUp, Compass, BookMarked, User, GraduationCap, ShieldAlert,
  ArrowRight, Calendar, Star, CheckCircle, BarChart3, Palette, Briefcase, Code,
  MonitorPlay, Target, Rocket
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { studentAPI } from '../../api/studentAPI';
import { getCategoryDetails } from '../../utils/helpers';

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('revealed');
          observer.unobserve(node);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

function StudentCategoryCard({ cat, navigate, catalog }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const details = getCategoryDetails(cat);
  const Icon = details.icon;

  return (
    <div
      onClick={() => navigate(`/student/categories?category=${encodeURIComponent(cat)}`)}
      onMouseMove={handleMouseMove}
      className="reveal-child relative bg-white rounded-2xl p-6 cursor-pointer border border-gray-200/80 shadow-sm hover:shadow-md hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col justify-between min-h-[180px]"
    >
      {/* Dynamic spotlight tracking overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(250px circle at ${coords.x}px ${coords.y}px, rgba(124, 58, 237, 0.06), transparent 80%)`
        }}
      />

      {/* Decorative accent gradient mesh on hover */}
      <div className={`absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-br ${details.color} opacity-0 group-hover:opacity-40 blur-xl transition-all duration-500 group-hover:scale-150 pointer-events-none`} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top: Icon and Title */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${details.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>

          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
            {cat}
          </h3>
        </div>

        {/* Bottom: Course count & Explore link */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <p className={`text-xs font-semibold ${details.textColor}`}>
            {catalog.filter(c => c.category === cat).length} Courses
          </p>
          <div className="flex items-center gap-1 text-purple-600 font-semibold group-hover:translate-x-1 transition-transform duration-300 text-xs">
            <span>Explore</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

const fallbackCourses = [
  {
    _id: 'fallback-1',
    title: 'Introduction to UI/UX Design & Figma Prototyping',
    tutor: { name: 'Dr. Sarah Johnson' },
    category: 'Design',
    price: 499,
    thumbnailURL: ''
  },
  {
    _id: 'fallback-2',
    title: 'Full Stack Web Development Boot Camp with React',
    tutor: { name: 'Prof. Michael Chen' },
    category: 'Development',
    price: 999,
    thumbnailURL: ''
  },
  {
    _id: 'fallback-3',
    title: 'Digital Marketing & Growth Hacking Mastery',
    tutor: { name: 'Lisa Martinez' },
    category: 'Marketing',
    price: 299,
    thumbnailURL: ''
  },
  {
    _id: 'fallback-4',
    title: 'Business Strategy & Venture Capital Foundations',
    tutor: { name: 'James Anderson' },
    category: 'Business',
    price: 0,
    thumbnailURL: ''
  }
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { catalog = [], enrolledCourses = [] } = useSelector(state => state.student);
  const { user } = useSelector(state => state.auth);

  const [profileStats, setProfileStats] = useState({
    enrolled: 0,
    completed: 0,
    certificates: 0
  });

  const catScrollRef = useRef(null);
  const coursesScrollRef = useRef(null);

  const scrollCarousel = useCallback((ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 310, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    dispatch(fetchPublishedCourses({}));
    dispatch(fetchEnrolledCourses());

    (async () => {
      try {
        const res = await studentAPI.getProfile();
        const profile = res.data?.data || res.data || res;
        const enrolled = profile.studentProfile?.enrolledCourses || [];
        const certificates = profile.studentProfile?.certificates || [];
        setProfileStats({
          enrolled: enrolled.length,
          completed: enrolled.filter(c => (c.progress || 0) >= 100).length,
          certificates: certificates.length
        });
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    })();
  }, [dispatch]);

  const enrolledIds = new Set(enrolledCourses.map(c => c._id));
  const bestRated = catalog.length > 0
    ? [...catalog]
        .filter(c => !enrolledIds.has(c._id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    : fallbackCourses;
  const bestRatedList = bestRated.slice(0, 10);

  const categoryCounts = {};
  catalog.forEach(course => {
    if (course.category) {
      categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1;
    }
  });
  const dbCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  const uniqueCategories = (dbCategories.length > 0 ? dbCategories : ['Development', 'Design', 'Business', 'Marketing']).slice(0, 10);

  const HERO_IMAGE_URL = `/assets/figma/home.jpg`;
  const ABOUT_IMAGE_1 = `/assets/figma/about 1.jpg`;
  const ABOUT_IMAGE_2 = `/assets/figma/about 2.avif`;
  const TUTOR_IMAGE = `/assets/figma/expert tutor.jpg`;
  const EXTRA_IMAGE = `/assets/figma/transform.jpg`;

  /* Scroll Reveal Refs */
  const catTitleRef = useScrollReveal();
  const catGridRef = useScrollReveal();
  const coursesTitleRef = useScrollReveal();
  const coursesGridRef = useScrollReveal();
  const aboutRef = useScrollReveal();
  const joinUsRef = useScrollReveal();
  const extraInfoRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-white pb-16">

      {/* Hero Section (Replaces generic dashboard header with matching Home Page layout structure) */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-white py-20 overflow-hidden">
        {/* Floating background blobs */}
        <div className="hero-blob-1 absolute top-10 right-1/4 w-72 h-72 bg-purple-200 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="hero-blob-2 absolute bottom-10 left-10 w-96 h-96 bg-indigo-200 opacity-15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            
            {/* Left Col: Hero Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 rounded-full text-purple-700 text-xs font-semibold mb-5 tracking-wide uppercase">
                <Rocket className="w-3.5 h-3.5 text-purple-600" />
                Start Learning Today
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                We bring the<br />
                <span className="text-purple-600">knowledge.</span><br />
                We build the<br />
                <span className="text-purple-600">experience.</span>
              </h2>
              <p className="text-gray-550 mb-7 leading-relaxed text-sm lg:text-base max-w-lg">
                Bring learning to life with personalized activities, videos, and assessments that motivate students at every step of their journey.
              </p>
            </div>

            {/* Right Col: Hero Image with glass badge */}
            <div className="hero-animate-visual">
              <div className="hero-image-container rounded-2xl overflow-hidden shadow-2xl relative">
                <img
                  src={HERO_IMAGE_URL}
                  alt="Students collaborating and learning together on Cognon platform"
                  className="w-full h-auto aspect-[4/3] object-cover"
                  loading="eager"
                />
                {/* Overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 shadow-lg">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Join 50,000+ students worldwide</p>
                    <p className="text-xs text-gray-500">Learn from 1,000+ expert instructors</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-12 bg-white">
        <div className="w-full px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Courses Enrolled */}
            <div className="bg-white border-l-4 border-l-blue-500 border border-gray-200/80 rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Courses Enrolled</p>
                <h4 className="text-3xl font-extrabold text-gray-900">{profileStats.enrolled}</h4>
                <p className="text-[11px] text-blue-600 font-medium mt-2">Active learning path</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white border-l-4 border-l-emerald-500 border border-gray-200/80 rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completed</p>
                <h4 className="text-3xl font-extrabold text-gray-900">{profileStats.completed}</h4>
                <p className="text-[11px] text-emerald-600 font-medium mt-2">Programs finalized</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Certificates */}
            <div className="bg-white border-l-4 border-l-amber-500 border border-gray-200/80 rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Certificates</p>
                <h4 className="text-3xl font-extrabold text-gray-900">{profileStats.certificates}</h4>
                <p className="text-[11px] text-amber-600 font-medium mt-2">Earned credentials</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 transition-transform duration-300 group-hover:scale-110">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Spacing */}
      <div className="w-full px-6">
        
        {/* Continue Learning Section */}
        <section className="py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Continue Learning</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_MY_COURSES)}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm transition"
            >
              View all courses
            </button>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Enrolled Courses</h3>
              <p className="text-gray-600 mb-8 text-sm">Start your learning journey by enrolling in a course</p>
              <button
                onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm inline-flex items-center gap-2 shadow-sm shadow-purple-100"
              >
                Browse Courses <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {enrolledCourses.slice(0, 4).map(course => (
                <div
                  key={course._id}
                  onClick={() => navigate(`/student/courses/${course._id}/lessons`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-150 cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-full h-36 bg-gray-100 overflow-hidden relative">
                    {course.thumbnailURL ? (
                      <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm mb-1 line-clamp-2 text-gray-800 hover:text-purple-650 transition">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">By {course.tutor?.name}</p>
                    </div>
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-350 ${(course.progress || 0) >= 100 ? 'bg-emerald-500' : 'bg-purple-600'}`}
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-450">{course.progress || 0}% complete</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Categories Section (Restores hover, spotlight, and decorative mesh effects from Home page) */}
        <section className="py-12 bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
          <div ref={catTitleRef} className="scroll-reveal flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Categories</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_CATEGORIES)}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div ref={catGridRef} className="reveal-children relative">
            <div ref={catScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
              {uniqueCategories.map((cat) => (
                <div key={cat} className="flex-shrink-0 w-72" style={{ scrollSnapAlign: 'start' }}>
                  <StudentCategoryCard cat={cat} navigate={navigate} catalog={catalog} />
                </div>
              ))}
            </div>
            {/* Carousel arrows */}
            <button
              onClick={() => scrollCarousel(catScrollRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-150 text-gray-650"
              aria-label="Scroll categories left"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => scrollCarousel(catScrollRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-150 text-gray-650"
              aria-label="Scroll categories right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Best Rated Courses (Includes scroll animations and interactive card hover transitions) */}
        <section className="py-16">
          <div ref={coursesTitleRef} className="scroll-reveal flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Best Rated Courses</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div ref={coursesGridRef} className="reveal-children relative">
            <div ref={coursesScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
              {bestRatedList.map(course => (
                <div
                  key={course._id}
                  onClick={() => navigate(`/student/courses/${course._id}`)}
                  className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-300 border border-gray-150 cursor-pointer flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="w-full h-36 bg-gray-100 overflow-hidden relative">
                    {course.offer && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow z-10">
                        {course.offer.discountPercentage}% OFF
                      </span>
                    )}
                    {course.thumbnailURL ? (
                      <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(course.rating || 0)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-755">
                          {(course.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 text-gray-800 group-hover:text-purple-600 transition">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">By {course.tutor?.name}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        {course.offer ? (
                          <>
                            <span className="text-lg font-bold text-purple-600">
                              {course.offer.discountedPrice === 0 ? 'Free' : `₹${course.offer.discountedPrice}`}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{course.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-purple-600">
                            {course.price === 0 ? 'Free' : `₹${course.price}`}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/student/courses/${course._id}`); }}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-xs font-semibold"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Carousel arrows */}
            <button
              onClick={() => scrollCarousel(coursesScrollRef, -1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-150 text-gray-655"
              aria-label="Scroll courses left"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => scrollCarousel(coursesScrollRef, 1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-150 text-gray-655"
              aria-label="Scroll courses right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Join Us Section (Redesigned into a Premium Card) */}
      <section ref={joinUsRef} className="scroll-reveal py-20 bg-white">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl">
              <span className="text-purple-300 font-bold text-xs uppercase tracking-widest mb-3 block">Become an Instructor</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                Join our Global Community of Expert Tutors
              </h2>
              <p className="text-purple-100 mb-6 text-sm leading-relaxed">
                Instructors from around the world teach millions of students on Byway. We provide the tools and skills to share what you love, build an audience, and earn a sustainable income.
              </p>
              <button
                onClick={() => navigate(ROUTES.TUTOR_SIGNUP)}
                className="px-6 py-3 bg-white text-purple-950 rounded-xl hover:bg-gray-50 transition font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 animate-pulse-slow"
              >
                Start Your Instructor Journey
              </button>
            </div>

            <div className="relative z-10 w-full max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-2 bg-white/5">
              <img
                src={TUTOR_IMAGE}
                alt="Tutor teaching"
                className="w-full h-full object-cover rounded-xl transition duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Extra Info Section */}
      <section ref={extraInfoRef} className="scroll-reveal py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200/80 max-w-sm mx-auto aspect-square bg-white p-3">
              <img
                src={EXTRA_IMAGE}
                alt="Transform your life through education"
                className="w-full h-full object-cover rounded-2xl transition duration-500 hover:scale-105"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-gray-900 leading-snug">
                Transform Your Life Through Structured Education
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                Learners around the world are launching new careers, advancing in their fields, and enriching their lives by gaining certified, industry-recognized knowledge on Cognon.
              </p>
              <button
                onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-bold text-sm shadow-sm"
              >
                Checkout Courses
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section (Clean Typography & Outlined Images) */}
      <section id="about" ref={aboutRef} className="scroll-reveal py-20 bg-gray-50 mt-16 border-y border-gray-100">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-bold mb-2 text-xs uppercase tracking-widest">About Us</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-snug">
              Delivering High-Quality <span className="text-purple-600">e-Learning</span> Opportunities
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                At Cognon, we believe that education should be accessible to everyone, everywhere. Our platform connects passionate tutors with eager learners, creating a vibrant community of knowledge sharing and growth.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                With thousands of courses across various disciplines, we empower individuals to pursue their passions, advance their careers, and achieve their goals through flexible, high-quality online learning experiences.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200/80 max-w-sm mx-auto aspect-square bg-white p-3">
              <img
                src={ABOUT_IMAGE_1}
                alt="Student studying at computer"
                className="w-full h-full object-cover rounded-2xl transition duration-500 hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200/80 max-w-sm mx-auto aspect-square bg-white p-3 md:order-first order-last">
              <img
                src={ABOUT_IMAGE_2}
                alt="Interactive e-learning illustration"
                className="w-full h-full object-cover rounded-2xl transition duration-500 hover:scale-105"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Practical Skill Building</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Install practical, industry-ready web development skills into your career and gain access to modern tools, frameworks, and real-world projects. Learn how to build responsive websites and scalable applications using popular frameworks. We guide you through architecture, best practices, and deployment so you can focus on building clean, efficient, and production-ready web applications.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                Launch high-impact digital marketing strategies and get hands-on experience with SEO, social media, paid ads, and content marketing. Learn how to reach the right audience, drive meaningful traffic, and convert users into loyal customers. Start building campaigns based on real data and measurable outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default StudentDashboard;