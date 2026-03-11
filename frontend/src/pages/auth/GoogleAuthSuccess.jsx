import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../utils/constants';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed');
      navigate(ROUTES.LOGIN);
      return;
    }

    if (token) {
      // Fetch user data with token
      const fetchUser = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.user) {
            // Store token and user in Redux
            dispatch(setCredentials({ token, user: data.user }));
            
            // Store in localStorage
            localStorage.setItem('cognon_token', token);
            localStorage.setItem('cognon_user', JSON.stringify(data.user));

            toast.success('Login successful!');

            // Redirect based on role
            if (data.user.role === 'student') {
              navigate(ROUTES.STUDENT_DASHBOARD);
            } else if (data.user.role === 'tutor') {
              navigate(ROUTES.TUTOR_DASHBOARD);
            } else if (data.user.role === 'admin') {
              navigate(ROUTES.ADMIN_DASHBOARD);
            } else {
              navigate(ROUTES.HOME);
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Google auth error:', error);
          toast.error('Authentication failed');
          navigate(ROUTES.LOGIN);
        }
      };

      fetchUser();
    } else {
      navigate(ROUTES.LOGIN);
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
