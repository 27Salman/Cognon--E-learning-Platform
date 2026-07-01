import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { BookOpen, Tag, X, CreditCard, ChevronDown, ChevronUp, Check, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/student/StudentNavbar';
import { useSelector } from 'react-redux';
import { ROUTES, DISCOUNT_TYPE } from '../../utils/constants';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);

    const [priceData, setPriceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletPaying, setWalletPaying] = useState(false);

    const [couponCode, setCouponCode] = useState(location.state?.couponCode || '');
    const [couponInput, setCouponInput] = useState(location.state?.couponCode || '');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponOpen, setCouponOpen] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);

    const fetchPriceData = async (code, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setCouponLoading(true);
        
        try {
            const res = await studentAPI.calculatePrice(code || null);
            setPriceData(res.data);

            if(res.data.removedItems && res.data.removedItems.length > 0){
                toast.error(`Removed unavailable course from your checkout: ${res.data.removedItems.join(', ')}`, {duration: 5000});
                window.dispatchEvent(new Event('cart-updated'));
            }

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load checkout');
            if (isInitial) navigate(ROUTES.STUDENT_CART);
        } finally {
            if (isInitial) setLoading(false);
            else setCouponLoading(false);
        }
    };

    const fetchAvailableCoupons = async () => {
        setCouponsLoading(true);
        try {
            const courseIds = priceData?.items?.map(item => item.course?._id).filter(Boolean) || [];
            const res = await studentAPI.getAvailableCoupons(courseIds);
            setAvailableCoupons(res.data || []);
        } catch {
        } finally {
            setCouponsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const directCourseId = location.state?.directCourseId;
            if (directCourseId) {
                try {
                    await studentAPI.addToCart(directCourseId);
                } catch (err) {
                    const msg = err.response?.data?.message || '';
                    if (!msg.includes('already in your cart') && !msg.includes('already purchased')) {
                        toast.error(msg || 'Failed to add course to cart');
                        navigate(ROUTES.STUDENT_COURSE_CATALOG);
                        return;
                    }
                }
            }
            await fetchPriceData(couponCode, true);
        };
        init();
    }, []);

    // Fetch wallet balance
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const res = await studentAPI.getMyWallet();
                setWalletBalance(res.data?.balance || 0);
            } catch {
            }
        };
        fetchWallet();
    }, []);

    const handleToggleCouponPanel = () => {
        const next = !couponOpen;
        setCouponOpen(next);
        if (next && availableCoupons.length === 0) {
            fetchAvailableCoupons();
        }
    };

    const handleSelectCoupon = (code) => {
        setCouponInput(code);
    };

    const handleApplyCoupon = async (codeOverride) => {
        const code = (codeOverride || couponInput).trim().toUpperCase();
        if (!code) return toast.error('Enter a coupon code');
        try {
            await fetchPriceData(code);
            setCouponCode(code);
            setCouponOpen(false);
            toast.success('Coupon applied!');
        } catch {
            toast.error('Invalid or inapplicable coupon');
        }
    };

    const handleRemoveCoupon = async () => {
        setCouponCode('');
        setCouponInput('');
        await fetchPriceData('');
    };

    const handleWalletPayment = async () => {
        if (walletPaying) return;
        setWalletPaying(true);
        try {
            const res = await studentAPI.payWithWallet(couponCode || null);
            toast.success('Payment successful!');
            navigate(ROUTES.STUDENT_ORDER_SUCCESS, { state: { order: res.data } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Wallet payment failed');
            setWalletPaying(false);
        }
    };

    const handlePayment = async () => {
        if (paying) return; 
        if (!window.Razorpay) {
            toast.error('Payment gateway not loaded. Please refresh the page.');
            return;
        }
        setPaying(true);
        let razorpayOrderId = null;
        try {
            const orders = await studentAPI.createRazorpayOrder(couponCode || null);
            razorpayOrderId = orders.data.razorpayOrderId;
            const { amount, keyId } = orders.data;

            const options = {
                key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount * 100,
                currency: 'INR',
                name: 'Cognon',
                description: 'Course Enrollment',
                order_id: razorpayOrderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await studentAPI.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            couponCode: couponCode || null
                        });
                        navigate(ROUTES.STUDENT_ORDER_SUCCESS, {
                            state: { order: verifyRes.data }
                        });
                    } catch {
                        toast.error('Payment verification failed');
                        setPaying(false);
                    }
                },
                prefill: { name: user?.name || '', email: user?.email || '' },
                theme: { color: '#7c3aed' },
                modal: {
                    ondismiss: async () => {
                        setPaying(false);
                        toast.error('Payment cancelled');
                        if (razorpayOrderId) {
                            try { await studentAPI.markOrderFailed(razorpayOrderId); } catch {}
                        }
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment');
            setPaying(false);
        }
    };

    const originalTotal = priceData?.items?.reduce((sum, item) => sum + item.originalPrice, 0) ?? 0;
    const offerDiscount = originalTotal - (priceData?.subtotal ?? originalTotal);
    const couponDiscount = priceData?.couponDiscount ?? 0;
    const finalAmount = priceData?.finalAmount ?? 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StudentNavbar />
                <div className="flex items-center justify-center min-h-64">
                    <div className="animate-pulse text-gray-400">Loading checkout...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StudentNavbar />

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <span>Details</span>
                    <span>›</span>
                    <span>Shopping Cart</span>
                    <span>›</span>
                    <span className="text-purple-600 font-medium">Checkout</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Left: Payment placeholder / course list */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="font-semibold text-gray-700 mb-4 text-base">
                                Courses ({priceData?.totalItems})
                            </h2>
                            <div className="space-y-3">
                                {priceData?.items?.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                        {item.course?.thumbnailURL ? (
                                            <img
                                                src={item.course.thumbnailURL}
                                                alt={item.course.title}
                                                className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-5 h-5 text-purple-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{item.course?.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.course?.tutor?.name}</p>
                                            {item.offer && (
                                                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                    {item.offer.discountPercentage}% offer applied
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {item.originalPrice !== item.finalPrice && (
                                                <p className="text-xs text-gray-400 line-through">₹{item.originalPrice}</p>
                                            )}
                                            <p className="text-sm font-bold text-gray-800">₹{item.finalPrice}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Details card */}
                    <div className="lg:w-80 flex-shrink-0 w-full">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-800 text-base">Order Details</h2>
                            </div>

                            {/* Course preview (first item) */}
                            {priceData?.items?.[0] && (
                                <div className="px-5 py-4 border-b border-gray-100 flex gap-3 items-start">
                                    {priceData.items[0].course?.thumbnailURL ? (
                                        <img
                                            src={priceData.items[0].course.thumbnailURL}
                                            alt={priceData.items[0].course.title}
                                            className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-5 h-5 text-purple-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        {priceData.items[0].course?.category && (
                                            <p className="text-xs text-purple-600 font-medium mb-0.5">{priceData.items[0].course.category}</p>
                                        )}
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                                            {priceData.items[0].course?.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {priceData.items[0].originalPrice !== priceData.items[0].finalPrice && (
                                                <span className="text-xs text-gray-400 line-through">₹{priceData.items[0].originalPrice}</span>
                                            )}
                                            <span className="text-sm font-bold text-gray-800">₹{priceData.items[0].finalPrice}</span>
                                        </div>
                                        {priceData.totalItems > 1 && (
                                            <p className="text-xs text-gray-400 mt-0.5">+{priceData.totalItems - 1} more course{priceData.totalItems > 2 ? 's' : ''}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Apply Coupon Code — collapsible */}
                            <div className="border-b border-gray-100">
                                {!priceData?.coupon ? (
                                    <>
                                        <button
                                            onClick={handleToggleCouponPanel}
                                            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-4 h-4 text-gray-500" />
                                                <span>Apply Coupon Code</span>
                                            </div>
                                            {couponOpen
                                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                                            }
                                        </button>

                                        {couponOpen && (
                                            <div className="px-5 pb-4 space-y-3">
                                                {/* Manual input */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                        placeholder="Enter coupon code"
                                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleApplyCoupon()}
                                                        disabled={couponLoading}
                                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {couponLoading ? '...' : 'Apply'}
                                                    </button>
                                                </div>

                                                {/* Available coupons list */}
                                                {couponsLoading ? (
                                                    <p className="text-xs text-gray-400 text-center py-2">Loading coupons...</p>
                                                ) : availableCoupons.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Coupons</p>
                                                        {availableCoupons.map((c) => {
                                                            const isSelected = couponInput === c.code;
                                                            const notApplicable = c.applicable === false;
                                                            return (
                                                                <div
                                                                    key={c._id}
                                                                    onClick={() => !notApplicable && handleSelectCoupon(c.code)}
                                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                                        notApplicable
                                                                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                                            : isSelected
                                                                            ? 'border-purple-400 bg-purple-50 cursor-pointer'
                                                                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 cursor-pointer'
                                                                    }`}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`font-mono font-bold text-sm ${notApplicable ? 'text-gray-400' : 'text-purple-700'}`}>{c.code}</span>
                                                                            {isSelected && !notApplicable && (
                                                                                <Check className="w-3.5 h-3.5 text-purple-600" />
                                                                            )}
                                                                            {notApplicable && (
                                                                                <span className="text-xs text-gray-400 italic">Not for your cart</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                            {c.discountType === DISCOUNT_TYPE.PERCENTAGE
                                                                                ? `${c.discountValue}% off${c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ''}`
                                                                                : `₹${c.discountValue} off`}
                                                                            {c.minPurchaseAmount > 0 ? ` · min ₹${c.minPurchaseAmount}` : ''}
                                                                        </p>
                                                                        {c.description && (
                                                                            <p className="text-xs text-gray-400 truncate">{c.description}</p>
                                                                        )}
                                                                    </div>
                                                                    {!notApplicable && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleApplyCoupon(c.code); }}
                                                                            className="ml-3 text-xs text-purple-600 font-semibold hover:text-purple-800 whitespace-nowrap flex-shrink-0"
                                                                        >
                                                                            Apply
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-1">No coupons available right now</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Applied coupon row */
                                    <div className="flex items-center justify-between px-5 py-3.5 bg-green-50">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-green-700 font-mono">{priceData.coupon.code}</p>
                                                <p className="text-xs text-green-600">You save ₹{couponDiscount}</p>
                                            </div>
                                        </div>
                                        <button onClick={handleRemoveCoupon} disabled={couponLoading} className="text-gray-400 hover:text-gray-600 ml-2 disabled:opacity-50">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Price breakdown */}
                            <div className="px-5 py-4 space-y-2.5 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Price</span>
                                    <span>₹{originalTotal}</span>
                                </div>
                                {offerDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Offer Discount</span>
                                        <span>- ₹{Number(offerDiscount).toFixed(2)}</span>
                                    </div>
                                )}
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Coupon Discount</span>
                                        <span>- ₹{couponDiscount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-800 text-base pt-2.5 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>₹{finalAmount}</span>
                                </div>
                            </div>

                            {/* Pay button */}
                            <div className="px-5 pb-5">
                                <button
                                    onClick={handlePayment}
                                    disabled={paying || walletPaying}
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {paying ? 'Processing...' : `Pay ₹${finalAmount}`}
                                </button>

                                {/* Wallet payment section */}
                                {walletBalance > 0 && (
                                    <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm text-gray-700 font-medium">Wallet Balance</span>
                                            </div>
                                            <span className="text-sm font-bold text-purple-700">₹{walletBalance.toFixed(2)}</span>
                                        </div>
                                        {walletBalance >= finalAmount ? (
                                            <button
                                                onClick={handleWalletPayment}
                                                disabled={walletPaying || paying}
                                                className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-colors"
                                            >
                                                <Wallet className="w-4 h-4" />
                                                {walletPaying ? 'Processing...' : `Pay with Wallet (₹${finalAmount})`}
                                            </button>
                                        ) : (
                                            <p className="text-xs text-gray-400 text-center">
                                                Insufficient balance (need ₹{(finalAmount - walletBalance).toFixed(2)} more)
                                            </p>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-gray-400 text-center mt-2">Secured by Razorpay</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
