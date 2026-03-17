import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import StudentNavbar from '../student/StudentNavbar';
import StudentSidebar from '../student/StudentSidebar';
import Footer from '../common/Footer';
import StudentProfile from '../../pages/student/StudentProfile';
import toast from 'react-hot-toast';
import { studentAPI } from '../../api/studentAPI';

export default function StudentLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [studentInfo, setStudentInfo] = useState(() => {
        try {
            const stored = localStorage.getItem('studentInfo');
            const parsed = stored ? JSON.parse(stored) : null;
            if (parsed && user && parsed._id === user._id) {
                if (parsed.profileImage && !parsed.profileImage.startsWith('http')) {
                    parsed.profileImage = null;
                }
                return parsed;
            }
            return {};
        } catch { return {}; }
    });

    // Fetch fresh profile on mount
    useEffect(() => {
        if (!user) return;
        studentAPI.getProfile()
            .then((res) => {
                const data = res.data || res;
                const profile = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    profileImage: data.profileImageURL || data.profileImage || null,
                    role: data.role,
                    status: data.status,
                };
                setStudentInfo(profile);
                localStorage.setItem('studentInfo', JSON.stringify(profile));
            })
            .catch(() => {
                if (user) {
                    setStudentInfo(prev => ({
                        ...prev,
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                    }));
                }
            });
    }, [user?._id]);

    const handleUpdateProfile = (updatedData) => {
        const { password, ...toStore } = updatedData;
        toStore.profileImage = toStore.profileImageURL || toStore.profileImage || null;
        setStudentInfo(toStore);
        localStorage.setItem('studentInfo', JSON.stringify(toStore));
    };

    const isProfileRoute = location.pathname === '/student/profile';

    // Dashboard uses its own full-page layout (no sidebar)
    const isDashboard = location.pathname === '/student/dashboard';

    if (isDashboard) {
        return <Outlet context={{ studentInfo }} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar studentInfo={studentInfo} />

            <div className="flex flex-1">
                <StudentSidebar studentInfo={studentInfo} />

                <main className="flex-1 overflow-y-auto">
                    {isProfileRoute
                        ? <StudentProfile studentInfo={studentInfo} onUpdateProfile={handleUpdateProfile} />
                        : <Outlet />
                    }
                </main>
            </div>

            <Footer />
        </div>
    );
}
