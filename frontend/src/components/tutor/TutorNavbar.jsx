import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "../common/Logo";

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

const getFullImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const subfolder = src.startsWith('user-') ? 'profiles/' : '';
  return `${API_BASE}/uploads/${subfolder}${src}`;
};

export default function TutorNavbar({ tutorInfo }) {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const imageSrc = getFullImageUrl(tutorInfo?.profileImageURL || tutorInfo?.profileImage);
    const showImage = imageSrc && !imgError;

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">

                {/* Left - Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/tutor/dashboard')}>
                    <Logo size={40} />
                    <div>
                        <h1 className="text-2xl font-bold text-purple-600">Cognon</h1>
                        <span className="text-sm text-gray-500 font-medium">Tutor</span>
                    </div>
                </div>

                {/* Right - Bell + Avatar */}
                <div className="flex items-center space-x-4">
                    <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Bell className="w-5 h-5 text-gray-700" />
                    </button>

                    <button
                        onClick={() => navigate("/tutor/profile")}
                        className="cursor-pointer focus:outline-none"
                    >
                        {showImage ? (
                            <img
                                src={imageSrc}
                                alt="Tutor"
                                className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 hover:border-purple-400 transition-colors"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center border-2 border-purple-200 transition-colors">
                                <span className="text-white font-bold text-sm">
                                    {tutorInfo?.name?.charAt(0)?.toUpperCase() || "T"}
                                </span>
                            </div>
                        )}
                    </button>
                </div>

            </div>
        </header>
    );
}
