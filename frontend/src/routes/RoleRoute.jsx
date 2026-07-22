import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../components/common/Loader";
import { ROUTES } from "../utils/constants";

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

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

  return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
};

export default RoleRoute;
