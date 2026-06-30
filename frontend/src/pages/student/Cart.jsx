import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ShoppingCart, Trash2, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/student/StudentNavbar';
import StudentSidebar from '../../components/student/StudentSidebar';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../utils/constants';

export default function Cart() {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [cart, setCart] = useState({ items: [], subtotal: 0, totalItems: 0 });
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState({});
    const [checkingOut, setCheckingOut] = useState(false);

    const fetchCart = async () => {
        try {
            const res = await studentAPI.getCart();
            setCart(res.data);
        } catch {
            toast.error('Failed to load the cart', { id: 'cart-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCart(); }, []);

    const handleRemove = async (courseId) => {
        setRemoving(prev => ({ ...prev, [courseId]: true }));
        try {
            const res = await studentAPI.removeFromCart(courseId);
            setCart(res.data);
            window.dispatchEvent(new Event('cart-updated'));
            toast.success('Removed from cart');
        } catch {
            toast.error('Failed to remove');
        } finally {
            setRemoving(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            const res = await studentAPI.getCart();
            const freshCart = res.data;
            setCart(freshCart);
            
            if (freshCart.hasUnavailable) {
                toast.error(
                    'Some courses in your cart are no longer available. Remove them to proceed.',
                    { duration: 5000 }
                );
                return;
            }

            if(freshCart.items.length === 0){
                toast.error('Your cart is empty');
                setCart(freshCart);
                return;
            }

            navigate(ROUTES.STUDENT_CHECKOUT);

        } catch (error) {
            toast.error('Could not verify the cart. Please try again.')
        }finally {
            setCheckingOut(false);  
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            <StudentNavbar />
            <div className="flex">
                <StudentSidebar studentInfo={user} />
                <main className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingCart className="w-6 h-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-800">My Cart</h1>
                        <span className="bg-purple-100 text-purple-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
                            {cart.totalItems}
                        </span>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-200" />)}
                        </div>
                    ) : cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h2>
                            <p className="text-gray-400 mb-6">Add courses to your cart to get started</p>
                            <button
                                onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700"
                            >
                                Browse Courses
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Cart Items */}
                            <div className="flex-1 space-y-3">
                                {cart.hasUnavailable && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-700 font-medium">
                                            Some courses in your cart are no longer available. Remove them to proceed to checkout.
                                        </p>
                                    </div>
                                )}
                                {cart.items.map((item) => (
                                    <div key={item._id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4 ${
                                        !item.isAvailable 
                                            ? 'border-red-200 opacity-70'
                                            : 'border-gray-200'
                                    }`}
                                    >
                                        {item.course?.thumbnailURL ? (
                                            <img
                                                src={item.course.thumbnailURL}
                                                alt={item.course.title}
                                                className="w-20 h-16 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                                                onClick={() => navigate(`/student/courses/${item.course._id}`)}
                                            />
                                        ) : (
                                            <div className="w-20 h-16 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-6 h-6 text-purple-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className="font-semibold text-gray-800 text-sm cursor-pointer hover:text-purple-600 line-clamp-1"
                                                onClick={() => navigate(`/student/courses/${item.course._id}`)}
                                            >
                                                {item.course?.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.course?.tutor?.name}</p>

                                            {/*Unavailable badge */}
                                            {!item.isAvailable ? (
                                                <span className="inline-flex items-center gap-1 mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Course unavailable
                                                </span>
                                            ) : item.offer ? (
                                                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    {item.offer.discountPercentage}% OFF
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                                            <button
                                                onClick={() => handleRemove(item.course._id)}
                                                disabled={removing[item.course._id]}
                                                className="text-red-400 hover:text-red-600 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="text-right">
                                                {!item.isAvailable ? (
                                                    <p className="text-xs text-red-400 font-medium">Unavailable</p>
                                                ) : (
                                                    <>
                                                        {item.discountAmount > 0 && (
                                                            <p className="text-xs text-gray-400 line-through">₹{item.originalPrice}</p>
                                                        )}
                                                        <p className="font-bold text-gray-800">₹{item.finalPrice}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:w-80 flex-shrink-0">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24">
                                    <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal ({cart.totalItems} course{cart.totalItems !== 1 ? 's' : ''})</span>
                                            <span>₹{cart.subtotal}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-100">
                                            <span>Total</span>
                                            <span>₹{cart.subtotal}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-3">
                                        Have a coupon? You can apply it at checkout.
                                    </p>

                                    <button
                                        onClick={handleCheckout}
                                        disabled={cart.hasUnavailable || cart.totalItems === 0 || checkingOut}
                                        className={`w-full mt-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                                            cart.hasUnavailable || cart.totalItems === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    >
                                        {checkingOut ? 'Checking...' : cart.hasUnavailable ? 'Remove unavailable courses' : 'Proceed to Checkout'}
                                        {!cart.hasUnavailable && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
