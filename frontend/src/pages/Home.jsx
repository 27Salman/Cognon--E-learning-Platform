import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { ROUTES, ROLES } from '../utils/constants';
import { BookOpen, Star, Users } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

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
    { icon: '📚', title: 'Learn Anything', description: 'Explore thousands of courses in various subjects' },
    { icon: '🎯', title: 'Flexible Learning', description: 'Study at your own pace, anytime, anywhere' },
    { icon: '🏆', title: 'Get Certified', description: 'Earn certificates recognized by industry leaders' },
    { icon: '👥', title: 'Expert Tutors', description: 'Learn from experienced professionals' }
  ];

  const categories = [
    { icon: '🎨', title: 'Design', courses: '2,456 Courses', color: 'bg-pink-100' },
    { icon: '💼', title: 'Business', courses: '1,853 Courses', color: 'bg-blue-100' },
    { icon: '💻', title: 'Development', courses: '3,721 Courses', color: 'bg-green-100' },
    { icon: '📊', title: 'Marketing', courses: '1,456 Courses', color: 'bg-purple-100' }
  ];

  const testimonials = [
    {
      name: 'John Doe',
      role: 'Student',
      rating: 5,
      text: 'Cognon has transformed my learning experience. The courses are well-structured and the tutors are incredibly knowledgeable. I highly recommend it to anyone looking to upskill!'
    },
    {
      name: 'Jane Smith',
      role: 'Professional',
      rating: 5,
      text: 'The flexibility and quality of courses on Cognon are unmatched. I was able to learn at my own pace and apply the knowledge directly to my work. Absolutely worth it!'
    },
    {
      name: 'Mike Johnson',
      role: 'Entrepreneur',
      rating: 5,
      text: 'As a busy entrepreneur, I needed a platform that could fit into my schedule. Cognon delivered exactly that with excellent content and supportive instructors.'
    }
  ];

  const stats = [
    { icon: '👥', number: '50,000+', label: 'Active Students' },
    { icon: '🎓', number: '1,000+', label: 'Expert Tutors' },
    { icon: '📚', number: '10,000+', label: 'Online Courses' },
    { icon: '⭐', number: '4.8/5', label: 'Average Rating' }
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
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <div className="flex gap-4">
                <Link to={ROUTES.SIGNUP}>
                  <button className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm">
                    Get Started
                  </button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <button className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition font-medium text-sm">
                    Explore
                  </button>
                </Link>
              </div>
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
              <div key={index} className="text-center">
                <div className="text-6xl mb-4">{feature.icon}</div>
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
            <div>
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                At Cognon, we believe that education should be accessible to everyone, everywhere. Our platform connects passionate tutors with eager learners, creating a vibrant community of knowledge sharing and growth.
              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                With thousands of courses across various disciplines, we empower individuals to pursue their passions, advance their careers, and achieve their goals through flexible, high-quality online learning experiences.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://via.placeholder.com/250x200/8B5CF6/FFFFFF?text=Students" alt="Students" className="rounded-2xl shadow-lg" />
              <img src="https://via.placeholder.com/250x200/7C3AED/FFFFFF?text=Learning" alt="Learning" className="rounded-2xl shadow-lg mt-8" />
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
              <div key={index} className="text-center">
                <div className="text-5xl mb-3">{stat.icon}</div>
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
              <div key={index} className={`${category.color} rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer`}>
                <div className="text-6xl mb-4">{category.icon}</div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.courses}</p>
              </div>
            ))}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer group"
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
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-purple-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">What our students say</h2>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center">←</button>
              <button className="w-10 h-10 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center">→</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center text-2xl mr-3">
                    👤
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                    <div className="text-yellow-500 text-xs">{'⭐'.repeat(testimonial.rating)}</div>
                  </div>
                </div>
                <p className="text-gray-700 text-xs leading-relaxed">{testimonial.text}</p>
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
