import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, getErrorMessage } from '../../utils/helpers';
import { ROLES, ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

/**
 * Login Page - Student/Tutor
 * Features:
 * - Role tabs (Student/Tutor)
 * - Form validation
 * - Remember me checkbox
 * - Forgot password link
 * - Redirect to signup
 */
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  // Active role tab
  const [activeRole, setActiveRole] = useState(ROLES.STUDENT);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Dispatch login action
    const resultAction = await dispatch(
      loginUser({
        email: formData.email,
        password: formData.password,
      })
    );

    if (loginUser.fulfilled.match(resultAction)) {
      // Login successful
      toast.success('Login successful!');
    } else {
      // Login failed
      toast.error(resultAction.payload || 'Login failed');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === ROLES.STUDENT) {
        navigate(ROUTES.STUDENT_DASHBOARD);
      } else if (user.role === ROLES.TUTOR) {
        navigate(ROUTES.TUTOR_DASHBOARD);
      } else if (user.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Simple illustration - person with laptop */}
              <circle cx="200" cy="120" r="60" fill="white" opacity="0.9" />
              <rect x="140" y="200" width="120" height="140" rx="10" fill="white" opacity="0.9" />
              <rect x="100" y="300" width="200" height="80" rx="10" fill="white" opacity="0.7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Cognon</h1>
          <p className="text-xl opacity-90">
            Empowering learners through accessible and engaging online education.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo - Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cognon..!</h2>
            <p className="text-gray-600">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex mb-8 bg-gray-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveRole(ROLES.STUDENT)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeRole === ROLES.STUDENT
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveRole(ROLES.TUTOR)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeRole === ROLES.TUTOR
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="User name"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your User name"
              error={formErrors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              error={formErrors.password}
              required
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Login
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up for free!
            </Link>
          </p>

          {/* Google Sign In - Optional */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">Sign up with</span>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
