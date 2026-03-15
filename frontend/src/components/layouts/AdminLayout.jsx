import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminNavbar from '../admin/AdminNavbar';
import AdminSidebar from '../admin/AdminSidebar';
import ProfileSection from '../../pages/admin/AdminProfile';
import Footer from '../common/Footer';

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // adminInfo holds only mutable UI state (profile image, display name overrides)
  const [adminInfo, setAdminInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('adminInfo');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Sync real user data into adminInfo on mount
  useEffect(() => {
    if (user) {
      setAdminInfo(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: user.email,   // always use real email
        phone: user.phone,   // always use real phone
      }));
    }
  }, [user]);

  const handleUpdateProfile = (updatedData) => {
    const { password, ...toStore } = updatedData;
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
