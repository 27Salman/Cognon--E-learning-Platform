import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { User, ShoppingBag, ShoppingCart, Heart, Award, LogOut, LayoutDashboard, Wallet } from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import ConfirmModal from '../common/ConfirmModal';


const isValidImageSrc = (src) => !!src;

const getAvatarColors = (name) => {
    const palettes = [
        ['#7c3aed', '#a855f7'],
        ['#2563eb', '#60a5fa'],
        ['#059669', '#34d399'],
        ['#d97706', '#fbbf24'],
        ['#dc2626', '#f87171'],
        ['#0891b2', '#22d3ee'],
        ['#7c3aed', '#ec4899'],
        ['#ea580c', '#fb923c'],
    ];
    if (!name) return palettes[0];
    return palettes[name.charCodeAt(0) % palettes.length];
};

const menuItems = [
    { name: 'Dashboard',    path: ROUTES.STUDENT_DASHBOARD,       icon: LayoutDashboard },
    { name: 'Profile',      path: ROUTES.STUDENT_PROFILE,         icon: User },
    { name: 'My Courses',   path: ROUTES.STUDENT_MY_COURSES,      icon: ShoppingBag },
    { name: 'My Orders',    path: ROUTES.STUDENT_ORDERS,          icon: ShoppingCart },
    { name: 'Wallet',       path: ROUTES.STUDENT_WALLET,          icon: Wallet },
    { name: 'Wishlist',     path: ROUTES.STUDENT_WISHLIST,        icon: Heart },
    { name: 'Certificates', path: '/student/certificates',        icon: Award },
];

export default function StudentSidebar({ studentInfo }) {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const isActive = (path) => {
        if (location.pathname === path) return true;
        if (location.pathname.startsWith(path + '/')) return true;
        if (path === ROUTES.STUDENT_MY_COURSES && location.pathname.includes('/student/courses/') && location.pathname.endsWith('/lessons')) return true;
        return false;
    };

    const handleLogout = async () => {
        setShowLogoutModal(false);
        localStorage.removeItem('studentInfo');
        await dispatch(logoutUser());
        toast.success('Logged out successfully');
        navigate(ROUTES.LOGIN, { replace: true });
    };

    return (
        <aside className="bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">

            {/* Avatar + Name */}
            <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
                {isValidImageSrc(studentInfo?.profileImageURL || studentInfo?.profileImage) ? (
                    <img
                        src={studentInfo?.profileImageURL || studentInfo?.profileImage}
                        alt="Student"
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                    />
                ) : (
                    (() => {
                        const [from, to] = getAvatarColors(studentInfo?.name);
                        return (
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm border-2 border-white select-none"
                                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                            >
                                <span className="text-white font-bold text-2xl">
                                    {studentInfo?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </span>
                            </div>
                        );
                    })()
                )}
                <p className="mt-2 font-semibold text-gray-800 text-sm text-center">
                    {studentInfo?.name || 'Student'}
                </p>
            </div>

            {/* Nav items */}
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
