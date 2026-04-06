import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TutorNavbar({ tutorInfo }) {
    const navigate = useNavigate();

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">

                {/* Left - Logo */}
                <div className="flex items-center space-x-3">
                    <h1
                        className="text-2xl font-bold text-purple-600 cursor-pointer"
                        onClick={() => navigate("/tutor/dashboard")}
                    >
                        Cognon
                    </h1>
                    <span className="text-sm text-gray-500 font-medium">Tutor</span>
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
                        {tutorInfo?.profileImage ? (
                            <img
                                src={tutorInfo.profileImage}
                                alt="Tutor"
                                className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 hover:border-purple-400 transition-colors"
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
