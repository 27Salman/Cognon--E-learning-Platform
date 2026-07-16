import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/common/Input';
import Logo from '../../components/common/Logo';
import { validateEmail } from '../../utils/helpers';
import { ROLES, ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth);
  const submitBtnRef = useRef(null);

  const initialRole = location.pathname === ROUTES.LOGIN_TUTOR ? ROLES.TUTOR : ROLES.STUDENT;
  const [activeRole, setActiveRole] = useState(initialRole);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  if (isAuthenticated && user) {
    const dashboard =
      user.role === ROLES.TUTOR ? ROUTES.TUTOR_DASHBOARD
      : user.role === ROLES.ADMIN ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.STUDENT_DASHBOARD;
    const from = location.state?.from?.pathname || dashboard;
    return <Navigate to={from} replace />;
  }

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setFormData({ email: '', password: '' });
    setFormErrors({});
    navigate(role === ROLES.TUTOR ? ROUTES.LOGIN_TUTOR : ROUTES.LOGIN, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(formData.email.trim())) errors.email = 'Invalid email format';
    if (!formData.password) errors.password = 'Password is required';
    else if (/\s/.test(formData.password)) errors.password = 'Password must not contain spaces';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    const resultAction = await dispatch(loginUser({
      email: formData.email.trim(),
      password: formData.password,
      role: activeRole,
    }));

    if(loginUser.fulfilled.match(resultAction)){
      toast.success('Login successful')
    }else{
      toast.error(resultAction.payload || 'Login Failed');
    }
  };

  const roleContent = {
    [ROLES.STUDENT]: {
      image: '/assets/figma/student-login.jpg',
    },
    [ROLES.TUTOR]: {
      image: '/assets/figma/tutor-login.avif',
    },
  };

  const currentContent = roleContent[activeRole];

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8 relative transition-all duration-500">
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <Logo size={60} />
          <h1 className="text-3xl font-bold text-primary-600">Cognon</h1>
        </div>
        <div className="w-full max-w-2xl xl:max-w-3xl px-8">
          <img src={currentContent.image} alt="Login graphic" className="w-full h-auto object-contain transition-all duration-500" />
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white h-screen overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <Logo size={60} />
            <h1 className="text-2xl font-bold text-primary-600">Cognon</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome to Cognon..!</h2>
            <p className="text-sm text-gray-600">Cognon provides a smart platform for learning, growing, and achieving your goals faster.</p>
          </div>

          {/* Role Tabs */}
          <div className="flex mb-6 bg-gray-200 rounded-lg p-1 text-sm">
            <button type="button" onClick={() => handleRoleChange(ROLES.STUDENT)}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all ${activeRole === ROLES.STUDENT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              STUDENT
            </button>
            <button type="button" onClick={() => handleRoleChange(ROLES.TUTOR)}
              className={`flex-1 py-2 px-3 rounded-md font-medium transition-all ${activeRole === ROLES.TUTOR ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              TUTOR
            </button>
          </div>

          <div className="mb-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
              Logging in as {activeRole === ROLES.STUDENT ? 'Student' : 'Tutor'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="Enter your email"
              error={formErrors.email} required />

            <Input label="Password" type="password" name="password" value={formData.password}
              onChange={handleChange} placeholder="Enter your Password"
              error={formErrors.password} required />

            {/* Forgot Password — always same style */}
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot Password?
              </Link>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">Sign up for free!</Link>
          </p>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Sign in with</span>
              </div>
            </div>
            <button type="button"
              onClick={() => {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                window.location.href = `${API_URL}/auth/google?role=${activeRole}`;
              }}
              className={`mt-4 w-full flex items-center justify-center px-4 py-2.5 text-sm border rounded-lg font-medium transition-colors border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
