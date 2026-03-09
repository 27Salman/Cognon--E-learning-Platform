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
    { name: 'Design', icon: '✏️', color: 'bg-blue-100' },
    { name: 'Digital Marketing', icon: '📊', color: 'bg-purple-100' },
    { name: 'Development', icon: '💻', color: 'bg-blue-100' },
    { name: 'Business', icon: '💼', color: 'bg-green-100' }
  ];

  const courses = [
    { title: 'Learn Figma', image: '🎨', price: '$57', rating: 4.5, students: '2k', color: 'from-blue-300 to-blue-400' },
    { title: 'Basics of learning team', image: '👥', price: '$57', rating: 4.5, students: '2k', color: 'from-purple-300 to-purple-400' },
    { title: 'Learn Photoshop', image: '🖼️', price: '$57', rating: 4.5, students: '2k', color: 'from-green-300 to-green-400' },
    { title: 'Learn JavaScript', image: '⚡', price: '$57', rating: 4.5, students: '2k', color: 'from-indigo-300 to-indigo-400' }
  ];

  const testimonials = [
    { name: 'John Doe', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Jane Smith', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
    { name: 'Mike Johnson', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
              <button
                onClick={() => toast.info('Tutor application coming soon!')}
                className="px-6 py-2.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium"
              >
                Become a Tutor
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
      <section className="relative bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                We bring the<br />
                <span className="text-purple-600">knowledge</span><br />
                We build the<br />
                <span className="text-purple-600">experience</span>
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <button className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm">
                Get Started
              </button>
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
                    <span className="text-2xl">�</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-purple-600 text-white rounded-2xl p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3">Web Development</h3>
              <p className="text-purple-100 text-sm">Master modern web technologies and frameworks</p>
            </div>
            <div className="bg-purple-500 text-white rounded-2xl p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-3">User Experience</h3>
              <p className="text-purple-100 text-sm">Create beautiful and intuitive user interfaces</p>
            </div>
            <div className="bg-purple-700 text-white rounded-2xl p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-3">Marketing</h3>
              <p className="text-purple-100 text-sm">Learn digital marketing strategies that work</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-purple-600 font-semibold mb-2 text-sm uppercase tracking-wide">About</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Delivering high-quality<br />
              <span className="text-purple-600">e-Learning</span> opportunities
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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

      {/* CTA Section */}
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

      {/* Top Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Top Categories</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              See All <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div key={index} className={`${category.color} rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer`}>
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Most Popular Courses</h2>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              See All <span>→</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition">
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
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What our students say</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition flex items-center justify-center">←</button>
              <button className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition flex items-center justify-center">→</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-purple-100 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center text-2xl mr-3">
                    👤
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                    <div className="text-yellow-500 text-xs">{'⭐'.repeat(testimonial.rating)}</div>
                  </div>
                </div>
                <p className="text-gray-700 text-xs leading-relaxed">{testimonial.text}</p>
              </div>
            ))}
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
              <span className="text-9xl">📖</span>
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
              <p className="text-gray-400 text-sm">Your learning partner for success</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Home</a></li>
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Courses</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
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
