import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { User, BookOpen, ShoppingBag, ShoppingCart, Heart, Award, LogOut, LayoutDashboard } from 'lucide-react';

const isValidImageSrc = (src) => src && (src.startsWith('http') || src.startsWith('data:'));

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
    { name: 'Dashboard',     path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Profile',       path: '/student/profile',   icon: User },
    { name: 'My Courses',    path: '/student/courses',   icon: BookOpen },
    { name: 'My Orders',     path: '/student/orders',    icon: ShoppingBag },
    { name: 'Shopping Cart', path: '/student/cart',      icon: ShoppingCart },
    { name: 'Wishlist',      path: '/student/wishlist',  icon: Heart },
    { name: 'Certificates',  path: '/student/certificates', icon: Award },
];

export default function StudentSidebar({ studentInfo }) {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        dispatch(logoutUser());
        localStorage.removeItem('studentInfo');
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    return (
        <aside className="bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">

            {/* Avatar + Name */}
            <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
                {isValidImageSrc(studentInfo?.profileImage) ? (
                    <img
                        src={studentInfo.profileImage}
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
