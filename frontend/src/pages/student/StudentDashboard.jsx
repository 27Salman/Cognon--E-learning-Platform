import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublishedCourses, fetchEnrolledCourses } from '../../store/slices/studentSlice';
import { BookOpen } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { catalog, enrolledCourses } = useSelector(state => state.student);

  useEffect(() => {
    dispatch(fetchPublishedCourses({}));
    dispatch(fetchEnrolledCourses());
  }, [dispatch]);

  const enrolledIds = new Set(enrolledCourses.map(c => c._id));
  const unenrolled = catalog.filter(c => !enrolledIds.has(c._id)).slice(0, 4);

  const uniqueCategories = [...new Set(catalog.map(c => c.category).filter(Boolean))].slice(0, 4);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-white py-20">
        <div className="w-full px-6">
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
        <div className="w-full px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Courses Enrolled */}
            <div className="bg-blue-50 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-blue-600 mb-2">Courses Enrolled</h3>
                <p className="text-4xl font-bold text-gray-900">{enrolledCourses.length}</p>
              </div>
              <div className="text-5xl">📚</div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-2xl p-8 flex items-center justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">Completed</h3>
                <p className="text-4xl font-bold text-gray-900">{enrolledCourses.filter(c => (c.progress || 0) >= 100).length}</p>
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
      <div className="w-full px-6">
        {/* Continue Learning Section */}
        <section className="py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Continue Learning</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_MY_COURSES)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              View all courses
            </button>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-16 text-center">
              <div className="text-8xl mb-6">📖</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Enrolled Courses</h3>
              <p className="text-gray-600 mb-8 text-sm">Start your learning journey by enrolling in a course</p>
              <button
                onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                className="px-8 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium text-sm inline-flex items-center gap-2"
              >
                Browse Courses <span>→</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {enrolledCourses.slice(0, 4).map(course => (
                <div
                  key={course._id}
                  onClick={() => navigate(`/student/courses/${course._id}/lessons`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition border border-gray-100 cursor-pointer"
                >
                  <div className="w-full h-36 bg-gray-100 overflow-hidden">
                    {course.thumbnailURL ? (
                      <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-purple-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">By {course.tutor?.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className={`h-1.5 rounded-full ${(course.progress || 0) >= 100 ? 'bg-green-500' : 'bg-purple-600'}`}
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{course.progress || 0}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Categories */}
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Categories</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_CATEGORIES)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
            >
              See All <span>→</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {uniqueCategories.map((cat, index) => (
              <div
                key={cat}
                onClick={() => navigate(`/student/categories?category=${encodeURIComponent(cat)}`)}
                className={`${['bg-blue-50','bg-purple-50','bg-green-50','bg-yellow-50'][index % 4]} rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer`}
              >
                <div className="text-5xl mb-4">
                  {['✏️','📊','💻','💼','📸','🎬','📱','🎯'][index % 8]}
                </div>
                <h3 className="font-bold text-lg mb-2">{cat}</h3>
                <p className="text-gray-600 text-sm">
                  {catalog.filter(c => c.category === cat).length} Courses
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Best Rated Courses */}
        <section className="py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Best Rated Courses</h2>
            <button
              onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2"
            >
              See All <span>→</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {unenrolled.length > 0 ? unenrolled.map(course => (
              <div
                key={course._id}
                onClick={() => navigate(`/student/courses/${course._id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition border border-gray-100 cursor-pointer"
              >
                <div className="w-full h-36 bg-gray-100 overflow-hidden">
                  {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-purple-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">By {course.tutor?.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-600">
                      {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/student/courses/${course._id}`); }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs font-medium"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-4 text-center py-10 text-gray-400">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No courses available yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* About Section */}
      <section className="py-20 bg-gray-50">
        <div className="w-full px-6">
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
                Install practical, industry-ready web development skills into your career and gain access to modern tools, frameworks, and real-world projects.Learn how to build responsive websites and scalable applications using popular frameworks. We guide you through architecture, best practices, and deployment so you can focus on building clean, efficient, and production-ready web applications.              </p>
              <p className="text-gray-600 leading-relaxed text-sm">
                Launch high-impact digital marketing strategies and get hands-on experience with SEO, social media, paid ads, and content marketing. Learn how to reach the right audience, drive meaningful traffic, and convert users into loyal customers. Start building campaigns based on real data and measurable outcomes. We connect you with tools, analytics, and proven frameworks.              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="w-full px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Join Us</h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                Instructors from around the world teach millions of students on Byway. We provide the tools and skills to teach what you love.              </p>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition font-medium text-sm">
                Start Your Instructor Journey
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
        <div className="w-full px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-700 rounded-3xl p-12 aspect-square flex items-center justify-center">
              <span className="text-9xl">🌟</span>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 uppercase">
                Transform your life through education              
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                Learners around the world are launching new careers, advancing in their fields, and enriching their lives.              
              </p>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition font-medium text-sm">
              Checkout Courses
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="w-full px-6 text-center">
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
        <div className="w-full px-6">
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