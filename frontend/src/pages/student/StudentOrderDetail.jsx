import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock, Download, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const STATUS_ICON = {
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
    pending: <Clock className="w-5 h-5 text-yellow-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
    refunded: <CheckCircle className="w-5 h-5 text-gray-500" />,
};

const STATUS_COLORS = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
};

function RetryPaymentButton({ order, user, onOrderUpdated }) {
    const [retrying, setRetrying] = useState(false);
    const navigate = useNavigate();

    const handleRetry = async () => {
        if (!window.Razorpay) {
            toast.error('Payment gateway not loaded. Please refresh.');
            return;
        }
        setRetrying(true);
        try {
            const res = await studentAPI.retryPayment(order._id);
            const { razorpayOrderId, amount, keyId } = res.data;

            const options = {
                key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: amount * 100,
                currency: 'INR',
                name: 'Cognon',
                description: 'Course Enrollment - Retry',
                order_id: razorpayOrderId,
                handler: async (response) => {
                    try {
                        const verifyRes = await studentAPI.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            couponCode: order.couponCode || null
                        });
                        toast.success('Payment successful!');
                        navigate('/student/order-success', {
                            state: { order: verifyRes.data }
                        });
                    } catch {
                        toast.error('Payment verification failed');
                        setRetrying(false);
                    }
                },
                prefill: { name: user?.name || '', email: user?.email || '' },
                theme: { color: '#7c3aed' },
                modal: {
                    ondismiss: () => {
                        setRetrying(false);
                        toast.error('Payment cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to initiate retry';
            toast.error(msg);
            // If the order was marked as failed due to duplicate purchase, reload it
            // so the retry button disappears
            if (msg.includes('already purchased') || msg.includes('already cancelled')) {
                onOrderUpdated?.();
            }
            setRetrying(false);
        }
    };

    return (
        <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
            {retrying ? 'Opening payment...' : 'Retry Payment'}
        </button>
    );
}

export default function StudentOrderDetail() {
    const { user } = useSelector(state => state.auth);
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelEligibility, setCancelEligibility] = useState({ eligible: false, reason: '' });

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await studentAPI.getMyOrderById(id);
                setOrder(res.data);
            } catch {
                toast.error('Order not found');
                navigate('/student/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const refetchOrder = async () => {
        try {
            const res = await studentAPI.getMyOrderById(id);
            setOrder(res.data);
        } catch {
            // silently fail on refetch
        }
    };

    useEffect(()=>{
        if(order){
            const orderDate = new Date(order.orderDate);
            const daysSince = (Date.now() - orderDate) / (1000 * 60 * 60 * 24);
            const withinWindow = daysSince <= 3;

            let progressExceeded = false;
            const enrolledCourses = user?.studentProfile?.enrolledCourses || [];
            
            for (const courseItem of order.courses) {
                const enrollment = enrolledCourses.find(
                    e => e.courseId.toString() === courseItem.course.toString()
                );
                if (enrollment) {
                }
            }

            if (!withinWindow) {
                setCancelEligibility({ eligible: false, reason: 'Refund window has expired (3 days from purchase)' });
            } else if (order.paymentStatus !== 'completed') {
                setCancelEligibility({ eligible: false, reason: 'Order is not eligible for cancellation' });
            } else {
                setCancelEligibility({ eligible: true, reason: '' });
            }
        }
    },[order, user]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-64">
                <div className="text-gray-400">Loading order...</div>
            </div>
        );
    }

    if (!order) return null;

    const handleCancelOrder = async () => {
        if(cancelling) return;
        setCancelling(true);

        try {
            
            const res = await studentAPI.cancelOrder(order._id);
            toast.success(res.data.message || 'Order cancelled successfully');
            setShowCancelModal(false);
            setOrder(prev => ({ ...prev, paymentStatus: 'refunded' }));
            setTimeout(()=> navigate('/student/wallet'), 1500);

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    }

    return (
        <div className="p-6">
            <button
                onClick={() => navigate('/student/orders')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 text-base font-medium"
            >
                <ArrowLeft className="w-5 h-5" /> Back to Orders
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
                    </div>

                    {/* Order Info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-semibold text-gray-700 mb-4 text-base uppercase tracking-wide">Order Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-base">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Order ID</p>
                                <p className="font-mono font-bold text-purple-700">{order.orderId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Order Created</p>
                                <p className="font-medium text-gray-800">{new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            {order.paymentCompletedAt && (
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Payment Completed</p>
                                    <p className="font-medium text-green-700">{new Date(order.paymentCompletedAt).toLocaleString()}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Payment Method</p>
                                {order.paymentMethod === 'wallet' ? (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                        Wallet
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        Razorpay
                                    </span>
                                )}
                            </div>
                            {order.couponCode && (
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Coupon Used</p>
                                    <p className="font-mono font-bold text-green-600">{order.couponCode}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchased Courses */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-semibold text-gray-700 mb-5 text-base uppercase tracking-wide">Purchased Courses</h2>
                        <div className="space-y-4">
                            {order.courses?.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                                    {item.course?.thumbnailURL ? (
                                        <img
                                            src={item.course.thumbnailURL}
                                            alt=""
                                            className={`w-20 h-14 rounded-lg object-cover flex-shrink-0 ${order.paymentStatus === 'completed' ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
                                            onClick={() => order.paymentStatus === 'completed' && navigate(`/student/courses/${item.course._id}/learn`)}
                                        />
                                    ) : (
                                        <div className="w-20 h-14 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-6 h-6 text-purple-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-base font-medium text-gray-800 truncate ${order.paymentStatus === 'completed' ? 'cursor-pointer hover:text-purple-600' : 'cursor-default'}`}
                                            onClick={() => order.paymentStatus === 'completed' && navigate(`/student/courses/${item.course?._id}/learn`)}
                                        >
                                            {item.courseTitle}
                                        </p>
                                        <p className="text-sm text-gray-500">Instructor: {item.tutor?.name}</p>
                                        {order.paymentStatus !== 'completed' && (
                                            <p className="text-sm text-orange-500 mt-1">Complete payment to access this course</p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {item.originalPrice !== item.discountedPrice && (
                                            <p className="text-sm text-gray-400 line-through">₹{Number(item.originalPrice).toFixed(2)}</p>
                                        )}
                                        <p className="font-bold text-gray-800">₹{Number(item.discountedPrice).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* No Refund Notice
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-base text-amber-700">
                        <p className="font-medium mb-2">Purchase Policy</p>
                        <p className="text-sm">All course purchases are final. No refunds or cancellations are available once a course has been purchased and access has been granted.</p>
                    </div> */}
                </div>

                {/* Right Column - Status, Price Breakdown & Actions */}
                <div className="space-y-6">
                    {/* Order Status */}
                    <div className="flex justify-end">
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-base font-medium capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
                            {STATUS_ICON[order.paymentStatus]}
                            {order.paymentStatus}
                        </span>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h2 className="font-semibold text-gray-700 mb-4 text-base uppercase tracking-wide">Price Breakdown</h2>
                        <div className="space-y-3 text-base">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{Number(order.subtotal).toFixed(2)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                    <span>- ₹{Number(order.discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-800 text-lg pt-3 border-t border-gray-100">
                                <span>Total Paid</span>
                                <span>₹{Number(order.finalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {order.paymentStatus === 'refunded' ? (
                        <button
                            disabled
                            className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed opacity-75"
                        >
                            Refunded
                        </button>
                    ) : cancelEligibility.eligible ? (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Cancel & Refund
                        </button>
                    ) : cancelEligibility.reason ? (
                        <div className="text-sm text-gray-500" title={cancelEligibility.reason}>
                            <span className="inline-flex items-center gap-1">
                                <Lock className="w-4 h-4" />
                                Cancellation not available
                            </span>
                        </div>
                    ) : null}

                    {(order.paymentStatus === 'failed' || order.paymentStatus === 'pending') && (
                        <RetryPaymentButton order={order} user={user} onOrderUpdated={refetchOrder} />
                    )}

                    {order.paymentStatus === 'completed' && (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => navigate('/student/my-courses')}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700"
                            >
                                Go to My Courses
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const token = sessionStorage.getItem('cognon_token');
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                        const response = await fetch(
                                            `${apiUrl}/student/orders/${order._id}/invoice`,
                                            { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                        if (!response.ok) throw new Error('Failed to download');
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `invoice-${order.orderId}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        window.URL.revokeObjectURL(url);
                                        toast.success('Downloaded successfully!');
                                    } catch {
                                        toast.error('Failed to download invoice');
                                    }
                                }}
                                className="w-full border border-purple-600 text-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download Invoice
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Cancel Order & Request Refund</h3>
                        <p className="text-gray-600 mb-6">
                            Cancelling will remove your access to all courses in this order. The amount ₹{order.finalAmount.toFixed(2)} will be credited to your wallet. Are you sure?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={cancelling}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                No, Keep Order
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                {cancelling ? 'Processing...' : 'Yes, Cancel & Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
