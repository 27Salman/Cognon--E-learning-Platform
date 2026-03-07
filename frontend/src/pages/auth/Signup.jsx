import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signupUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import { validateEmail, validatePhone, validatePassword } from '../../utils/helpers';
import { ROLES, ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';
import { getPasswordStrength } from '../../utils/helpers';

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  const [activeRole, setActiveRole] = useState(ROLES.STUDENT);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const roleContent = {
    [ROLES.STUDENT]: {
      title: 'Join as Student',
      subtitle: 'Start your learning journey today',
      gradient: 'from-primary-500 to-primary-700',
    },
    [ROLES.TUTOR]: {
      title: 'Join as Tutor',
      subtitle: 'Share your knowledge with the world',
      gradient: 'from-primary-500 to-primary-700',
    },
  };

  const currentContent = roleContent[activeRole];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Invalid phone number (10 digits, starts with 6-9)';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const resultAction = await dispatch(
        signupUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: activeRole,
        })
      );

      if (signupUser.fulfilled.match(resultAction)) {
        toast.success('Registration successful! Please verify your email.');
        navigate('/verify-otp', { 
          state: { 
            email: formData.email.trim(),
            timestamp: Date.now()
          } 
        });
      } else {
        toast.error(resultAction.payload || 'Signup failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === ROLES.STUDENT) {
        navigate(ROUTES.STUDENT_DASHBOARD);
      } else if (user.role === ROLES.TUTOR) {
        navigate(ROUTES.TUTOR_DASHBOARD);
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dynamic Illustration */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${currentContent.gradient} items-center justify-center p-12 transition-all duration-500`}>
        <div className="text-center text-white">
          <div className="mb-8">
            <svg className="w-64 h-64 mx-auto" viewBox="0 0 400 400" fill="none">
              <circle cx="200" cy="120" r="60" fill="white" opacity="0.9" />
              <rect x="140" y="200" width="120" height="140" rx="10" fill="white" opacity="0.9" />
              <circle cx="160" cy="250" r="8" fill="#7c3aed" />
              <circle cx="200" cy="250" r="8" fill="#7c3aed" />
              <circle cx="240" cy="250" r="8" fill="#7c3aed" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 transition-all duration-300">
            {currentContent.title}
          </h1>
          <p className="text-xl opacity-90 transition-all duration-300">
            {currentContent.subtitle}
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${activeRole === ROLES.STUDENT ? 'bg-white scale-110' : 'bg-white/30'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${activeRole === ROLES.TUTOR ? 'bg-white scale-110' : 'bg-white/30'}`}></div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo - Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cognon...!</h2>
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
              STUDENT
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
              TUTOR
            </button>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="User name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your User name"
              error={formErrors.name}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email Address"
              error={formErrors.email}
              required
            />

            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your Phone Number"
              error={formErrors.phone}
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

            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password Strength:</span>
                  <span 
                    className="text-xs font-medium"
                    style={{ color: getPasswordStrength(formData.password).color }}
                  >
                    {getPasswordStrength(formData.password).text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${getPasswordStrength(formData.password).strength}%`,
                      backgroundColor: getPasswordStrength(formData.password).color
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Must contain: uppercase, lowercase, number, special character (@$!%*?&), min 8 chars
                </p>
              </div>
            )}

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              error={formErrors.confirmPassword}
              required
            />

            {/* Submit Button  */}
            <button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading || isSubmitting}
              disabled={loading || isSubmitting}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Login here
            </Link>
          </p>

          {/* Google Sign Up */}
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
              onClick={() => toast.info('Google signup will be configured in backend')}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
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

export default Signup;