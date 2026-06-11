import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import { validatePassword } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [step, setStep] = useState('otp');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(120);
  const [expiryTimer, setExpiryTimer] = useState(300);
  const inputRefs = useRef([]);
  const resendRef = useRef(null);
  const expiryRef = useRef(null);

  const startTimers = () => {
    clearInterval(resendRef.current);
    clearInterval(expiryRef.current);
    setResendTimer(120);
    setExpiryTimer(300);
    resendRef.current = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(resendRef.current); return 0; } return prev - 1; });
    }, 1000);
    expiryRef.current = setInterval(() => {
      setExpiryTimer(prev => { if (prev <= 1) { clearInterval(expiryRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  useEffect(() => {
    if (!email) { navigate(ROUTES.ADMIN_FORGOT_PASSWORD); return; }
    startTimers();
    return () => { clearInterval(resendRef.current); clearInterval(expiryRef.current); };
  }, [email, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { toast.error('Please enter complete OTP'); return; }
    if (expiryTimer <= 0) { toast.error('OTP has expired. Please request a new one.'); return; }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetToken(data.resetToken);
        setStep('password');
        toast.success('OTP verified! Now set your new password.');
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch {
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (/\s/.test(newPassword)) { toast.error('Password must not contain spaces'); return; }
    if (!validatePassword(newPassword)) {
      toast.error('Min 8 chars, must include uppercase, lowercase, number & special character (@$!%*?&)');
      return;
    }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate(ROUTES.LOGIN_ADMIN, { replace: true }), 2000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success('New OTP sent!');
        startTimers();
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const isOtpExpired = expiryTimer <= 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'otp' ? 'Verify OTP' : 'Set New Password'}
          </h2>
          <p className="text-gray-600">
            {step === 'otp' ? `We've sent a 6-digit code to ${email}` : 'Enter your new admin password below'}
          </p>
        </div>

        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isOtpExpired}
                  autoFocus={index === 0}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                    isOtpExpired ? 'border-red-300 bg-red-50 cursor-not-allowed' : 'border-gray-300 focus:border-purple-600'
                  }`}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {isOtpExpired ? (
                <p className="text-red-600 font-medium text-sm">OTP expired!</p>
              ) : (
                <p className="text-gray-500 text-sm">
                  OTP valid for: <span className="font-semibold text-gray-700">{formatTime(expiryTimer)}</span>
                </p>
              )}
              <div className="mt-2">
                {resendTimer > 0 ? (
                  <p className="text-xs text-gray-400">Resend available in <span className="font-semibold text-purple-600">{formatTime(resendTimer)}</span></p>
                ) : (
                  <button type="button" onClick={handleResendOtp} disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50">
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading || isOtpExpired}>
              Verify OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, number, special char"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
              Reset Password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to={ROUTES.LOGIN_ADMIN} className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
            <FiArrowLeft className="mr-2" />
            Back to admin login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
