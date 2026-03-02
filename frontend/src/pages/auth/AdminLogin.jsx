import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';
import { ROLES, ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

/**
 * Admin Login Page
 * Accessible via /admin/login
 * No role selection - admin only
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      // Check if user is admin
      const loggedInUser = resultAction.payload.user;
      if (loggedInUser.role !== ROLES.ADMIN) {
        toast.error('Unauthorized access. Admin only.');
        dispatch(clearError());
        return;
      }
      toast.success('Admin login successful!');
    } else {
      toast.error(resultAction.payload || 'Login failed');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        // Not admin - redirect to appropriate dashboard
        toast.error('Unauthorized access');
        if (user.role === ROLES.STUDENT) {
          navigate(ROUTES.STUDENT_DASHBOARD);
        } else if (user.role === ROLES.TUTOR) {
          navigate(ROUTES.TUTOR_DASHBOARD);
        }
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
      {/* Left Side - Admin Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8">
            <svg
              className="w-64 h-64 mx-auto"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Admin icon - person with briefcase */}
              <circle cx="200" cy="100" r="50" fill="white" opacity="0.9" />
              <rect x="150" y="170" width="100" height="120" rx="8" fill="white" opacity="0.9" />
              <rect x="160" cy="240" width="80" height="60" rx="5" fill="#6d28d9" opacity="0.8" />
              <path d="M 170 200 L 230 200 L 230 220 L 170 220 Z" fill="#6d28d9" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">COGNON ADMIN</h1>
          <p className="text-xl opacity-90">Secure Administrative Access</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo - Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cognon</h1>
            <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cognon..!</h2>
            <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mt-2">
              🔒 Admin Access Only
            </div>
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/admin/forgot-password"
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

          {/* Warning */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ This is a restricted area. Unauthorized access attempts will be logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
