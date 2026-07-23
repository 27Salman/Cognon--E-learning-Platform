import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminNavbar from "../admin/AdminNavbar";
import AdminSidebar from "../admin/AdminSidebar";
import Footer from "../common/Footer";
import { adminAPI } from "../../api/adminAPI";

export default function AdminLayout() {
  const { user } = useSelector((state) => state.auth);

  const [adminInfo, setAdminInfo] = useState(() => {
    try {
      const stored = localStorage.getItem("adminInfo");
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && user && parsed._id === user._id) {
        if (parsed.profileImage && !parsed.profileImage.startsWith("http")) {
          parsed.profileImage = null;
        }
        return parsed;
      }
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    adminAPI
      .getProfile()
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
        };
        setAdminInfo(profile);
        localStorage.setItem("adminInfo", JSON.stringify(profile));
      })
      .catch(() => {
        if (cancelled) return;
        if (user) {
          setAdminInfo((prev) => ({
            ...prev,
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleUpdateProfile = (updatedData) => {
    const { password, ...toStore } = updatedData;
    toStore.profileImage =
      toStore.profileImageURL || toStore.profileImage || null;
    setAdminInfo(toStore);
    localStorage.setItem("adminInfo", JSON.stringify(toStore));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar
        adminInfo={adminInfo}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1">
        <AdminSidebar
          adminInfo={adminInfo}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet
            context={{ adminInfo, onUpdateProfile: handleUpdateProfile }}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
}
