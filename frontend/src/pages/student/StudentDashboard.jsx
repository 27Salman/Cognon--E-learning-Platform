import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ROUTES } from '../../utils/constants';
import { useState, useEffect, useRef } from 'react';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const categories = [
    { icon: '✏️', title: 'Design', courses: '2,456 Courses', color: 'bg-blue-50' },
    { icon: '📊', title: 'Digital Marketing', courses: '1,853 Courses', color: 'bg-purple-50' },
    { icon: '💻', title: 'Development', courses: '3,721 Courses', color: 'bg-blue-50' },
    { icon: '💼', title: 'Business', courses: '1,456 Courses', color: 'bg-green-50' }
  ];

  const courses = [
    { 
      title: 'Learn Figma - UI/UX Design', 
      image: '🎨', 
      price: '$57', 
      rating: 4.5, 
      students: '2.5k',
      color: 'from-blue-400 to-indigo-500'
    },
    { 
      title: 'Basics of learning team management', 
      image: '👥', 
      price: '$57', 
      rating: 4.8, 
      students: '1.8k',
      color: 'from-cyan-400 to-blue-500'
    },
    { 
      title: 'Learn Photoshop - Photo Editing', 
      image: '🖼️', 
      price: '$57', 
      rating: 4.7, 
      students: '3.2k',
      color: 'from-green-400 to-emerald-500'
    },
    { 
      title: 'Learn SQL - Database Management', 
      image: '💾', 
      price: '$57', 
      rating: 4.6, 
      students: '2.1k',
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Icons */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-600">Cognon</h1>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#home" className="text-gray-700 hover:text-purple-600 transition">Home</a>
              <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
              <a href="#courses" className="text-gray-700 hover:text-purple-600 transition">Courses</a>
              <a href="#blog" className="text-gray-700 hover:text-purple-600 transition">Blog</a>
              <a href="#contact" className="text-gray-700 hover:text-purple-600 transition">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              {/* Wishlist Icon */}
              <button className="relative hover:opacity-80 transition" title="Wishlist">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Cart Icon */}
              <button className="relative hover:opacity-80 transition" title="Cart">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Notification Bell Icon */}
              <button className="relative hover:opacity-80 transition" title="Notifications">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition">
                      My Profile
                    </a>
                    <a href="#courses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition">
                      My Courses
                    </a>
                    <a href="#wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition">
                      Wishlist
                    </a>
                    <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition">
                      Settings
                    </a>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                We bring the<br />
                <span className="text-purple-600">knowledge.</span><br />
                We build the<br />
                <span className="text-purple-600">experience.</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                Bring learning to life with personalized activities, videos, and assessments that motivate students at every step of their journey.
              </p>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <div className="aspect-video bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl">💻</span>
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 shadow-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Courses Enrolled */}
            <div className="bg-blue-50 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-blue-600 mb-2">Courses Enrolled</h3>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <div className="text-5xl">📚</div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">Completed</h3>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <div className="text-5xl">✅</div>
            </div>

            {/* Certificates */}
            <div className="bg-orange-50 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-orange-600 mb-2">Certificates</h3>
                <p className="text-4xl font-bold text-gray-900">0</p>
              </div>
              <div className="text-5xl">📜</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Continue Learning Section */}
        <section className="py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Continue Learning</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              View all courses
            </button>
          </div>
          
          {/* No Enrolled Courses State */}
          <div className="bg-gray-50 rounded-2xl p-16 text-center">
            <div className="text-8xl mb-6">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Enrolled Courses</h3>
            <p className="text-gray-600 mb-8 text-sm">Start your learning journey by enrolling in a course</p>
            <button className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm inline-flex items-center gap-2">
              Browse Courses <span>→</span>
            </button>
          </div>
        </section>

        {/* Top Categories */}
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Categories</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              See All <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div key={index} className={`${category.color} rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer`}>
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.courses}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Rated Courses */}
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Best Rated Courses</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              See All <span>→</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition border border-gray-100">
                <div className={`aspect-video bg-gradient-to-br ${course.color} flex items-center justify-center text-6xl`}>
                  {course.image}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-base mb-3">{course.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                    <span className="flex items-center gap-1">⭐ {course.rating}</span>
                    <span className="flex items-center gap-1">👥 {course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600">{course.price}</span>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs font-medium">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold mb-2 text-sm uppercase tracking-wide">About Us</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Delivering high-quality<br />
              <span className="text-purple-600">e-Learning</span> opportunities
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                At Cognon, we believe that education should be accessible to everyone, everywhere. Our platform connects passionate tutors with eager learners, creating a vibrant community of knowledge sharing and growth.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                With thousands of courses across various disciplines, we empower individuals to pursue their passions, advance their careers, and achieve their goals through flexible, high-quality online learning experiences.
              </p>
            </div>
            <div className="bg-purple-200 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <span className="text-9xl">📚</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-purple-200 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <span className="text-9xl">🎓</span>
            </div>
            <div>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Join Us</h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition font-medium text-sm">
                Get Started
              </button>
            </div>
            <div className="bg-gray-800 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <span className="text-9xl">🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* Another Info Section */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-700 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <span className="text-9xl">�</span>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 uppercase">
                LOREM IPSUM DOLOR SIT AMET
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition font-medium text-sm">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Us By Creating Account<br />
            <span className="text-gray-400 text-2xl">or Start a Free Trial</span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm">Get started today and unlock your potential</p>
          <button className="px-8 py-3 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition font-medium text-sm">
            Get Started
          </button>
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
              <h4 className="font-semibold mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
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

export default StudentDashboard;
