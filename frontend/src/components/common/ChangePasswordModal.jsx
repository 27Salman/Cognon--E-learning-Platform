import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validatePassword } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({
    userInfo,
    onRequestOTP,
    onVerify,
    onSuccessRedirect,
    onClose,
}) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [timer, setTimer] = useState(0);
    const [expiryTimer, setExpiryTimer] = useState(0);
    const timerRef = useRef(null);
    const expiryRef = useRef(null);

    const startTimer = () => {
        setTimer(120);
        setExpiryTimer(300);
        clearInterval(timerRef.current);
        clearInterval(expiryRef.current);
        timerRef.current = setInterval(() => {
            setTimer(p => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
        }, 1000);
        expiryRef.current = setInterval(() => {
            setExpiryTimer(p => { if (p <= 1) { clearInterval(expiryRef.current); return 0; } return p - 1; });
        }, 1000);
    };

    useEffect(() => () => {
        clearInterval(timerRef.current);
        clearInterval(expiryRef.current);
    }, []);

    const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const validate = () => {
        if (/\s/.test(formData.newPassword)) { setError('Password must not contain spaces'); return false; }
        if (!validatePassword(formData.newPassword)) {
            setError('Min 8 chars, must include uppercase, lowercase, number & special character (@$!%*?&)');
            return false;
        }
        if (formData.newPassword !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
        return true;
    };

    const handleSendOTP = async () => {
        if (!validate()) return;
        setLoading(true); setError('');
        try {
            await onRequestOTP();
            setStep(2);
            startTimer();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleResendOTP = async () => {
        if (timer > 0) return;
        setLoading(true); setError('');
        try {
            await onRequestOTP();
            startTimer(); setOtp('');
            toast.success('New OTP sent!');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to resend OTP');
        } finally { setLoading(false); }
    };

    const handleVerify = async () => {
        if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
        setLoading(true); setError('');
        try {
            await onVerify(formData.newPassword, otp);
            setSuccess(true);
            toast.success('Password changed! Logging out...');
            setTimeout(() => {
                localStorage.removeItem('cognon_token');
                localStorage.removeItem('cognon_user');
                window.location.href = onSuccessRedirect;
            }, 2000);
        } catch (e) {
            setError(e.response?.data?.message || 'Invalid OTP or change failed');
        } finally { setLoading(false); }
    };

    const goBack = () => {
        setStep(1); setOtp(''); setError('');
        clearInterval(timerRef.current); clearInterval(expiryRef.current);
        setTimer(0); setExpiryTimer(0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                            <p className="text-sm text-gray-500">
                                {step === 1 ? 'Enter your new password' : 'Verify with OTP'}
                            </p>
                        </div>
                    </div>
                    {!success && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <p className="font-semibold text-gray-900 mb-1">Password Changed!</p>
                            <p className="text-sm text-gray-500">Logging you out...</p>
                            <div className="mt-4 animate-spin w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
                        </div>

                    ) : step === 1 ? (
                        /* Step 1 — new password entry */
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={e => { setFormData(p => ({ ...p, newPassword: e.target.value })); setError(''); }}
                                        placeholder="Min 8 chars, uppercase, number, special char"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={e => { setFormData(p => ({ ...p, confirmPassword: e.target.value })); setError(''); }}
                                        placeholder="Re-enter new password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                                    />
                                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-5">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-purple-700">
                                        An OTP will be sent to <span className="font-semibold">{userInfo?.email}</span> to verify this change.
                                    </p>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                            <div className="flex gap-3">
                                <button onClick={onClose}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSendOTP} disabled={loading}
                                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50">
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </button>
                            </div>
                        </>

                    ) : (
                        /* Step 2 — OTP verification */
                        <>
                            <div className="text-center mb-5">
                                <p className="text-gray-600 text-sm">Verification code sent to</p>
                                <p className="font-semibold text-gray-900">{userInfo?.email}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    Enter 6-Digit OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                                    maxLength={6}
                                    placeholder="000000"
                                    disabled={expiryTimer <= 0}
                                    className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-bold tracking-widest
                                                focus:outline-none focus:ring-2 focus:ring-purple-600
                                                ${expiryTimer <= 0 ? 'border-red-300 bg-red-50 cursor-not-allowed' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="text-center mb-4">
                                {expiryTimer <= 0 ? (
                                    <p className="text-sm text-red-600 font-medium">OTP expired. Go back and request a new one.</p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        OTP valid for: <span className="font-semibold text-gray-700">{formatTime(expiryTimer)}</span>
                                    </p>
                                )}
                                {expiryTimer > 0 && (
                                    <div className="mt-1">
                                        {timer > 0 ? (
                                            <p className="text-xs text-gray-400">
                                                Resend in <span className="font-semibold text-purple-600">{formatTime(timer)}</span>
                                            </p>
                                        ) : (
                                            <button onClick={handleResendOTP} disabled={loading}
                                                className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50">
                                                {loading ? 'Sending...' : 'Resend OTP'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-5">
                                <p className="text-xs text-yellow-800 text-center">
                                    ⚠️ You will be logged out after changing your password.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={goBack}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                    Back
                                </button>
                                <button onClick={handleVerify} disabled={loading || otp.length !== 6 || expiryTimer <= 0}
                                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50">
                                    {loading ? 'Verifying...' : 'Verify & Change'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
