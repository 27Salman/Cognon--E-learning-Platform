import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthFromStorage } from './store/slices/authSlice';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminForgotPassword from './pages/auth/AdminForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';
import StudentDashboard from './pages/student/StudentDashboard';
import TutorDashboard from './pages/tutor/TutorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ROUTES, ROLES } from './utils/constants';
import VerifyOTP from './pages/auth/VerifyOTP';


function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setAuthFromStorage());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />


      {/* Protected Student Routes */}
      <Route
        path={ROUTES.STUDENT_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT_COURSES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <div className="p-8">Student Courses - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT_PROFILE}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <div className="p-8">Student Profile - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected Tutor Routes */}
      <Route
        path={ROUTES.TUTOR_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.TUTOR]}>
              <TutorDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TUTOR_COURSES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.TUTOR]}>
              <div className="p-8">Tutor Courses - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TUTOR_PROFILE}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.TUTOR]}>
              <div className="p-8">Tutor Profile - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.TUTOR_REVENUES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.TUTOR]}>
              <div className="p-8">Tutor Revenues - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path={ROUTES.ADMIN_DASHBOARD}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_USERS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <div className="p-8">Admin Users - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_COURSES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <div className="p-8">Admin Courses - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_CATEGORIES}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <div className="p-8">Admin Categories - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_TUTORS}
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <div className="p-8">Admin Tutors - Coming Soon</div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
