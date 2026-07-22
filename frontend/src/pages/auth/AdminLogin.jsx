import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../store/slices/authSlice";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Logo from "../../components/common/Logo";
import { validateEmail } from "../../utils/helpers";
import { ROLES, ROUTES } from "../../utils/constants";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  if (isAuthenticated && user) {
    const dashboard =
      user.role === ROLES.ADMIN
        ? ROUTES.ADMIN_DASHBOARD
        : user.role === ROLES.TUTOR
          ? ROUTES.TUTOR_DASHBOARD
          : ROUTES.STUDENT_DASHBOARD;
    const from = location.state?.from?.pathname || dashboard;
    return <Navigate to={from} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: "" });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!validateEmail(formData.email))
      errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const resultAction = await dispatch(
      loginUser({
        email: formData.email,
        password: formData.password,
        role: ROLES.ADMIN,
      }),
    );

    if (loginUser.fulfilled.match(resultAction)) {
      toast.success("Admin login successful!");
    } else {
      toast.error(resultAction.payload || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8 relative">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <Logo size={60} />
          <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
        </div>
        <div className="w-full max-w-2xl xl:max-w-3xl px-8">
          <img
            src="/assets/figma/admin-login.jpg"
            alt="Admin Login graphic"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white h-screen overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <h1 className="text-2xl font-bold text-gray-900">Cognon</h1>
            </div>
            <p className="text-xs text-gray-600">Admin Portal</p>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome to Cognon..!
            </h2>
            <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium mt-1">
              Admin Access Only
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={formErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              error={formErrors.password}
              required
            />
            <div className="flex justify-end">
              <Link
                to="/admin/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Login
            </Button>
          </form>

          <div className="mt-8 p-4 bg-red-50 border-l-4 border-red-600 rounded-r-md shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">
                  Restricted Access
                </h3>
                <div className="mt-1 text-xs text-red-700">
                  <p>
                    This system is for authorized administrative personnel only.
                    All access attempts and activities are strictly monitored
                    and logged.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
