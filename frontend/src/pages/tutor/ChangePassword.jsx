import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorAPI } from '../../api/tutorAPI';
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage({ tutorInfo, onBack }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); 
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const validatePasswords = () => {
        if (!formData.newPassword || formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSendOTP = async () => {
        if (!validatePasswords()) return;

        setLoading(true);
        setError('');

        try {
            await tutorAPI.requestPasswordChange();
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndChangePassword = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {

            await tutorAPI.verifyPasswordChange(formData.newPassword, otp);
            
            setSuccess(true);
            
            setTimeout(() => {
                localStorage.removeItem('tutorInfo');
                localStorage.removeItem('cognon_token');
                localStorage.removeItem('cognon_user'); 
                navigate('/tutor/login');
            }, 2000);
            
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP or password change failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Password Changed Successfully!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Your password has been updated. You will be logged out in a moment.
                        <br />
                        Please login again with your new password.
                    </p>
                    <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Profile
            </button>

            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Change Password</h1>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
                
                {step === 1 ? (
                    // Step 1: Enter New Passwords
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-sky-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Create New Password
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Enter your new password below
                                </p>
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    placeholder="Enter new password (min. 8 characters)"
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Re-enter new password"
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-sky-900 text-sm mb-1">
                                        Security Verification Required
                                    </h3>
                                    <p className="text-sm text-sky-700">
                                        We'll send an OTP to your registered email ({tutorInfo?.email}) to verify this change.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                        </button>
                    </>
                ) : (
                    // Step 2: Verify OTP
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-sky-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Verify Your Identity
                            </h2>
                            <p className="text-gray-600 mb-1">
                                We've sent a verification code to:
                            </p>
                            <p className="font-semibold text-gray-900">{tutorInfo?.email}</p>
                        </div>

                        {/* OTP Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Enter 6-Digit OTP
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                    setError('');
                                }}
                                maxLength={6}
                                placeholder="000000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Resend OTP */}
                        <div className="text-center mb-6">
                            <button
                                onClick={handleSendOTP}
                                className="text-sm text-sky-500 hover:text-sky-600 font-medium"
                            >
                                Didn't receive code? Resend
                            </button>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                    setError('');
                                }}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleVerifyAndChangePassword}
                                disabled={loading || otp.length !== 6}
                                className="flex-1 px-6 py-3 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Change Password'}
                            </button>
                        </div>

                        {/* Warning Notice */}
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 text-center">
                                ⚠️ You will be logged out after password change.
                                Please login again with your new password.
                            </p>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}