import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../utils/constants';
import Loader from '../components/common/Loader';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Still resolving user — don't redirect yet
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (user && allowedRoles.includes(user.role)) {
    return children;
  }

  // Wrong role — redirect to their own dashboard
  return <Navigate to={getOwnDashboard(user?.role)} replace />;
};

const getOwnDashboard = (role) => {
  switch (role) {
    case 'admin':   return ROUTES.ADMIN_DASHBOARD;
    case 'tutor':   return ROUTES.TUTOR_DASHBOARD;
    case 'student': return ROUTES.STUDENT_DASHBOARD;
    default:        return ROUTES.LOGIN;
  }
};

export default RoleRoute;
