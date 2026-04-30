import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { Heart, ShoppingCart, Trash2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LIMIT = 5;

export default function Wishlist() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [pagination, setPagination] = useState({});
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    const fetchWishlist = async (p = 1) => {
        setLoading(true);
        try {
            const res = await studentAPI.getWishlist({ page: p, limit: LIMIT });
            setWishlist(res.data.courses || []);
            setPagination(res.data.pagination || {});
        } catch {
            toast.error('Failed to load wishlist', { id: 'wishlist-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWishlist(page); }, [page]);

    const handleRemove = async (courseId) => {
        setActionLoading(prev => ({ ...prev, [courseId]: 'removing' }));
        try {
            await studentAPI.removeFromWishlist(courseId);
            // If last item on page > 1, go back a page
            const newPage = wishlist.length === 1 && page > 1 ? page - 1 : page;
            setPage(newPage);
            fetchWishlist(newPage);
            toast.success('Removed from wishlist');
        } catch {
            toast.error('Failed to remove');
        } finally {
            setActionLoading(prev => ({ ...prev, [courseId]: null }));
        }
    };

    const handleMoveToCart = async (courseId) => {
        setActionLoading(prev => ({ ...prev, [courseId]: 'carting' }));
        try {
            await studentAPI.addToCart(courseId);
            await studentAPI.removeFromWishlist(courseId);
            const newPage = wishlist.length === 1 && page > 1 ? page - 1 : page;
            setPage(newPage);
            fetchWishlist(newPage);
            toast.success('Moved to cart');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to move to cart');
        } finally {
            setActionLoading(prev => ({ ...prev, [courseId]: null }));
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                        <Heart className="w-6 h-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
                        <span className="bg-purple-100 text-purple-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                            {pagination.totalFiltered ?? wishlist.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                                    <div className="h-36 bg-gray-200 rounded-lg mb-3" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : wishlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Heart className="w-16 h-16 text-gray-300 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-400 mb-6">Save courses you're interested in to your wishlist</p>
                            <button
                                onClick={() => navigate('/student/courses')}
                                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700"
                            >
                                Browse Courses
                            </button>
                        </div>
                    ) : (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {wishlist.map((course) => (
                                <div key={course._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div
                                        className="relative cursor-pointer"
                                        onClick={() => navigate(`/student/courses/${course._id}`)}
                                    >
                                        {course.thumbnailURL ? (
                                            <img src={course.thumbnailURL} alt={course.title} className="w-full h-36 object-cover" />
                                        ) : (
                                            <div className="w-full h-36 bg-purple-100 flex items-center justify-center">
                                                <BookOpen className="w-10 h-10 text-purple-400" />
                                            </div>
                                        )}
                                        {course.offer && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {course.offer.discountPercentage}% OFF
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3
                                            className="font-semibold text-gray-800 text-sm mb-1 cursor-pointer hover:text-purple-600 line-clamp-2"
                                            onClick={() => navigate(`/student/courses/${course._id}`)}
                                        >
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3">{course.tutor?.name}</p>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                {course.offer ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-800">₹{course.offer.discountedPrice}</span>
                                                        <span className="text-xs text-gray-400 line-through">₹{course.price}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-gray-800">₹{course.price}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleMoveToCart(course._id)}
                                                disabled={!!actionLoading[course._id]}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                                {actionLoading[course._id] === 'carting' ? 'Adding...' : 'Add to Cart'}
                                            </button>
                                            <button
                                                onClick={() => handleRemove(course._id)}
                                                disabled={!!actionLoading[course._id]}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                            p === page
                                                ? 'bg-purple-600 text-white'
                                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        </>
                    )}
        </div>
    );
}





