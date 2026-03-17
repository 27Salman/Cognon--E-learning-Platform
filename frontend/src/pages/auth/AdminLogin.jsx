import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';
import { ROLES, ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);

  // ALL hooks must be declared before any early return
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  // Redirect already-authenticated users — to original destination or their dashboard
  if (isAuthenticated && user) {
    const dashboard =
      user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD :
      user.role === ROLES.TUTOR ? ROUTES.TUTOR_DASHBOARD :
      ROUTES.STUDENT_DASHBOARD;
    const from = location.state?.from?.pathname || dashboard;
    return <Navigate to={from} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
    if (!formData.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    const resultAction = await dispatch(loginUser({
      email: formData.email,
      password: formData.password,
      role: ROLES.ADMIN,
    }));

    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Admin login successful!');
      // Navigation handled by the isAuthenticated guard above
    } else {
      toast.error(resultAction.payload || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-gray-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8">
            <svg className="w-64 h-64 mx-auto" viewBox="0 0 400 400" fill="none">
              <circle cx="200" cy="100" r="50" fill="white" opacity="0.9" />
              <rect x="150" y="170" width="100" height="120" rx="8" fill="white" opacity="0.9" />
              <rect x="160" cy="240" width="80" height="60" rx="5" fill="#6d28d9" opacity="0.8" />
              <path d="M 170 200 L 230 200 L 230 220 L 170 220 Z" fill="#6d28d9" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">COGNON ADMIN</h1>
          <p className="text-xl opacity-90">Secure Administrative Access</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cognon</h1>
            <p className="text-sm text-gray-600 mt-1">Admin Portal</p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cognon..!</h2>
            <div className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mt-2">
              Admin Access Only
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Link to="/admin/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
              Login
            </Button>
          </form>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              This is a restricted area. Unauthorized access attempts will be logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
