import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, User, Tag, GraduationCap, BookOpen,
  ShoppingCart, Wallet, LogOut
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Profile',   path: '/admin/profile',   icon: User },
  { name: 'Categories',path: '/admin/categories',icon: Tag },
  { name: 'Students',  path: '/admin/students',  icon: GraduationCap },
  { name: 'Tutors',    path: '/admin/tutors',    icon: BookOpen },
  { name: 'Orders',    path: '/admin/orders',    icon: ShoppingCart },
  { name: 'Wallet',    path: '/admin/wallet',    icon: Wallet },
  { name: 'Courses',   path: '/admin/courses',   icon: BookOpen },
];
export default function AdminSidebar({ adminInfo }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/admin/login', { replace: true });
  };

  const displayName = user?.name || adminInfo?.name || 'Admin';
  const profileImage = adminInfo?.profileImage || null;

  return (
    <aside className="bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">

      {/* Profile top section */}
      <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
        {profileImage ? (
          <img src={profileImage} alt="Admin" className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm border-2 border-purple-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="mt-2 font-semibold text-gray-800 text-sm text-center">{displayName}</p>
      </div>

      {/* Nav items  */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(path)
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {name}
          </button>
        ))}

        {/* Logout — directly after Courses */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
