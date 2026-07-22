import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { validatePassword } from "../../utils/helpers";
import { ROUTES } from "../../utils/constants";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [step, setStep] = useState("otp");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    expiryIntervalRef.current = setInterval(() => {
      setExpiryTimer((prev) => {
        if (prev <= 1) {
          clearInterval(expiryIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.FORGOT_PASSWORD);
      return;
    }
    startTimers();
    return () => {
      clearInterval(resendIntervalRef.current);
      clearInterval(expiryIntervalRef.current);
    };
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }
    if (expiryTimer <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetToken(data.resetToken);
        setStep("password");
        toast.success("OTP verified! Now set your new password.");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (/\s/.test(newPassword)) {
      toast.error("Password must not contain spaces");
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error(
        "Min 8 chars, must include uppercase, lowercase, number & special character (@$!%*?&)",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          navigate(ROUTES.LOGIN, { replace: true });
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        toast.success("New OTP sent to your email!");
        startTimers();
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isOtpExpired = expiryTimer <= 0;
  const canResend = resendTimer <= 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {step === "otp" ? "Verify OTP" : "Set New Password"}
          </h2>
          <p className="text-gray-600">
            {step === "otp"
              ? `We've sent a 6-digit code to ${email}`
              : "Enter your new password below"}
          </p>
        </div>

        {step === "otp" ? (
          <form
            onSubmit={handleVerifyOtp}
            className="bg-white p-8 rounded-lg shadow-md"
          >
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
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                    isOtpExpired
                      ? "border-red-300 bg-red-50 cursor-not-allowed"
                      : "border-gray-300 focus:border-primary-500"
                  }`}
                  autoFocus={index === 0}
                  disabled={isOtpExpired}
                />
              ))}
            </div>

            <div className="text-center mb-6">
              {isOtpExpired ? (
                <p className="text-red-600 font-medium">OTP expired!</p>
              ) : (
                <p className="text-gray-500 text-sm">
                  OTP valid for:{" "}
                  <span className="font-semibold text-gray-700">
                    {formatTime(expiryTimer)}
                  </span>
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

            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-2">Didn't receive the code?</p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Resend OTP"}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend available in{" "}
                  <span className="font-semibold text-primary-600">
                    {formatTime(resendTimer)}
                  </span>
                </p>
              )}
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleResetPassword}
            className="bg-white p-8 rounded-lg shadow-md space-y-6"
          >
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
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
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            <FiArrowLeft className="mr-2" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
