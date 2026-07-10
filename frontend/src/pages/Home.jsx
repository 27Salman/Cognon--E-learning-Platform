import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ROUTES, ROLES } from '../utils/constants';
import {
  BookOpen, Star, Users, Clock, Award, GraduationCap, TrendingUp,
  CheckCircle, Play, ArrowRight, Quote, Target, ChevronRight,
  Menu, X, Mail, MapPin, Phone, Code, Palette, Briefcase, BarChart3,
  Globe, Shield, Zap, Layers, HeadphonesIcon, FileText,
  MonitorPlay, LifeBuoy, MessageCircle, Upload, ImageIcon
} from 'lucide-react';
import Logo from '../components/common/Logo';
import StarRating from '../components/common/StarRating';

const API_BASE = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost'))
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : window.location.origin;

function useScrollReveal(threshold = 0.12) {
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

function AvatarSVG({ name, size = 64 }) {
  const colors = [
    ['#7c3aed', '#a78bfa'], ['#6d28d9', '#8b5cf6'],
    ['#5b21b6', '#c4b5fd'], ['#4c1d95', '#ddd6fe'],
  ];
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const [bg, fg] = colors[idx];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const gradientId = `av-${idx}-${name.replace(/\s/g, '')}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ borderRadius: '50%', flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={fg} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <text x="32" y="32" textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="22" fontWeight="600" fontFamily="Inter, sans-serif">{initials}</text>
    </svg>
  );
}

function CategoryCard({ category, navigate }) {
  const getCategoryIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('web') || t.includes('dev') || t.includes('code') || t.includes('software')) return Code;
    if (t.includes('design') || t.includes('art') || t.includes('creative') || t.includes('ui')) return Palette;
    if (t.includes('business') || t.includes('finance') || t.includes('management')) return Briefcase;
    if (t.includes('marketing') || t.includes('sell') || t.includes('growth')) return BarChart3;
    if (t.includes('science') || t.includes('math') || t.includes('data')) return Globe;
    return BookOpen;
  };

  const IconComponent = getCategoryIcon(category.title);

  return (
    <div
      onClick={() => navigate(ROUTES.LOGIN)}
      className="flex-shrink-0 w-72 bg-white rounded-2xl p-6 cursor-pointer border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-300 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between min-h-[160px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm">
          <IconComponent className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-base text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
          {category.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
          <span>{category.coursesCount} {category.coursesCount === 1 ? 'course' : 'courses'}</span>
          <span>•</span>
          <span>{category.enrollmentsCount} {category.enrollmentsCount === 1 ? 'enrollment' : 'enrollments'}</span>
        </div>
      </div>
    </div>
  );
}

const fallbackTutors = [
  {
    name: 'Sarah Drasner',
    tutorProfile: { subject: 'Vue.js & Frontend Architecture' },
    averageRating: 4.9,
    totalStudents: 15420,
    totalCourses: 12,
    profileImageURL: null
  },
  {
    name: 'Addy Osmani',
    tutorProfile: { subject: 'Web Performance & Chrome DevTools' },
    averageRating: 4.8,
    totalStudents: 32100,
    totalCourses: 8,
    profileImageURL: null
  },
  {
    name: 'Dan Abramov',
    tutorProfile: { subject: 'React & Redux Ecosystem' },
    averageRating: 4.9,
    totalStudents: 45200,
    totalCourses: 15,
    profileImageURL: null
  },
  {
    name: 'Evan You',
    tutorProfile: { subject: 'Vue.js Core & Vite Build Tools' },
    averageRating: 5.0,
    totalStudents: 50100,
    totalCourses: 5,
    profileImageURL: null
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [dbTutors, setDbTutors] = useState(fallbackTutors);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('#home');

  useEffect(() => {
    // Fetch courses & compute categories
    fetch(`${API_BASE}/api/catalog/courses?limit=300`)
      .then(r => r.json())
      .then(res => {
        const allCourses = res?.data?.courses || [];
        const sortedRatingCourses = [...allCourses].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setCourses(sortedRatingCourses.slice(0, 8));
        
        // Group and count courses 
        const catStats = {};
        allCourses.forEach(c => {
          if (c.category) {
            if (!catStats[c.category]) {
              catStats[c.category] = {
                title: c.category,
                coursesCount: 0,
                enrollmentsCount: 0
              };
            }
            catStats[c.category].coursesCount++;
            catStats[c.category].enrollmentsCount += (c.enrolledCount || 0);
          }
        });
        const sortedCats = Object.values(catStats).sort((a, b) => b.enrollmentsCount - a.enrollmentsCount);
        setCategories(sortedCats);
      })
      .catch(() => {
        setCourses([]);
        setCategories([]);
      })
      .finally(() => {
        setCoursesLoading(false);
        setCategoriesLoading(false);
      });

    // Fetch approved public tutors
    fetch(`${API_BASE}/api/catalog/tutors?limit=100`)
      .then(r => r.json())
      .then(res => {
        const fetchedTutors = res?.data?.tutors || [];
        if (fetchedTutors.length > 0) {
          const sortedTutors = [...fetchedTutors].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          setDbTutors(sortedTutors.slice(0, 12));
        }
      })
      .catch(() => {})
      .finally(() => setTutorsLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'courses', 'tutors', 'about', 'contact'];
      const scrollPos = window.scrollY + 160;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveLink(`#${section}`);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const HERO_IMAGE_URL = `/assets/figma/home.jpg`;

  if (isAuthenticated && user) {
    const dashboard =
      user.role === ROLES.TUTOR ? ROUTES.TUTOR_DASHBOARD
        : user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD
          : ROUTES.STUDENT_DASHBOARD;
    return <Navigate to={dashboard} replace />;
  }

  //Scroll reveal refs
  const ctaBannerRef = useScrollReveal();
  const featTitleRef = useScrollReveal();
  const featGridRef = useScrollReveal();
  const aboutTitleRef = useScrollReveal();
  const aboutTextRef = useScrollReveal();
  const aboutMetricsRef = useScrollReveal();
  const statsTitleRef = useScrollReveal();
  const statsGridRef = useScrollReveal();
  const catTitleRef = useScrollReveal();
  const catGridRef = useScrollReveal();
  const tutorTitleRef = useScrollReveal();
  const tutorCarouselRef = useScrollReveal();
  const coursesTitleRef = useScrollReveal();
  const coursesBodyRef = useScrollReveal();
  const howTitleRef = useScrollReveal();
  const howGridRef = useScrollReveal();
  const finalCtaRef = useScrollReveal();
  const footerRef = useScrollReveal();

  //Carousel scroll helpers
  const tutorScrollRef = useRef(null);
  const courseScrollRef = useRef(null);
  const catScrollRef = useRef(null);

  const scrollCarousel = useCallback((ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction * 310, behavior: 'smooth' });
    }
  }, []);

  //Static Data 
  const features = [
    { icon: BookOpen, title: 'Extensive Course Library', description: 'Access over 10,000 courses across technology, business, creative arts, personal development, and more — all curated for quality.' },
    { icon: Clock, title: 'Learn at Your Pace', description: 'No rigid schedules. Start, pause, and resume anytime with lifetime access to all enrolled courses and materials.' },
    { icon: Award, title: 'Earn Certificates', description: 'Receive industry-recognized completion certificates that strengthen your resume and validate your expertise to employers.' },
    { icon: GraduationCap, title: 'Expert-Led Instruction', description: 'Every course is created and taught by vetted professionals with proven experience in their respective industries.' }
  ];

  const howItWorks = [
    { step: '01', icon: FileText, title: 'Create Your Account', description: 'Sign up for free in under a minute. Set up your learner profile and define your learning goals.' },
    { step: '02', icon: Layers, title: 'Browse & Enroll', description: 'Explore our catalog of expert-curated courses. Filter by category, skill level, or instructor to find the perfect fit.' },
    { step: '03', icon: MonitorPlay, title: 'Learn & Practice', description: 'Watch HD video lessons, complete interactive assignments, and build real-world projects at your own pace.' },
    { step: '04', icon: Award, title: 'Get Certified', description: 'Pass assessments and earn a professional certificate that you can share on LinkedIn and with employers.' }
  ];

  const stats = [
    { icon: Users, number: '50,000+', label: 'Active Students' },
    { icon: GraduationCap, number: '1,000+', label: 'Expert Tutors' },
    { icon: BookOpen, number: '10,000+', label: 'Online Courses' },
    { icon: Star, number: '4.8/5', label: 'Average Rating' }
  ];

  const aboutMetrics = [
    { number: '50K+', label: 'Active Learners', icon: Users },
    { number: '10K+', label: 'Expert Courses', icon: BookOpen },
    { number: '98%', label: 'Satisfaction Rate', icon: Star },
    { number: '50+', label: 'Countries Reached', icon: Globe }
  ];


  return (
    <div className="min-h-screen bg-white">

      <header className="glass-header shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <Logo size={36} />
              <span className="text-xl font-bold text-purple-600">Cognon</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Courses', href: '#courses' },
                { label: 'Tutors', href: '#tutors' },
                { label: 'About', href: '#about' },
                { label: 'Contact', href: '#contact' }
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`relative transition-colors py-1 group ${activeLink === link.href ? 'text-purple-600 font-bold' : 'text-gray-600 hover:text-purple-600'}`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-0 h-0.5 bg-purple-600 transition-all duration-300 ${activeLink === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </a>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to={ROUTES.LOGIN}>
                <button className="px-5 py-2 text-sm text-purple-600 hover:text-purple-700 transition font-medium rounded-lg hover:bg-purple-50">
                  Login
                </button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <button className="px-5 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm hover:shadow-md">
                  Sign Up
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-purple-600 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-4 border-t border-gray-100 pt-4 space-y-2">
              {['Home', 'Courses', 'Tutors', 'About', 'Contact'].map(label => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  className="block text-gray-600 hover:text-purple-600 transition text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="flex gap-3 pt-3">
                <Link to={ROUTES.LOGIN} className="flex-1">
                  <button className="w-full px-4 py-2.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition font-medium">
                    Login
                  </button>
                </Link>
                <Link to={ROUTES.SIGNUP} className="flex-1">
                  <button className="w-full px-4 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <section id="home" className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-white pt-12 pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
        {/* Floating blobs */}
        <div className="hero-blob-1 absolute top-10 right-1/4 w-72 h-72 bg-purple-200 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="hero-blob-2 absolute bottom-10 left-10 w-96 h-96 bg-indigo-200 opacity-15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">

            {/* Left — text (CSS keyframe animation, no observer needed) */}
            <div className="hero-animate-text">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 rounded-full text-purple-700 text-xs font-semibold mb-5 tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5" />
                Start Learning Today
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                We bring the<br />
                <span className=" text-purple-600">knowledge.</span><br />
                We build the<br />
                <span className=" text-purple-600">experience.</span>
              </h2>
              <p className="text-gray-500 mb-7 leading-relaxed text-sm lg:text-base max-w-lg">
                Master new skills with expert-led courses designed for real-world application. From web development to data science, advance your career with structured, hands-on learning paths trusted by 50,000+ professionals worldwide.
              </p>
              <div className="flex flex-wrap gap-4 mb-7">
                <Link to={ROUTES.SIGNUP}>
                  <button className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <Play className="w-4 h-4" />
                    Get Started Free
                  </button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <button className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5">
                    Explore Courses
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Trusted by 50,000+ learners</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>4.8 average rating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Certified courses</span>
                </div>
              </div>
            </div>

            {/* Right — Hero Image (replace HERO_IMAGE_URL above with your own image) */}
            <div className="hero-animate-visual">
              <div className="hero-image-container rounded-2xl overflow-hidden shadow-2xl">
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


      <section ref={ctaBannerRef} className="scroll-reveal py-14 bg-purple-600 relative overflow-hidden">
        <div className="pattern-dots absolute inset-0 pointer-events-none" />
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white flex items-start gap-4">
              <div className="hidden md:flex w-14 h-14 bg-white/15 rounded-xl items-center justify-center flex-shrink-0">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-2">Become a Tutor on Cognon</h3>
                <p className="text-purple-100 text-sm max-w-xl leading-relaxed">
                  Share your expertise, inspire learners worldwide, and build a sustainable income doing what you love. Join our growing community of 1,000+ expert tutors and reach students in 50+ countries.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => navigate(ROUTES.TUTOR_SIGNUP)}
                className="px-7 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-all duration-300 font-medium text-sm whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Register as Tutor
              </button>
              <button
                onClick={() => navigate(ROUTES.LOGIN_TUTOR)}
                className="px-7 py-3 border-2 border-white/80 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm whitespace-nowrap hover:-translate-y-0.5"
              >
                Tutor Login
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={featTitleRef} className="scroll-reveal text-center mb-14">
            <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Cognon ?</p>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
              We combine world-class instruction, flexible learning, and industry recognition to deliver an education experience that truly transforms careers.
            </p>
          </div>
          <div ref={featGridRef} className="reveal-children grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="reveal-child card-gradient-border bg-white text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="py-16 bg-gray-900 text-white relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={statsTitleRef} className="scroll-reveal text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Join Our Growing Community</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">Numbers that reflect our commitment to delivering quality education and measurable outcomes for every learner.</p>
          </div>
          <div ref={statsGridRef} className="reveal-children-scale grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="reveal-child text-center group">
                <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.number}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
                <div className="w-8 h-0.5 bg-purple-500 mx-auto mt-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50/50">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={catTitleRef} className="scroll-reveal text-center mb-12">
            <p className="text-purple-600 font-semibold mb-2 text-xs uppercase tracking-widest">Browse</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Popular Categories</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">Explore our most popular course categories and find the skills that align with your career goals and interests.</p>
          </div>
          {categoriesLoading ? (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 h-40 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No categories available yet</p>
            </div>
          ) : (
            <div className="relative">
              <div ref={catScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
                {categories.map((category, index) => (
                  <CategoryCard key={index} category={category} navigate={navigate} />
                ))}
              </div>
              {/* Carousel arrows */}
              <button
                onClick={() => scrollCarousel(catScrollRef, -1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100 text-gray-655"
                aria-label="Scroll categories left"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => scrollCarousel(catScrollRef, 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100 text-gray-655"
                aria-label="Scroll categories right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>


      <section className="py-20 bg-gray-50">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={howTitleRef} className="scroll-reveal text-center mb-14">
            <p className="text-purple-600 font-semibold mb-2 text-xs uppercase tracking-widest">Process</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">Getting started on Cognon is simple. Follow these four steps to begin your learning journey and earn your first certificate.</p>
          </div>
          <div ref={howGridRef} className="reveal-children grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="reveal-child relative">
                {/* Connector line (between cards on desktop) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-purple-100 -z-10" />
                )}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold text-purple-200">{item.step}</span>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>





      <section id="courses" className="py-20 bg-white">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={coursesTitleRef} className="scroll-reveal flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <p className="text-purple-600 font-semibold mb-1 text-xs uppercase tracking-widest">Courses</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Featured Courses</h2>
              <p className="text-gray-550 text-sm mt-2">Hand-picked courses from our top-rated courses to help you build in-demand skills.</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="hidden sm:flex text-purple-600 hover:text-purple-700 font-medium text-sm items-center gap-2 group flex-shrink-0"
            >
              View All Courses
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div ref={coursesBodyRef} className="scroll-reveal">
            {coursesLoading ? (
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100" style={{ scrollSnapAlign: 'start' }}>
                    <div className="aspect-video skeleton-shimmer" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 skeleton-shimmer rounded w-3/4" />
                      <div className="h-3 skeleton-shimmer rounded w-1/2" />
                      <div className="h-3 skeleton-shimmer rounded w-2/3" />
                      <div className="h-10 skeleton-shimmer rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-purple-300" />
                </div>
                <p className="text-gray-700 text-lg font-semibold mb-2">No courses available yet</p>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">Our instructors are preparing fresh content. Check back soon for new courses across all categories.</p>
              </div>
            ) : (
              <div className="relative">
                <div ref={courseScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                  {courses.map((course) => (
                    <div
                      key={course._id}
                      onClick={() => navigate(ROUTES.LOGIN)}
                      className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:-translate-y-1"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-purple-50 overflow-hidden relative">
                        {course.thumbnailURL ? (
                          <img
                            src={course.thumbnailURL}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500">
                            <BookOpen className="w-10 h-10 text-white" />
                          </div>
                        )}
                        {course.offer && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            {course.offer.discountPercentage}% OFF
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        {course.category && (
                          <span className="inline-block text-xs text-purple-600 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-md mb-2">{course.category}</span>
                        )}
                        <h3 className="font-bold text-sm mt-1 mb-2 line-clamp-2 leading-snug text-gray-900">{course.title}</h3>
                        <p className="text-xs text-gray-400 mb-3">By {course.tutor?.name || 'Instructor'}</p>

                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4 justify-between">
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={course.rating || 0} size={13} />
                            <span className="text-xs font-semibold text-gray-500">
                              ({course.reviewCount || 0})
                            </span>
                          </div>
                          {course.enrolledCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {course.enrolledCount} students
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            {course.offer ? (
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-purple-600">&#8377;{course.offer.discountedPrice}</span>
                                <span className="text-xs text-gray-400 line-through">&#8377;{course.price}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-purple-600">
                                {course.price === 0 ? 'Free' : `\u20B9${course.price}`}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(ROUTES.LOGIN); }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs font-medium"
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
                  onClick={() => scrollCarousel(courseScrollRef, -1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100"
                  aria-label="Scroll courses left"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={() => scrollCarousel(courseScrollRef, 1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100"
                  aria-label="Scroll courses right"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="tutors" className="py-20 bg-gray-50">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={tutorTitleRef} className="scroll-reveal text-center mb-14">
            <p className="text-purple-600 font-semibold mb-2 text-xs uppercase tracking-widest">Our Tutors</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Learn from Industry Experts</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">Our tutors are experienced professionals who bring real-world knowledge, practical insights, and mentorship to every course they create.</p>
          </div>
          {tutorsLoading ? (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="h-36 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div ref={tutorCarouselRef} className="scroll-reveal relative">
              <div ref={tutorScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
                {dbTutors.map((tutor, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-64 h-[380px] flex flex-col justify-between bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1.5"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Avatar header */}
                    <div className="h-36 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent" />
                      {tutor.profileImageURL ? (
                        <img src={tutor.profileImageURL} alt={tutor.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow relative z-10" />
                      ) : (
                        <AvatarSVG name={tutor.name} size={72} />
                      )}
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1">{tutor.name}</h3>
                        <p className="text-purple-600 text-xs font-medium mb-3 line-clamp-2 h-8 leading-tight">{tutor.tutorProfile?.subject || 'Instructor'}</p>
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-750">{(tutor.averageRating ?? 0).toFixed(1)}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <span>{tutor.totalStudents ?? 0} students</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">{tutor.totalCourses ?? 0} courses published</p>
                        <button
                          onClick={() => navigate(ROUTES.LOGIN)}
                          className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 text-xs font-medium hover:shadow-md"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Carousel arrows */}
              <button
                onClick={() => scrollCarousel(tutorScrollRef, -1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100 text-gray-655"
                aria-label="Scroll tutors left"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
              <button
                onClick={() => scrollCarousel(tutorScrollRef, 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10 border border-gray-100 text-gray-655"
                aria-label="Scroll tutors right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>



   
      <section ref={finalCtaRef} className="scroll-reveal py-20 bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="pattern-dots absolute inset-0 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-purple-100 text-sm leading-relaxed mb-8 max-w-xl mx-auto">
            Join 50,000+ students already learning on Cognon. Sign up for free today and get instant access to our extensive course library, expert instructors, and supportive community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={ROUTES.SIGNUP}>
              <button className="px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Create Free Account
              </button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <button className="px-8 py-3 border-2 border-white/80 text-white rounded-lg hover:bg-white/10 transition-all duration-300 font-medium text-sm hover:-translate-y-0.5">
                Browse Courses
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          ABOUT SECTION (Moved above Contact)
          ═══════════════════════════════════════ */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={aboutTitleRef} className="scroll-reveal text-center mb-14">
            <p className="text-purple-600 font-semibold mb-10 text-xl uppercase tracking-widest">About Us</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Empowering Learners Globally
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
              We are on a mission to make quality education accessible, affordable, and effective for every learner around the world.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div ref={aboutTextRef} className="scroll-reveal from-right">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed mb-5 text-sm">
                At Cognon, we believe that education should be accessible to everyone, everywhere. Our platform connects passionate tutors with eager learners, creating a vibrant community of knowledge sharing and growth.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                With thousands of courses across various disciplines, we empower individuals to pursue their passions, advance their careers, and achieve their goals through flexible, high-quality online learning experiences.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Self-paced courses with lifetime access to all materials',
                  'Hands-on projects and real-world assignments for practical skills',
                  'Dedicated mentor support and active community forums',
                  'Industry-recognized completion certificates for career growth',
                  'Interactive quizzes and assessments to track your progress'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to={ROUTES.SIGNUP}>
                <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md">
                  Start Learning
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div ref={aboutMetricsRef} className="scroll-reveal from-left grid grid-cols-2 gap-4">
              {aboutMetrics.map((metric, i) => (
                <div
                  key={i}
                  className={`${i % 2 === 1 ? 'mt-6' : ''} bg-gradient-to-br ${i === 0 ? 'from-purple-500 to-indigo-600' : i === 1 ? 'from-pink-500 to-purple-600' : i === 2 ? 'from-indigo-500 to-purple-600' : 'from-violet-500 to-purple-600'} rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center hover:-translate-y-1 transition-all duration-300 min-h-[140px]`}
                >
                  <metric.icon className="w-8 h-8 text-white/80 mb-2" />
                  <p className="text-white font-bold text-2xl mb-1">{metric.number}</p>
                  <p className="text-white/80 font-medium text-xs text-center">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 text-white pt-16 pb-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
        <div className="max-w-[1680px] mx-auto px-6 md:px-12 xl:px-20">
          <div ref={footerRef} className="reveal-children grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand column */}
            <div className="reveal-child">
              <div className="flex items-center gap-2 mb-4">
                <Logo size={32} />
                <h3 className="text-lg font-bold text-purple-400">Cognon</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Cognon is a modern e-learning platform empowering learners worldwide with quality education, expert-led courses, and industry-recognized certifications.
              </p>
              <div className="space-y-2.5">
                <a href="mailto:support@cognon.com" className="flex items-center gap-2.5 text-gray-400 text-sm hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>support@cognon.com</span>
                </a>
                <a href="tel:+919876543210" className="flex items-center gap-2.5 text-gray-400 text-sm hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-purple-400" />
                  <span>+91 98765 43210</span>
                </a>
                <div className="flex items-center gap-2.5 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>Kochi, Kerala, India</span>
                </div>
              </div>
            </div>

            {/* Quick Links column */}
            <div className="reveal-child">
              <h4 className="font-semibold mb-5 text-sm text-white">Quick Links</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  { label: 'Home', href: '#home' },
                  { label: 'About Us', href: '#about' },
                  { label: 'All Courses', href: '#courses' },
                  { label: 'Pricing', href: '#' },
                  { label: 'Contact Us', href: '#contact' },
                  { label: 'FAQ', href: '#' }
                ].map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                      <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Tutors / Resources column */}
            <div className="reveal-child">
              <h4 className="font-semibold mb-5 text-sm text-white">For Tutors</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link to="/tutor/register" className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Become a Tutor
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.LOGIN_TUTOR} className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Tutor Login
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Teaching Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Tutor Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Revenue & Payouts
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors inline-flex items-center gap-1.5 group">
                    <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Help & Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter & Social column */}
            <div className="reveal-child">
              <h4 className="font-semibold mb-5 text-sm text-white">Stay Connected</h4>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">Subscribe to our newsletter for the latest courses, offers, and learning tips delivered to your inbox.</p>
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                />
                <button className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm font-medium flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </button>
              </div>

              <p className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-wide">Follow Us</p>
              <div className="flex gap-3">
                {/* Facebook */}
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                {/* Twitter / X */}
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                {/* YouTube */}
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors" aria-label="YouTube">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors" aria-label="Instagram">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Cognon. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
