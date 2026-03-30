import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentNavbar from '../student/StudentNavbar';
import StudentSidebar from '../student/StudentSidebar';
import Footer from '../common/Footer';
import { studentAPI } from '../../api/studentAPI';

export default function StudentLayout() {
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

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        studentAPI.getProfile()
            .then((res) => {
                if (cancelled) return;
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
                if (cancelled) return;
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
        return () => { cancelled = true; };
    }, [user?._id]);

    const handleUpdateProfile = (updatedData) => {
        const { password, ...toStore } = updatedData;
        toStore.profileImage = toStore.profileImageURL || toStore.profileImage || null;
        setStudentInfo(toStore);
        localStorage.setItem('studentInfo', JSON.stringify(toStore));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar studentInfo={studentInfo} />

            <div className="flex flex-1">
                <StudentSidebar studentInfo={studentInfo} />

                <main className="flex-1 overflow-y-auto">
                    <Outlet context={{ studentInfo, onUpdateProfile: handleUpdateProfile }} />
                </main>
            </div>

            <Footer />
        </div>
    );
}
