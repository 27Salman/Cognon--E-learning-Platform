import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { BarChart3, User, BookOpen, TrendingUp, MessageSquare, LogOut, Ticket } from 'lucide-react';

const menuItems = [
    { name: 'Dashboard',    path: '/tutor/dashboard', icon: BarChart3 },
    { name: 'Profile',      path: '/tutor/profile',   icon: User },
    { name: 'Courses',      path: '/tutor/courses',   icon: BookOpen },
    { name: 'Coupons',      path: '/tutor/coupons',   icon: Ticket },
    { name: 'Revenue',      path: '/tutor/revenue',   icon: TrendingUp },
    { name: 'Chat & Video', path: '/tutor/chat',      icon: MessageSquare },
];

export default function TutorSidebar({ tutorInfo }) {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const isActive = (path) => location.pathname.startsWith(path);

    const handleLogout = async () => {
        localStorage.removeItem('tutorInfo');
        await dispatch(logoutUser());
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    return (
        <aside className="bg-white w-56 min-h-screen flex-shrink-0 border-r border-gray-200 flex flex-col">
            <div className="px-4 pt-6 pb-5 border-b border-gray-100 flex flex-col items-center">
                {tutorInfo?.profileImage ? (
                    <img src={tutorInfo.profileImage} alt="Tutor"
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm border-2 border-purple-200">
                        {tutorInfo?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                )}
                <p className="mt-2 font-semibold text-gray-800 text-sm text-center">
                    {tutorInfo?.name || 'Tutor'}
                </p>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-0.5">
                {menuItems.map(({ name, path, icon: Icon }) => (
                    <button key={path} onClick={() => navigate(path)}
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
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Logout
                </button>
            </nav>
        </aside>
    );
}



