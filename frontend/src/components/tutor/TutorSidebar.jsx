import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { logoutUser } from "../../store/slices/authSlice";
import toast from "react-hot-toast";
import {
  BarChart3,
  User,
  BookOpen,
  TrendingUp,
  MessageSquare,
  LogOut,
  Wallet,
} from "lucide-react";
import { ROUTES } from "../../utils/constants";
import ConfirmModal from "../common/ConfirmModal";

const menuItems = [
  { name: "Dashboard", path: ROUTES.TUTOR_DASHBOARD, icon: BarChart3 },
  { name: "Profile", path: ROUTES.TUTOR_PROFILE, icon: User },
  { name: "Courses", path: ROUTES.TUTOR_COURSES, icon: BookOpen },
  { name: "Revenue", path: ROUTES.TUTOR_REVENUE, icon: TrendingUp },
  { name: "Wallet", path: ROUTES.TUTOR_WALLET, icon: Wallet },
  { name: "Chat & Video", path: ROUTES.TUTOR_CHAT, icon: MessageSquare },
];

export default function TutorSidebar({ tutorInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [imgError, setImgError] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    localStorage.removeItem("tutorInfo");
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const imageSrc = tutorInfo?.profileImageURL || tutorInfo?.profileImage;
  const showImage = imageSrc && !imgError;

  return (
    <aside className="bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">
      <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
        {showImage ? (
          <img
            src={imageSrc}
            alt="Tutor"
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm border-2 border-purple-200">
            {tutorInfo?.name?.charAt(0)?.toUpperCase() || "T"}
          </div>
        )}
        <p className="mt-2 font-semibold text-gray-800 text-sm text-center">
          {tutorInfo?.name || "Tutor"}
        </p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(path)
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {name}
          </button>
        ))}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </nav>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={handleLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </aside>
  );
}
