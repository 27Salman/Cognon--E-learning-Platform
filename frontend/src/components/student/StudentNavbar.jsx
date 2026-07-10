import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Heart, ShoppingCart } from 'lucide-react';
import { studentAPI } from '../../api/studentAPI';
import Logo from '../common/Logo';
import NotificationBell from '../common/NotificationBell';
import { ROUTES } from '../../utils/constants';



const isValidImageSrc = (src) => !!src;

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

export default function StudentNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [studentInfo, setStudentInfo] = useState(() => {
        try {
            const stored = localStorage.getItem('studentInfo');
            const parsed = stored ? JSON.parse(stored) : null;
            if (parsed && user && parsed._id === user._id) return parsed;
            return user ? { name: user.name, email: user.email, profileImage: user.profileImage, profileImageURL: user.profileImageURL } : {};
        } catch { return {}; }
    });

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        studentAPI.getProfile()
            .then(res => {
                if (cancelled) return;
                const data = res.data || res;
                const profile = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    profileImage: data.profileImage || null,
                    profileImageURL: data.profileImageURL || null,
                };
                setStudentInfo(profile);
                localStorage.setItem('studentInfo', JSON.stringify(profile));
            })
            .catch(() => {
                if (!cancelled && user) {
                    setStudentInfo(prev => ({ ...prev, name: user.name, email: user.email, profileImage: user.profileImage, profileImageURL: user.profileImageURL }));
                }
            });
        return () => { cancelled = true; };
    }, [user?._id]);

    useEffect(() => {
        if (!user) return;
        const fetchCartCount = async () => {
            try {
                const res = await studentAPI.getCart();
                setCartCount(res.data?.data?.totalItems || res.data?.totalItems || 0);
            } catch {}
        };

        const fetchWishlistCount = async () => {
            try {
                const res = await studentAPI.getWishlist({ page: 1, limit: 1 });
                setWishlistCount(res.data?.pagination?.totalFiltered || res.data?.courses?.length || 0);
            } catch {}
        };

        fetchCartCount();
        fetchWishlistCount();

        window.addEventListener('cart-updated', fetchCartCount);
        window.addEventListener('wishlist-updated', fetchWishlistCount);
        return () => {
            window.removeEventListener('cart-updated', fetchCartCount);
            window.removeEventListener('wishlist-updated', fetchWishlistCount);
        };
    }, [user?._id]);

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-6 w-full">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)}>
                    <Logo size={40} />
                    <h1 className="text-2xl font-bold text-purple-600">Cognon</h1>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <button
                        onClick={() => {
                            navigate(ROUTES.STUDENT_DASHBOARD);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`transition ${location.pathname === ROUTES.STUDENT_DASHBOARD ? 'text-purple-600 font-semibold' : 'text-gray-700 hover:text-purple-600'}`}
                    >
                        Home
                    </button>
                    <button
                        onClick={() => {
                            navigate(ROUTES.STUDENT_DASHBOARD);
                            setTimeout(() => {
                                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}
                        className="text-gray-700 hover:text-purple-600 transition"
                    >
                        About Us
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.STUDENT_CATEGORIES)}
                        className={`transition ${location.pathname === ROUTES.STUDENT_CATEGORIES ? 'text-purple-600 font-semibold' : 'text-gray-700 hover:text-purple-600'}`}
                    >
                        Courses
                    </button>

                    <button
                        onClick={() => navigate(ROUTES.STUDENT_TUTORS)}
                        className={`transition ${location.pathname === ROUTES.STUDENT_TUTORS ? 'text-purple-600 font-semibold' : 'text-gray-700 hover:text-purple-600'}`}
                    >
                        Tutors
                    </button>
                    <button
                        onClick={() => {
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }}
                        className="text-gray-700 hover:text-purple-600 transition"
                    >
                        Contact
                    </button>
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <button onClick={() => navigate(ROUTES.STUDENT_WISHLIST)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Wishlist">
                                <Heart className="w-5 h-5 text-gray-700" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {wishlistCount}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => navigate(ROUTES.STUDENT_CART)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title="Cart">
                                <ShoppingCart className="w-5 h-5 text-gray-700" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <NotificationBell />
                            <button onClick={() => navigate(ROUTES.STUDENT_PROFILE)} className="focus:outline-none" title="My Profile">
                                {isValidImageSrc(studentInfo?.profileImageURL || studentInfo?.profileImage) ? (
                                    <img src={studentInfo?.profileImageURL || studentInfo?.profileImage} alt="Student" className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 hover:border-purple-400 transition-colors" />
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
                        </>
                    ) : (
                        <button
                            onClick={() => navigate(ROUTES.LOGIN)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
