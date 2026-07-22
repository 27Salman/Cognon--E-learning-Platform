import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import TutorNavbar from "../tutor/TutorNavbar";
import TutorSidebar from "../tutor/TutorSidebar";
import Footer from "../common/Footer";
import { tutorAPI } from "../../api/tutorAPI";

export default function TutorLayout() {
  const { user } = useSelector((state) => state.auth);

  const [tutorInfo, setTutorInfo] = useState(() => {
    try {
      const stored = localStorage.getItem("tutorInfo");
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && user && parsed._id === user._id) return parsed;
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    tutorAPI
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const data = res.data || res;
        const profile = {
          _id: data._id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          profileImage: data.profileImage || null,
          profileImageURL: data.profileImageURL || null,
          tutorProfile: data.tutorProfile || {},
          role: data.role,
          status: data.status,
        };
        setTutorInfo(profile);
        localStorage.setItem("tutorInfo", JSON.stringify(profile));
      })
      .catch(() => {
        if (cancelled) return;
        if (user) {
          setTutorInfo((prev) => ({
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

  const handleUpdateProfile = (updatedData) => {
    const { password, ...toStore } = updatedData;
    setTutorInfo(toStore);
    localStorage.setItem("tutorInfo", JSON.stringify(toStore));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TutorNavbar tutorInfo={tutorInfo} />

      <div className="flex flex-1">
        <TutorSidebar tutorInfo={tutorInfo} />

        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="min-h-full">
            <Outlet
              context={{ tutorInfo, onUpdateProfile: handleUpdateProfile }}
            />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
