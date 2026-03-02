import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { ROUTES } from '../utils/constants';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
            <div className="flex gap-4">
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline">Login</Button>
              </Link>
              <Link to={ROUTES.SIGNUP}>
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Empowering Learners Through
            <span className="text-primary-600"> Accessible Education</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students and tutors on Cognon - the leading platform for 
            high-quality, flexible, and affordable online learning experiences.
          </p>
          <div className="flex justify-center gap-4">
            <Link to={ROUTES.SIGNUP}>
              <Button variant="primary" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" size="lg">
                Explore Courses
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-primary-600 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Quality Courses
            </h3>
            <p className="text-gray-600">
              Access hundreds of courses across various domains taught by expert tutors.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-primary-600 text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Expert Tutors
            </h3>
            <p className="text-gray-600">
              Learn from industry professionals and certified instructors.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="text-primary-600 text-4xl mb-4">📜</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Certifications
            </h3>
            <p className="text-gray-600">
              Earn recognized certificates upon course completion.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Cognon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
