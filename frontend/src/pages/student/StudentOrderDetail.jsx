import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const STATUS_ICON = {
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
    pending: <Clock className="w-5 h-5 text-yellow-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
};

const STATUS_COLORS = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
};

function RetryPaymentButton({ order, user }) {
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
            toast.error(err.response?.data?.message || 'Failed to initiate retry');
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

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-64">
                <div className="text-gray-400">Loading order...</div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="p-6">
            <button
                onClick={() => navigate('/student/orders')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Orders
            </button>

            <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
                        {STATUS_ICON[order.paymentStatus]}
                        {order.paymentStatus}
                    </span>
                </div>

                {/* Order Info */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                    <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Order Information</h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs mb-0.5">Order ID</p>
                            <p className="font-mono font-bold text-purple-700">{order.orderId}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-0.5">Order Date</p>
                            <p className="font-medium text-gray-800">{new Date(order.orderDate).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-0.5">Payment Method</p>
                            <p className="font-medium text-gray-800 capitalize">{order.paymentMethod}</p>
                        </div>
                        {order.couponCode && (
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5">Coupon Used</p>
                                <p className="font-mono font-bold text-green-600">{order.couponCode}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Purchased Courses */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                    <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Purchased Courses</h2>
                    <div className="space-y-3">
                        {order.courses?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                {item.course?.thumbnailURL ? (
                                    <img
                                        src={item.course.thumbnailURL}
                                        alt=""
                                        className={`w-14 h-10 rounded-lg object-cover flex-shrink-0 ${order.paymentStatus === 'completed' ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
                                        onClick={() => order.paymentStatus === 'completed' && navigate(`/student/courses/${item.course._id}/learn`)}
                                    />
                                ) : (
                                    <div className="w-14 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm font-medium text-gray-800 truncate ${order.paymentStatus === 'completed' ? 'cursor-pointer hover:text-purple-600' : 'cursor-default'}`}
                                        onClick={() => order.paymentStatus === 'completed' && navigate(`/student/courses/${item.course?._id}/learn`)}
                                    >
                                        {item.courseTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">Instructor: {item.tutor?.name}</p>
                                    {order.paymentStatus !== 'completed' && (
                                        <p className="text-xs text-orange-500 mt-0.5">Complete payment to access this course</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {item.originalPrice !== item.discountedPrice && (
                                        <p className="text-xs text-gray-400 line-through">₹{item.originalPrice}</p>
                                    )}
                                    <p className="font-bold text-gray-800 text-sm">₹{item.discountedPrice}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                    <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Price Breakdown</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                                <span>- ₹{order.discount}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-100">
                            <span>Total Paid</span>
                            <span>₹{order.finalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* No Refund Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                    <p className="font-medium mb-1">Purchase Policy</p>
                    <p className="text-xs">All course purchases are final. No refunds or cancellations are available once a course has been purchased and access has been granted.</p>
                </div>

                {(order.paymentStatus === 'failed' || order.paymentStatus === 'pending') && (
                    <RetryPaymentButton order={order} user={user} />
                )}

                {order.paymentStatus === 'completed' && (
                    <div className="flex flex-col gap-2 mt-4">
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
                            <Download className="w-4 h-4" />
                            Download Invoice
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
