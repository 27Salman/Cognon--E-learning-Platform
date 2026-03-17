import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Bell } from 'lucide-react';

const isValidImageSrc = (src) => src && (src.startsWith('http') || src.startsWith('data:'));

const getAvatarColors = (name) => {
    const palettes = [
        ['#7c3aed', '#a855f7'],
        ['#2563eb', '#60a5fa'],
        ['#059669', '#34d399'],
        ['#d97706', '#fbbf24'],
        ['#dc2626', '#f87171'],
        ['#0891b2', '#22d3ee'],
        ['#7c3aed', '#ec4899'],
        ['#ea580c', '#fb923c'],
    ];
    if (!name) return palettes[0];
    return palettes[name.charCodeAt(0) % palettes.length];
};

export default function StudentNavbar({ studentInfo }) {
    const navigate = useNavigate();

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <h1
                        className="text-2xl font-bold text-purple-600 cursor-pointer"
                        onClick={() => navigate('/student/dashboard')}
                    >
                        Cognon
                    </h1>

                    {/* Nav links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="#home" className="text-gray-700 hover:text-purple-600 transition">Home</a>
                        <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
                        <a href="#courses" className="text-gray-700 hover:text-purple-600 transition">Courses</a>
                        <a href="#blog" className="text-gray-700 hover:text-purple-600 transition">Blog</a>
                        <a href="#contact" className="text-gray-700 hover:text-purple-600 transition">Contact</a>
                    </nav>

                    {/* Right icons */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Wishlist">
                            <Heart className="w-5 h-5 text-gray-700" />
                        </button>
                        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Cart">
                            <ShoppingCart className="w-5 h-5 text-gray-700" />
                            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
                        </button>
                        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Notifications">
                            <Bell className="w-5 h-5 text-gray-700" />
                        </button>

                        {/* Avatar  */}
                        <button
                            onClick={() => navigate('/student/profile')}
                            className="focus:outline-none"
                            title="My Profile"
                        >
                            {isValidImageSrc(studentInfo?.profileImage) ? (
                                <img
                                    src={studentInfo.profileImage}
                                    alt="Student"
                                    className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 hover:border-purple-400 transition-colors"
                                />
                            ) : (
                                (() => {
                                    const [from, to] = getAvatarColors(studentInfo?.name);
                                    return (
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white hover:opacity-90 transition select-none"
                                            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                                        >
                                            <span className="text-white font-bold text-sm">
                                                {studentInfo?.name?.charAt(0)?.toUpperCase() || 'S'}
                                            </span>
                                        </div>
                                    );
                                })()
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
