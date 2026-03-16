import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import TutorNavbar from '../tutor/TutorNavbar';
import TutorSidebar from '../tutor/TutorSidebar';
import Footer from '../common/Footer';
import TutorProfile from '../../pages/tutor/TutorProfile';
import toast from 'react-hot-toast';

export default function TutorLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [tutorInfo, setTutorInfo] = useState(() => {
        try {
            const stored = localStorage.getItem('tutorInfo');
            const parsed = stored ? JSON.parse(stored) : null;
            // Only use cache if it belongs to the current logged-in user
            if (parsed && user && parsed._id === user._id) return parsed;
            return {};
        } catch { return {}; }
    });

    // Sync real user data on mount — always overwrite if user identity changed
    useEffect(() => {
        if (user) {
            setTutorInfo(prev => {
                // If cached data is from a different user, reset entirely
                if (prev._id && prev._id !== user._id) {
                    localStorage.removeItem('tutorInfo');
                    return { _id: user._id, name: user.name, email: user.email, phone: user.phone };
                }
                return {
                    ...prev,
                    _id: user._id,
                    name: prev.name || user.name,
                    email: user.email,
                    phone: user.phone,
                };
            });
        }
    }, [user]);

    // Set current section based on route
    const currentSection = (() => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/profile')) return 'profile';
        if (path.includes('/courses')) return 'courses';
        if (path.includes('/orders')) return 'orders';
        if (path.includes('/wallet')) return 'wallet';
        if (path.includes('/coupon')) return 'coupon';
        if (path.includes('/chat')) return 'chat';
        return 'dashboard';
    })();

    // Handle profile update
    const handleUpdateProfile = (updatedData) => {
        const { password, ...toStore } = updatedData;
        // Normalize: always use the full URL for profileImage display
        if (toStore.profileImageURL) {
            toStore.profileImage = toStore.profileImageURL;
        }
        setTutorInfo(toStore);
        localStorage.setItem('tutorInfo', JSON.stringify(toStore));
    };

    // Handle logout
    const handleLogout = async () => {
        await dispatch(logoutUser());
        localStorage.removeItem('tutorInfo');
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    const isProfileRoute = location.pathname === '/tutor/profile' || location.pathname === '/tutor';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <TutorNavbar tutorInfo={tutorInfo} />

            <div className="flex flex-1">
                <TutorSidebar tutorInfo={tutorInfo} />

                <main className="flex-1 overflow-y-auto">
                    {isProfileRoute
                        ? <TutorProfile tutorInfo={tutorInfo} onUpdateProfile={handleUpdateProfile} />
                        : <Outlet />
                    }
                </main>
            </div>

            <Footer />
        </div>
    );
}