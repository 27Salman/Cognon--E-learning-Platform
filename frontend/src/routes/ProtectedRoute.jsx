import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../store/slices/authSlice';
import Loader from '../components/common/Loader';
import { ROUTES } from '../utils/constants';

/**
 * Protected Route Component
 * Prevents unauthenticated users from accessing protected pages
 * 
 * @param {ReactNode} children - Component to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Fetch current user on mount if token exists but user data is missing
  useEffect(() => {
    if (isAuthenticated && !user && !loading) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, loading, dispatch]);

  // Show loader while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Verifying authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
