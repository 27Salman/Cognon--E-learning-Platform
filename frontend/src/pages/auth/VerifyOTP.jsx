import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import axios from '../../api/axios';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { verifyOTP } from '../../api/authAPI';
import { ROUTES, ROLES } from '../../utils/constants';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const email = location.state?.email;
    const role = location.state?.role || 'student';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(120); 
    const [expiryTimer, setExpiryTimer] = useState(300); 
    const inputRefs = useRef([]);
    const resendIntervalRef = useRef(null);
    const expiryIntervalRef = useRef(null);

    const startTimers = (resendSecs = 120, expirySecs = 300) => {
        clearInterval(resendIntervalRef.current);
        clearInterval(expiryIntervalRef.current);
        setResendTimer(resendSecs);
        setExpiryTimer(expirySecs);
        resendIntervalRef.current = setInterval(() => {
            setResendTimer(prev => { if (prev <= 1) { clearInterval(resendIntervalRef.current); return 0; } return prev - 1; });
        }, 1000);
        expiryIntervalRef.current = setInterval(() => {
            setExpiryTimer(prev => { if (prev <= 1) { clearInterval(expiryIntervalRef.current); return 0; } return prev - 1; });
        }, 1000);
    };

    useEffect(() => {
        if (!email) { navigate(ROUTES.SIGNUP, { replace: true }); return; }
        startTimers();
        return () => { clearInterval(resendIntervalRef.current); clearInterval(expiryIntervalRef.current); };
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1].focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;
        const newOtp = pastedData.split('');
        setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
        inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) { toast.error('Please enter complete OTP'); return; }
        if (expiryTimer <= 0) { toast.error('OTP has expired. Please request a new one.'); return; }

        setLoading(true);
        try {
            const response = await verifyOTP(email, otpString);
            if (response.success) {
                if (response.token && response.user) {
                    dispatch(setCredentials({ token: response.token, user: response.user }));
                }
                toast.success('Email verified successfully!');
                const dashboard = role === ROLES.TUTOR ? ROUTES.TUTOR_DASHBOARD : ROUTES.STUDENT_DASHBOARD;
                navigate(dashboard, { replace: true });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setResendLoading(true);
        try {
            const response = await axios.post('/auth/resend-otp', { email });
            if (response.success || response.data?.success) {
                toast.success('New OTP sent successfully!');
                startTimers();
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const isOtpExpired = expiryTimer <= 0;
    const canResend = resendTimer <= 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                    <p className="text-gray-600">
                        We've sent a 6-digit code to<br />
                        <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex justify-center gap-3 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                                    isOtpExpired
                                        ? 'border-red-300 bg-red-50 cursor-not-allowed'
                                        : 'border-gray-300 focus:border-primary-500'
                                }`}
                                autoFocus={index === 0}
                                disabled={isOtpExpired}
                            />
                        ))}
                    </div>

                    {/* Expiry status */}
                    <div className="text-center mb-3">
                        {isOtpExpired ? (
                            <p className="text-red-600 font-medium">OTP expired! Please request a new one.</p>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                OTP valid for: <span className="font-semibold text-gray-700">{formatTime(expiryTimer)}</span>
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                        disabled={loading || isOtpExpired}
                    >
                        Verify OTP
                    </Button>

                    {/* Resend section */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 mb-2">Didn't receive the code?</p>
                        {canResend ? (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Sending...' : 'Resend OTP'}
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Resend available in <span className="font-semibold text-primary-600">{formatTime(resendTimer)}</span>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyOTP;
