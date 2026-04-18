import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function StudentOrderDetail() {
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
                                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                                        onClick={() => navigate(`/student/courses/${item.course._id}/learn`)}
                                    />
                                ) : (
                                    <div className="w-14 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-purple-600"
                                        onClick={() => navigate(`/student/courses/${item.course?._id}/learn`)}
                                    >
                                        {item.courseTitle}
                                    </p>
                                    <p className="text-xs text-gray-500">Instructor: {item.tutor?.name}</p>
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

                {order.paymentStatus === 'completed' && (
                    <button
                        onClick={() => navigate('/student/my-courses')}
                        className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700"
                    >
                        Go to My Courses
                    </button>
                )}
            </div>
        </div>
    );
}
