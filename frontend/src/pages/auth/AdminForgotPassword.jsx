import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Email is required'); return; }
    if (!validateEmail(trimmed)) { setEmailError('Invalid email format'); return; }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Password reset OTP sent to your email!');
        navigate('/admin/reset-password', { state: { email: trimmed }, replace: true });
      } else {
        toast.error(data.message || 'Failed to send reset OTP');
      }
    } catch {
      toast.error('Failed to send reset OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <svg className="w-64 h-64 mx-auto mb-8" viewBox="0 0 400 400" fill="none">
            <rect x="220" y="250" width="160" height="180" rx="20" fill="#6B7280" opacity="0.8" />
            <circle cx="300" cy="200" r="60" stroke="white" strokeWidth="20" fill="none" opacity="0.8" />
            <circle cx="300" cy="340" r="25" fill="white" />
            <rect x="295" y="340" width="10" height="60" rx="5" fill="white" />
          </svg>
          <h1 className="text-3xl font-bold mb-2">Admin Password Reset</h1>
          <p className="text-lg opacity-80">Secure administrative password recovery</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cognon</h1>
            <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
          </div>

          <div className="mb-8">
            <div className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium mb-4">
              🔒 Admin Access
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Reset Your Password</h2>
            <p className="text-gray-600">Enter your admin email and we'll send you a reset OTP.</p>
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
            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
              Send Reset OTP
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
              <FiArrowLeft className="mr-2" />
              Back to admin login
            </Link>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              If you're unable to reset your password, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
