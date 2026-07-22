import { useState, useEffect, useRef } from "react";
import { tutorAPI } from "../../api/tutorAPI";
import { Mail, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { validateEmail } from "../../utils/helpers";

export default function ChangeEmailModal({ currentEmail, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    expiryRef.current = setInterval(() => {
      setExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(expiryRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      clearInterval(expiryRef.current);
    },
    [],
  );

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const validateNewEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return "Email is required";
    if (!validateEmail(trimmed)) return "Invalid email format";
    if (trimmed.toLowerCase() === currentEmail?.toLowerCase())
      return "This email is already in use";
    return "";
  };

  const handleSendOTP = async () => {
    const trimmed = newEmail.trim();
    const err = validateNewEmail(trimmed);
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await tutorAPI.requestEmailChange(trimmed);
      setStep(2);
      startTimer();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to send OTP. Please try again.";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("use")
      ) {
        setEmailError("This email is already in use");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setLoading(true);
    setError("");
    try {
      await tutorAPI.requestEmailChange(newEmail.trim());
      startTimer();
      setOtp("");
      toast.success("New OTP sent!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await tutorAPI.verifyEmailChange(newEmail.trim(), otp);
      toast.success("Email changed successfully!");
      onSuccess(newEmail.trim());
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Change Email Address
              </h2>
              <p className="text-sm text-gray-500">
                {step === 1 ? "Enter your new email" : "Verify your new email"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-not-allowed text-gray-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailError("");
                    setError("");
                  }}
                  placeholder="Enter your new email address"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${emailError ? "border-red-500" : "border-gray-300"}`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-700">
                    We'll send a verification code to your new email address to
                    confirm the change.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-1">Verification code sent to:</p>
                <p className="font-semibold text-gray-900">{newEmail}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  maxLength={6}
                  placeholder="000000"
                  disabled={expiryTimer <= 0}
                  className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-600 ${expiryTimer <= 0 ? "border-red-300 bg-red-50 cursor-not-allowed" : "border-gray-300"}`}
                />
              </div>

              {/* Timer */}
              <div className="text-center mb-4">
                {expiryTimer <= 0 ? (
                  <p className="text-sm text-red-600 font-medium">
                    OTP expired! Please go back and request a new one.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    OTP valid for:{" "}
                    <span className="font-semibold text-gray-700">
                      {formatTime(expiryTimer)}
                    </span>
                  </p>
                )}
                {expiryTimer > 0 && (
                  <div className="mt-1">
                    {timer > 0 ? (
                      <p className="text-xs text-gray-400">
                        Resend available in{" "}
                        <span className="font-semibold text-purple-600">
                          {formatTime(timer)}
                        </span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                      >
                        {loading ? "Sending..." : "Resend OTP"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                    clearInterval(timerRef.current);
                    clearInterval(expiryRef.current);
                    setTimer(0);
                    setExpiryTimer(0);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6 || expiryTimer <= 0}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify & Update"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
