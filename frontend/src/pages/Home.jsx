import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { ROUTES, ROLES } from '../utils/constants';
import { BookOpen, Star, Users, Clock, Award, Target, GraduationCap, TrendingUp, CheckCircle, Play, ArrowRight, Sparkles, Quote } from 'lucide-react';
import Logo from '../components/common/Logo';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [currentTutorSlide, setCurrentTutorSlide] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/catalog/courses?limit=8&sort=-createdAt`)
      .then(r => r.json())
      .then(data => setCourses(data?.data?.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  if (isAuthenticated && user) {
    const dashboard =
      user.role === ROLES.TUTOR ? ROUTES.TUTOR_DASHBOARD
      : user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.STUDENT_DASHBOARD;
    return <Navigate to={dashboard} replace />;
  }

  const features = [
    { icon: BookOpen, title: 'Learn Anything', description: 'Explore thousands of courses in various subjects' },
    { icon: Clock, title: 'Flexible Learning', description: 'Study at your own pace, anytime, anywhere' },
    { icon: Award, title: 'Get Certified', description: 'Earn certificates recognized by industry leaders' },
    { icon: GraduationCap, title: 'Expert Tutors', description: 'Learn from experienced professionals' }
  ];

  const categories = [
    { icon: Sparkles, title: 'Design', courses: '2,456 Courses', color: 'bg-pink-100' },
    { icon: Target, title: 'Business', courses: '1,853 Courses', color: 'bg-blue-100' },
    { icon: BookOpen, title: 'Development', courses: '3,721 Courses', color: 'bg-green-100' },
    { icon: TrendingUp, title: 'Marketing', courses: '1,456 Courses', color: 'bg-purple-100' }
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Software Engineer',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      text: 'Cognon transformed my career. The courses are well-structured and the instructors are industry experts. I landed my dream job after completing the Full Stack program.'
    },
    {
      name: 'James Wilson',
      role: 'Product Manager',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      text: 'The flexibility of learning at my own pace while working full-time was incredible. The practical projects helped me apply concepts immediately to my work.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      text: 'The design courses on Cognon are top-notch. I learned from real designers working at major tech companies. The community support is amazing too!'
    }
  ];

  const stats = [
    { icon: Users, number: '50,000+', label: 'Active Students' },
    { icon: GraduationCap, number: '1,000+', label: 'Expert Tutors' },
    { icon: BookOpen, number: '10,000+', label: 'Online Courses' },
    { icon: Star, number: '4.8/5', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 1s ease-out 0.3s both;
        }
      `}</style>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <h1 className="text-2xl font-bold text-purple-600">Cognon</h1>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#home" className="text-gray-700 hover:text-purple-600 transition">Home</a>
              <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
              <a href="#courses" className="text-gray-700 hover:text-purple-600 transition">Courses</a>
              <a href="#contact" className="text-gray-700 hover:text-purple-600 transition">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to={ROUTES.LOGIN}>
                <button className="px-5 py-2 text-sm text-purple-600 hover:text-purple-700 transition font-medium">
                  Login
                </button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <button className="px-5 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-white py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fadeIn">
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                We bring the<br />
                <span className="text-purple-600">knowledge.</span><br />
                We build the<br />
                <span className="text-purple-600">experience.</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <div className="flex gap-4">
                <Link to={ROUTES.SIGNUP}>
                  <button className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm flex items-center gap-2 group hover:transform hover:scale-105 transition-all duration-300">
                    <Play className="w-4 h-4" />
                    Get Started
                  </button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <button className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition font-medium text-sm flex items-center gap-2 group hover:transform hover:scale-105 transition-all duration-300">
                    Explore
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
            <div className="relative animate-slideUp">
              <div className="bg-white rounded-3xl shadow-2xl p-4 hover:shadow-3xl transition-all duration-300 group hover:transform hover:scale-105 overflow-hidden">
                <div className="aspect-video rounded-2xl overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop" 
                    alt="Students learning together"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-semibold text-sm">Join 50,000+ students worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Tutor CTA */}
      <section className="py-16 bg-purple-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-3">Become a Tutor on Cognon</h3>
              <p className="text-purple-100 text-sm max-w-xl">
                Share your knowledge, inspire learners worldwide, and earn money doing what you love. Join our community of expert tutors today!
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/tutor/register')}
                className="px-8 py-3 bg-white text-purple-600 rounded-md hover:bg-gray-100 transition font-medium text-sm whitespace-nowrap"
              >
                Register as Tutor
              </button>
              <button
                onClick={() => navigate('/tutor/login')}
                className="px-8 py-3 border-2 border-white text-white rounded-md hover:bg-purple-700 transition font-medium text-sm whitespace-nowrap"
              >
                Tutor Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Cognon */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Cognon?</h2>
            <p className="text-gray-600 text-sm">Discover what makes us the best choice for online learning</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold mb-2 text-sm uppercase tracking-wide">About Us</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              We provide the best opportunities<br />
              to students around the globe
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="animate-fadeIn">
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                At Cognon, we believe that education should be accessible to everyone, everywhere. Our platform connects passionate tutors with eager learners, creating a vibrant community of knowledge sharing and growth.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                With thousands of courses across various disciplines, we empower individuals to pursue their passions, advance their careers, and achieve their goals through flexible, high-quality online learning experiences.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-slideUp">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center hover:transform hover:scale-105 transition-all duration-300">
                <Users className="w-12 h-12 text-white mb-3" />
                <p className="text-white font-semibold text-sm">Students</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center mt-8 hover:transform hover:scale-105 transition-all duration-300">
                <BookOpen className="w-12 h-12 text-white mb-3" />
                <p className="text-white font-semibold text-sm">Learning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.number}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Categories</h2>
            <p className="text-gray-600 text-sm">Explore our most popular course categories</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div key={index} className={`${category.color} rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer group hover:transform hover:scale-105 transition-all duration-300`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300">
                  <category.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.courses}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Expert Tutors */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold mb-2 text-sm uppercase tracking-wide">Our Tutors</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Learn from Industry Experts</h2>
            <p className="text-gray-600 text-sm">Our tutors are experienced professionals who bring real-world knowledge to every course</p>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {[
                { name: 'Dr. Sarah Johnson', expertise: 'Web Development', rating: 4.9, students: '12,500', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
                { name: 'Prof. Michael Chen', expertise: 'Data Science', rating: 4.8, students: '8,200', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
                { name: 'Emma Williams', expertise: 'UX Design', rating: 4.9, students: '6,800', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
                { name: 'James Anderson', expertise: 'Digital Marketing', rating: 4.7, students: '5,400', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
                { name: 'Lisa Martinez', expertise: 'Mobile Development', rating: 4.8, students: '7,200', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop' },
                { name: 'David Kim', expertise: 'Machine Learning', rating: 4.9, students: '9,100', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' }
              ].map((tutor, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-72 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group hover:transform hover:scale-105 overflow-hidden border border-gray-100"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={tutor.image} 
                      alt={tutor.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{tutor.name}</h3>
                    <p className="text-purple-600 text-sm font-medium mb-3">{tutor.expertise}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">{tutor.rating}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{tutor.students} students</span>
                    </div>
                    <button 
                      onClick={() => navigate('/tutor/register')}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                const container = document.querySelector('.scrollbar-hide');
                container.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={() => {
                const container = document.querySelector('.scrollbar-hide');
                container.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Courses — real data from platform */}
      <section id="courses" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Featured Courses</h2>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
            >
              View All <span>→</span>
            </button>
          </div>

          {coursesLoading ? (
            <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-md animate-pulse" style={{ scrollSnapAlign: 'start' }}>
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No courses available yet</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon — new courses are being added!</p>
            </div>
          ) : (
            <div className="relative">
              <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {courses.map((course) => (
                  <div
                    key={course._id}
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer group"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-purple-100 overflow-hidden relative">
                      {course.thumbnailURL ? (
                        <img
                          src={course.thumbnailURL}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-500">
                          <BookOpen className="w-12 h-12 text-white" />
                        </div>
                      )}
                      {course.offer && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {course.offer.discountPercentage}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      {course.category && (
                        <span className="text-xs text-purple-600 font-medium">{course.category}</span>
                      )}
                      <h3 className="font-bold text-base mt-1 mb-2 line-clamp-2 leading-snug">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">By {course.tutor?.name || 'Instructor'}</p>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        {course.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {course.rating.toFixed(1)}
                          </span>
                        )}
                        {course.enrolledCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrolledCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          {course.offer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-purple-600">₹{course.offer.discountedPrice}</span>
                              <span className="text-xs text-gray-400 line-through">₹{course.price}</span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-purple-600">
                              {course.price === 0 ? 'Free' : `₹${course.price}`}
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
              <button 
                onClick={() => {
                  const container = document.querySelectorAll('.scrollbar-hide')[1];
                  if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => {
                  const container = document.querySelectorAll('.scrollbar-hide')[1];
                  if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors z-10"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold mb-2 text-sm uppercase tracking-wide">Testimonials</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
            <p className="text-gray-600 text-sm">Real stories from real people who transformed their careers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group hover:transform hover:-translate-y-2 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900 text-base">{testimonial.name}</h4>
                      <p className="text-xs text-purple-600 font-medium">{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 w-8 h-8 text-purple-200 opacity-50" />
                    <p className="text-gray-700 text-sm leading-relaxed relative z-10">{testimonial.text}</p>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Cognon</h3>
              <p className="text-gray-400 text-sm">Empowering learners worldwide with quality education</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Home</a></li>
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#courses" className="hover:text-white transition">Courses</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">For Tutors</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/tutor/register" className="hover:text-white transition">Become a Tutor</Link></li>
                <li><Link to="/tutor/login" className="hover:text-white transition">Tutor Login</Link></li>
                <li><a href="#" className="hover:text-white transition">Resources</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Follow Us</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition text-sm">f</a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition text-sm">t</a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition text-sm">in</a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition text-sm">yt</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Cognon. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
