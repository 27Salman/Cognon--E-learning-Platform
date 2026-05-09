import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Heart, ShoppingCart, Bell } from 'lucide-react';
import { studentAPI } from '../../api/studentAPI';
import Logo from '../common/Logo';

const isValidImageSrc = (src) => src && (src.startsWith('http') || src.startsWith('data:'));

const getAvatarColors = (name) => {
    const palettes = [
        ['#7c3aed', '#a855f7'], ['#2563eb', '#60a5fa'],
        ['#059669', '#34d399'], ['#d97706', '#fbbf24'],
        ['#dc2626', '#f87171'], ['#0891b2', '#22d3ee'],
        ['#7c3aed', '#ec4899'], ['#ea580c', '#fb923c'],
    ];
    if (!name) return palettes[0];
    return palettes[name.charCodeAt(0) % palettes.length];
};

export default function StudentNavbar({ studentInfo }) {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        const fetchCartCount = async () => {
            try {
                const res = await studentAPI.getCart();
                setCartCount(res.data?.data?.totalItems || res.data?.totalItems || 0);
            } catch {
            }
        };

        const fetchWishlistCount = async () => {
            try {
                const res = await studentAPI.getWishlist({ page: 1, limit: 1 });
                setWishlistCount(res.data?.pagination?.totalFiltered || res.data?.courses?.length || 0);
            } catch {
            }
        };

        fetchCartCount();
        fetchWishlistCount();

        window.addEventListener('cart-updated', fetchCartCount);
        window.addEventListener('wishlist-updated', fetchWishlistCount);
        return () => {
            window.removeEventListener('cart-updated', fetchCartCount);
            window.removeEventListener('wishlist-updated', fetchWishlistCount);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-6 w-full">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/student/dashboard')}>
                    <Logo size={40} />
                    <h1 className="text-2xl font-bold text-purple-600">Cognon</h1>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <button onClick={() => navigate('/student/dashboard')} className="text-gray-700 hover:text-purple-600 transition">Home</button>
                    <button onClick={() => navigate('/student/dashboard')} className="text-gray-700 hover:text-purple-600 transition">About Us</button>
                    <button onClick={() => navigate('/student/categories')} className="text-gray-700 hover:text-purple-600 transition">Categories</button>
                    <button onClick={() => navigate('/student/courses')} className="text-gray-700 hover:text-purple-600 transition">Courses</button>
                    <button onClick={() => navigate('/student/dashboard')} className="text-gray-700 hover:text-purple-600 transition">Contact</button>
                </nav>

                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/student/wishlist')} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Wishlist">
                        <Heart className="w-5 h-5 text-gray-700" />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {wishlistCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => navigate('/student/cart')} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Cart">
                        <ShoppingCart className="w-5 h-5 text-gray-700" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Notifications">
                        <Bell className="w-5 h-5 text-gray-700" />
                    </button>

                    <button onClick={() => navigate('/student/profile')} className="focus:outline-none" title="My Profile">
                        {isValidImageSrc(studentInfo?.profileImage) ? (
                            <img src={studentInfo.profileImage} alt="Student" className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 hover:border-purple-400 transition-colors" />
                        ) : (
                            (() => {
                                const [from, to] = getAvatarColors(studentInfo?.name);
                                return (
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white hover:opacity-90 transition select-none"
                                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
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
        </header>
    );
}
