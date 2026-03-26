import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthFromStorage, logoutUser } from './store/slices/authSlice';
import { STORAGE_KEYS } from './utils/constants';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminForgotPassword from './pages/auth/AdminForgotPassword';
import AdminResetPassword from './pages/auth/AdminResetPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';
import StudentDashboard from './pages/student/StudentDashboard';
//import TutorDashboard from './pages/tutor/TutorDashboard';
import AdminLayout from './components/layouts/AdminLayout';
import TutorLayout from './components/layouts/TutorLayout';
import StudentLayout from './components/layouts/StudentLayout';
import { ROUTES, ROLES } from './utils/constants';
import NotFound from './pages/NotFound';
import VerifyOTP from './pages/auth/VerifyOTP';



function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setAuthFromStorage());

    const handleStorageEvent = (e) => {
      if (e.key === STORAGE_KEYS.LOGOUT_SIGNAL) {
        dispatch(logoutUser());
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path="/tutor/login" element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />
      <Route path="/tutor/register" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />


      {/* Protected Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="profile" element={<></>} />
      </Route>

      {/* Protected Tutor Routes */}
      <Route
        path="/tutor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.TUTOR]}>
              <TutorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tutor/profile" replace />} />
        <Route path="profile" element={<></>} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<></>} />
        <Route path="profile" element={<></>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
