import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminNavbar from '../admin/AdminNavbar';
import AdminSidebar from '../admin/AdminSidebar';
import ProfileSection from '../../pages/admin/AdminProfile';
import Footer from '../common/Footer';
import { adminAPI } from '../../api/adminAPI';

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [adminInfo, setAdminInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('adminInfo');
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

  // Fetch fresh profile on mount so image persists after logout/login
  useEffect(() => {
    if (!user) return;
    adminAPI.getProfile()
      .then((res) => {
        const data = res.data || res;
        const profile = {
          _id: data._id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          profileImage: data.profileImageURL || data.profileImage || null,
          role: data.role,
        };
        setAdminInfo(profile);
        localStorage.setItem('adminInfo', JSON.stringify(profile));
      })
      .catch(() => {
        if (user) {
          setAdminInfo(prev => ({
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
    setAdminInfo(toStore);
    localStorage.setItem('adminInfo', JSON.stringify(toStore));
  };

  const isProfileRoute = location.pathname === '/admin/profile' || location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar adminInfo={adminInfo} />

      <div className="flex flex-1">
        <AdminSidebar adminInfo={adminInfo} />

        <main className="flex-1 overflow-y-auto">
          {isProfileRoute
            ? <ProfileSection adminInfo={adminInfo} onUpdateProfile={handleUpdateProfile} />
            : <Outlet />
          }
        </main>
      </div>

      <Footer />
    </div>
  );
}
