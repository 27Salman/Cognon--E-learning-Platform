import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { validateEmail } from "../../utils/helpers";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { ROUTES } from "../../utils/constants";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(trimmed)) {
      setEmailError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password reset OTP sent to your email!");
        navigate(ROUTES.RESET_PASSWORD, {
          state: { email: trimmed, timestamp: Date.now() },
          replace: true,
        });
      } else {
        toast.error(data.message || "Failed to send reset OTP");
      }
    } catch (error) {
      toast.error("Failed to send reset OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-100 to-primary-200 items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-8">
            <svg
              className="w-80 h-80 mx-auto"
              viewBox="0 0 600 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="100" cy="100" r="40" fill="#93C5FD" opacity="0.5" />
              <circle cx="500" cy="150" r="60" fill="#7DD3FC" opacity="0.5" />
              <circle cx="150" cy="500" r="50" fill="#C4B5FD" opacity="0.5" />

              <ellipse cx="350" cy="200" rx="80" ry="60" fill="#FCA5A5" />
              <rect
                x="270"
                y="280"
                width="160"
                height="200"
                rx="20"
                fill="#FCA5A5"
              />

              <rect
                x="150"
                y="200"
                width="140"
                height="180"
                rx="8"
                fill="white"
                stroke="#6d28d9"
                strokeWidth="3"
              />
              <circle
                cx="180"
                cy="240"
                r="12"
                fill="white"
                stroke="#6d28d9"
                strokeWidth="2"
              />
              <path
                d="M 175 240 L 180 245 L 190 230"
                stroke="#6d28d9"
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="210"
                y1="240"
                x2="270"
                y2="240"
                stroke="#D1D5DB"
                strokeWidth="2"
              />

              <circle
                cx="180"
                cy="290"
                r="12"
                fill="white"
                stroke="#6d28d9"
                strokeWidth="2"
              />
              <path
                d="M 175 290 L 180 295 L 190 280"
                stroke="#6d28d9"
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="210"
                y1="290"
                x2="270"
                y2="290"
                stroke="#D1D5DB"
                strokeWidth="2"
              />

              <circle
                cx="180"
                cy="340"
                r="12"
                fill="white"
                stroke="#6d28d9"
                strokeWidth="2"
              />
              <line
                x1="210"
                y1="340"
                x2="270"
                y2="340"
                stroke="#D1D5DB"
                strokeWidth="2"
              />

              <rect
                x="370"
                y="420"
                width="120"
                height="100"
                rx="8"
                fill="#FCD34D"
              />
              <line
                x1="430"
                y1="420"
                x2="430"
                y2="520"
                stroke="#92400E"
                strokeWidth="3"
              />
              <line
                x1="370"
                y1="470"
                x2="490"
                y2="470"
                stroke="#92400E"
                strokeWidth="3"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Your Password?
          </h1>
          <p className="text-lg text-gray-600">
            No worries! We'll help you reset it.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Reset Your Password
            </h2>
            <p className="text-gray-600">
              Forgot your password? No worries, then let's submit password
              reset. It will be send to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="elementary221b@gmail.com"
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
              to="/login"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <FiArrowLeft className="mr-2" />
              Back to login screen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
