import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

/**
 * Admin Forgot Password Page
 * Accessible via /admin/forgot-password
 */
const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle email change
  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      return;
    }

    setLoading(true);

    try {
      // TODO: Call admin forgot password API
      // await adminForgotPasswordAPI(email);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setSuccess(true);
      toast.success('Password reset link sent to admin email!');
    } catch (error) {
      toast.error('Failed to send reset link. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Admin Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-8">
            <svg
              className="w-80 h-80 mx-auto"
              viewBox="0 0 600 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Admin forgot password illustration */}
              <circle cx="100" cy="100" r="40" fill="#D1D5DB" opacity="0.5" />
              <circle cx="500" cy="150" r="60" fill="#9CA3AF" opacity="0.5" />
              
              {/* Lock icon */}
              <rect x="220" y="250" width="160" height="180" rx="20" fill="#6B7280" />
              <circle cx="300" cy="200" r="60" stroke="#6B7280" strokeWidth="20" fill="none" />
              <circle cx="300" cy="340" r="25" fill="white" />
              <rect x="295" y="340" width="10" height="60" rx="5" fill="white" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Password Reset</h1>
          <p className="text-lg text-gray-600">
            Secure administrative password recovery
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo - Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cognon</h1>
            <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
          </div>

          {success ? (
            // Success Message
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-8">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <FiArrowLeft className="mr-2" />
                Back to admin login
              </Link>
            </div>
          ) : (
            // Reset Form
            <>
              <div className="mb-8">
                <div className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium mb-4">
                  🔒 Admin Access
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Reset Your Password</h2>
                <p className="text-gray-600">
                  Forgot your password? No worries, then let's submit password reset. 
                  It will be send to your email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="admin@cognon.com"
                  error={emailError}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  Reset Password
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                >
                  <FiArrowLeft className="mr-2" />
                  Back to admin login
                </Link>
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ If you're unable to reset your password, please contact the system administrator.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
