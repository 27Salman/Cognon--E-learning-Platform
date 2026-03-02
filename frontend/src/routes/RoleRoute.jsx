import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../utils/constants';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    const redirectPath = getRedirectPath(user?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};


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
