import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../utils/constants';

/**
 * Role-Based Route Component
 * Restricts access based on user role
 * 
 * @param {ReactNode} children - Component to render if role matches
 * @param {Array<string>} allowedRoles - Array of allowed roles ['admin', 'tutor', 'student']
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user's role is in allowed roles
  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = getRedirectPath(user?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

/**
 * Helper function to get redirect path based on role
 */
const getRedirectPath = (role) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_DASHBOARD;
    case 'tutor':
      return ROUTES.TUTOR_DASHBOARD;
    case 'student':
      return ROUTES.STUDENT_DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
};

export default RoleRoute;
