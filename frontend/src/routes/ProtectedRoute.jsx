import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser } from "../store/slices/authSlice";
import Loader from "../components/common/Loader";
import { ROUTES } from "../utils/constants";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith("/admin")
      ? ROUTES.LOGIN_ADMIN
      : ROUTES.LOGIN;
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!user) {
    return <Loader fullScreen />;
  }

  return children;
};

export default ProtectedRoute;
