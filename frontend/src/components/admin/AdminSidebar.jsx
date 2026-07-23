import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/slices/authSlice";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  User,
  Tag,
  GraduationCap,
  BookOpen,
  ShoppingCart,
  LogOut,
  Users,
  Ticket,
  Wallet,
  X,
} from "lucide-react";
import { ROUTES } from "../../utils/constants";
import ConfirmModal from "../common/ConfirmModal";
import { useState } from "react";

const menuItems = [
  { name: "Dashboard", path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { name: "Profile", path: ROUTES.ADMIN_PROFILE, icon: User },
  { name: "Categories", path: ROUTES.ADMIN_CATEGORIES, icon: Tag },
  { name: "Courses", path: ROUTES.ADMIN_COURSES, icon: BookOpen },
  { name: "Students", path: ROUTES.ADMIN_STUDENTS, icon: GraduationCap },
  { name: "Tutors", path: ROUTES.ADMIN_TUTORS, icon: Users },
  { name: "Orders", path: ROUTES.ADMIN_ORDERS, icon: ShoppingCart },
  { name: "Coupons", path: ROUTES.ADMIN_COUPONS, icon: Ticket },
  { name: "Wallet", path: ROUTES.ADMIN_WALLET, icon: Wallet },
];

export default function AdminSidebar({ adminInfo, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    if (onClose) onClose();
    await dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN_ADMIN, { replace: true });
  };

  const displayName = user?.name || adminInfo?.name || "Admin";
  const profileImage =
    adminInfo?.profileImageURL || adminInfo?.profileImage || null;

  const sidebarContent = (
    <>
      <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
        {profileImage ? (
          <img
            src={profileImage}
            alt="Admin"
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm border-2 border-purple-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="mt-2 font-semibold text-gray-800 text-sm text-center">
          {displayName}
        </p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => handleNav(path)}
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
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-64 max-w-xs bg-white min-h-full flex flex-col z-50 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-bold text-gray-800 text-sm">Admin Navigation</span>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={handleLogout}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}
