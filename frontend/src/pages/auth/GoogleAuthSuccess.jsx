import { useEffect, useRef } from 'react';
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
  const hasRun = useRef(false); 

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(decodeURIComponent(error));
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!token) {
      navigate(ROUTES.LOGIN);
      return;
    }

    const fetchUser = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (response.ok && data.user) {
          dispatch(setCredentials({ token, user: data.user }));
          toast.success('Google authentication successful!');

          if (data.user.role === 'student') navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
          else if (data.user.role === 'tutor') navigate(ROUTES.TUTOR_DASHBOARD, { replace: true });
          else if (data.user.role === 'admin') navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
          else navigate(ROUTES.HOME, { replace: true });
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (err) {
        console.error('Google auth error:', err);
        toast.error('Authentication failed');
        navigate(ROUTES.LOGIN);
      }
    };

    fetchUser();
  }, []); 

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
