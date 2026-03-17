import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TutorNavbar from '../tutor/TutorNavbar';
import TutorSidebar from '../tutor/TutorSidebar';
import Footer from '../common/Footer';
import TutorProfile from '../../pages/tutor/TutorProfile';
import { tutorAPI } from '../../api/tutorAPI';

export default function TutorLayout() {
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const [tutorInfo, setTutorInfo] = useState(() => {
        try {
            const stored = localStorage.getItem('tutorInfo');
            const parsed = stored ? JSON.parse(stored) : null;
            if (parsed && user && parsed._id === user._id) return parsed;
            return {};
        } catch { return {}; }
    });

    useEffect(() => {
        if (!user) return;
        tutorAPI.getProfile()
            .then((res) => {
                const data = res.data || res;
                const profile = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    profileImage: data.profileImageURL || data.profileImage || null,
                    tutorProfile: data.tutorProfile || {},
                    role: data.role,
                    status: data.status,
                };
                setTutorInfo(profile);
                localStorage.setItem('tutorInfo', JSON.stringify(profile));
            })
            .catch(() => {
                if (user) {
                    setTutorInfo(prev => ({
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
        setTutorInfo(toStore);
        localStorage.setItem('tutorInfo', JSON.stringify(toStore));
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