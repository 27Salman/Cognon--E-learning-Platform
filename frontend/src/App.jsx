import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuthFromStorage } from "./store/slices/authSlice";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminLogin from "./pages/auth/AdminLogin";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminForgotPassword from "./pages/auth/AdminForgotPassword";
import AdminResetPassword from "./pages/auth/AdminResetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import GoogleAuthSuccess from "./pages/auth/GoogleAuthSuccess";
import StudentDashboard from "./pages/student/StudentDashboard";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminProfile from "./pages/admin/AdminProfile";
import TutorManagement from "./pages/admin/TutorManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import TutorLayout from "./components/layouts/TutorLayout";
import TutorProfile from "./pages/tutor/TutorProfile";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentLayout from "./components/layouts/StudentLayout";
import StudentProfile from "./pages/student/StudentProfile";
import { ROUTES, ROLES } from "./utils/constants";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import VerifyOTP from "./pages/auth/VerifyOTP";
import TutorCourses from "./pages/tutor/TutorCourses";
import CreateCourse from "./pages/tutor/CreateCourse";
import EditCourse from "./pages/tutor/EditCourse";
import TutorCourseDetail from "./pages/tutor/TutorCourseDetail";
import TutorChat from "./pages/tutor/TutorChat";

import CourseDetails from "./pages/student/CourseDetails";
import MyCourses from "./pages/student/MyCourses";
import CourseLessons from "./pages/student/CourseLessons";
import LessonViewer from "./pages/student/LessonViewer";
import CategoryPage from "./pages/student/CategoryPage";
import CategoryManagement from "./pages/admin/CategoryManagement";
import CourseManagement from "./pages/admin/CourseManagement";
import OrderList from "./pages/admin/OrderList";
import OrderDetail from "./pages/admin/OrderDetail";
import Wishlist from "./pages/student/Wishlist";
import Cart from "./pages/student/Cart";
import Checkout from "./pages/student/Checkout";
import OrderSuccess from "./pages/student/OrderSuccess";
import StudentOrderList from "./pages/student/StudentOrderList";
import StudentOrderDetail from "./pages/student/StudentOrderDetail";
import TutorRevenue from "./pages/tutor/TutorRevenue";
import AdminCoupons from "./pages/admin/AdminCoupons";
import TutorWallet from "./pages/tutor/TutorWallet";
import AdminWallet from "./pages/admin/AdminWallet";
import StudentWallet from "./pages/student/StudentWallet";
import Loader from "./components/common/Loader";
import QuizBuilder from "./pages/tutor/QuizBuilder";
import QuizAttempt from "./pages/student/QuizAttempt";
import Certificates from "./pages/student/Certificates";
import VerifyCertificate from "./pages/VerifyCertificate";
import TutorList from "./pages/student/TutorList";
import TutorProfileView from "./pages/student/TutorProfileView";
import StudentChat from "./pages/student/StudentChat";
import ScrollToTop from "./components/common/ScrollToTop";

function App() {
  const dispatch = useDispatch();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    dispatch(setAuthFromStorage());
  }, [dispatch]);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  return (
    <>
      <ScrollToTop />
      <Loader onComplete={handleLoaderComplete} />
      {!showLoader && (
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          <Route path={ROUTES.LOGIN_TUTOR} element={<Login />} />
          <Route path={ROUTES.TUTOR_SIGNUP} element={<Signup />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.LOGIN_ADMIN} element={<AdminLogin />} />
          <Route
            path={ROUTES.ADMIN_FORGOT_PASSWORD}
            element={<AdminForgotPassword />}
          />
          <Route
            path={ROUTES.ADMIN_RESET_PASSWORD}
            element={<AdminResetPassword />}
          />
          <Route path={ROUTES.VERIFY_OTP} element={<VerifyOTP />} />
          <Route
            path={ROUTES.GOOGLE_AUTH_SUCCESS}
            element={<GoogleAuthSuccess />}
          />

          {/* Protected Student Routes */}
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
            <Route
              index
              element={<Navigate to={ROUTES.STUDENT_DASHBOARD} replace />}
            />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route
              path="courses/:courseId/lessons"
              element={<CourseLessons />}
            />
            <Route
              path="courses/:courseId/quiz/:quizId"
              element={<QuizAttempt />}
            />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="wallet" element={<StudentWallet />} />
            <Route path="orders" element={<StudentOrderList />} />
            <Route path="orders/:id" element={<StudentOrderDetail />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="chat" element={<StudentChat />} />
          </Route>

          {/* Public student-facing pages — no login required */}

          <Route path={ROUTES.STUDENT_CATEGORIES} element={<CategoryPage />} />
          <Route
            path={ROUTES.STUDENT_COURSE_DETAIL}
            element={<CourseDetails />}
          />
          <Route path={ROUTES.STUDENT_TUTORS} element={<TutorList />} />
          <Route
            path={ROUTES.STUDENT_TUTOR_DETAIL}
            element={<TutorProfileView />}
          />
          <Route
            path={ROUTES.STUDENT_LESSON_VIEWER}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                  <LessonViewer />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.STUDENT_CART}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                  <Cart />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.STUDENT_CHECKOUT}
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.STUDENT]}>
                  <Checkout />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.STUDENT_ORDER_SUCCESS}
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
            <Route
              index
              element={<Navigate to={ROUTES.TUTOR_DASHBOARD} replace />}
            />
            <Route path="dashboard" element={<TutorDashboard />} />
            <Route path="profile" element={<TutorProfile />} />
            <Route path="courses" element={<TutorCourses />} />
            <Route path="courses/new" element={<CreateCourse />} />
            <Route path="courses/:id" element={<TutorCourseDetail />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />
            <Route path="revenue" element={<TutorRevenue />} />
            <Route path="wallet" element={<TutorWallet />} />
            <Route path="chat" element={<TutorChat />} />
            <Route path="courses/:id/quiz" element={<QuizBuilder />} />
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
            <Route
              index
              element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />}
            />
            <Route path="dashboard" element={<AdminDashboard />} />
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
          <Route
            path="/verify/:certificateNumber"
            element={<VerifyCertificate />}
          />
          <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </>
  );
}

export default App;
