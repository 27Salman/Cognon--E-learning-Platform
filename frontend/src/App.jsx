import { useEffect } from 'react';
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
import AdminResetPassword from './pages/auth/AdminResetPassword';
import ResetPassword from './pages/auth/ResetPassword';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminLayout from './components/layouts/AdminLayout';
import AdminProfile from './pages/admin/AdminProfile';
import TutorManagement from './pages/admin/TutorManagement';
import StudentManagement from './pages/admin/StudentManagement';
import TutorLayout from './components/layouts/TutorLayout';
import TutorProfile from './pages/tutor/TutorProfile';
import TutorDashboard from './pages/tutor/TutorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentLayout from './components/layouts/StudentLayout';
import StudentProfile from './pages/student/StudentProfile';
import { ROUTES, ROLES } from './utils/constants';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import VerifyOTP from './pages/auth/VerifyOTP';
import TutorCourses from './pages/tutor/TutorCourses';
import CreateCourse from './pages/tutor/CreateCourse';
import EditCourse from './pages/tutor/EditCourse';
import TutorCourseDetail from './pages/tutor/TutorCourseDetail';
import TutorChat from './pages/tutor/TutorChat';
import CourseCatalog from './pages/student/CourseCatalog';
import CourseDetails from './pages/student/CourseDetails';
import MyCourses from './pages/student/MyCourses';
import CourseLessons from './pages/student/CourseLessons';
import LessonViewer from './pages/student/LessonViewer';
import CategoryPage from './pages/student/CategoryPage';
import CategoryManagement from './pages/admin/CategoryManagement';
import CourseManagement from './pages/admin/CourseManagement';
import OrderList from './pages/admin/OrderList';
import OrderDetail from './pages/admin/OrderDetail';
import Wishlist from './pages/student/Wishlist';
import Cart from './pages/student/Cart';
import Checkout from './pages/student/Checkout';
import OrderSuccess from './pages/student/OrderSuccess';
import StudentOrderList from './pages/student/StudentOrderList';
import StudentOrderDetail from './pages/student/StudentOrderDetail';
import TutorRevenue from './pages/tutor/TutorRevenue';
import AdminCoupons from './pages/admin/AdminCoupons';
import TutorWallet from './pages/tutor/TutorWallet';
import AdminWallet from './pages/admin/AdminWallet';


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
        <Route path="profile" element={<StudentProfile />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route path="courses/:courseId/lessons" element={<CourseLessons />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="orders" element={<StudentOrderList />} />
        <Route path="orders/:id" element={<StudentOrderDetail />} />
      </Route>

      {/* Student Course Catalog - standalone full page */}
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <CourseCatalog />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/categories"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <CategoryPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <CourseDetails />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId/learn"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <LessonViewer />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/cart"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <Cart />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/checkout"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
              <Checkout />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/order-success"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                <OrderSuccess />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

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
        <Route index element={<Navigate to="/tutor/dashboard" replace />} />
        <Route path="dashboard" element={<TutorDashboard />} />
        <Route path="profile" element={<TutorProfile />} />
        <Route path="courses" element={<TutorCourses />} />
        <Route path="courses/new" element={<CreateCourse />} />
        <Route path="courses/:id" element={<TutorCourseDetail />} />
        <Route path="courses/:id/edit" element={<EditCourse />} />
        <Route path="revenue" element={<TutorRevenue />} />
        <Route path="wallet" element={<TutorWallet />} />
        <Route path="chat" element={<TutorChat />} />

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
        <Route path="dashboard" element={<AdminDashboard/>} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="tutors" element={<TutorManagement />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="wallet" element={<AdminWallet />} />

      </Route>

      {/* Fallback */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
