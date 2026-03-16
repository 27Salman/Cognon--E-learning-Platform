import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api/axios';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { verifyOTP } from '../../api/authAPI';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const role = location.state?.role || 'student';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(120); // 2 minutes
    const inputRefs = useRef([]);

    useEffect(() => {
        if (!email) {
            navigate('/signup');
            return;
        }

        // Start countdown timer
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('');
        setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
        
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        if (timer <= 0) {
            toast.error('OTP has expired. Please request a new one.');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyOTP(email, otpString);

            if (response.success) {
                toast.success('Email verified successfully!');
                setOtp(['', '', '', '', '', '']);
                const dashboard = role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';
                setTimeout(() => {
                    navigate(dashboard, { replace: true });
                }, 1000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) {
            toast.error('Please wait for the timer to expire');
            return;
        }

        setResendLoading(true);
        try {
            const response = await axios.post('/auth/resend-otp', { email });
        
            if (response.data.success) {
                toast.success('New OTP sent successfully!');
                setTimer(120); 
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                    autoFocus={index === 0}
                    disabled={timer === 0}
                />
                ))}
            </div>

            <div className="text-center mb-6">
                {timer > 0 ? (
                <p className="text-gray-600">
                    Time remaining: <span className="font-medium text-primary-600">{formatTime(timer)}</span>
                </p>
                ) : (
                <p className="text-red-600 font-medium">OTP expired! Please request a new one.</p>
                )}
            </div>

            <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || timer === 0}
            >
                Verify OTP
            </Button>

            <div className="mt-6 text-center">
                <p className="text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || timer > 0}
                className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
                {timer > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                    Available after timer expires
                </p>
                )}
            </div>
            </form>
        </div>
        </div>
    );
};

export default VerifyOTP;