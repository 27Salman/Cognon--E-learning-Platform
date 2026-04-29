import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, BookOpen, ArrowRight, ShoppingBag, Download } from 'lucide-react';
import StudentNavbar from '../../components/student/StudentNavbar';
import { useSelector } from 'react-redux';

export default function OrderSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);
    const order = location.state?.order;

    if (!order) {
        navigate('/student/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StudentNavbar studentInfo={user} />
            <div className="max-w-lg mx-auto px-4 py-16 text-center">
                {/* Success Icon — matches Figma */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Complete</h1>
                <p className="text-gray-500 mb-2">You Will Receive a confirmation email soon!</p>
                <p className="text-sm font-mono text-purple-700 font-bold mb-4">
                    Order ID: {order.orderId}
                </p>

                {/* Download Invoice link — matches Figma */}
                <button
                    onClick={async () => {
                        try {
                            const token = sessionStorage.getItem('cognon_token');
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                            const response = await fetch(
                                `${apiUrl}/student/orders/${order._id}/invoice`,
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                            if (!response.ok) throw new Error('Failed');
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `invoice-${order.orderId}.pdf`);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                        } catch {
                            // silently ignore
                        }
                    }}
                    className="mb-8 flex items-center justify-center gap-1.5 text-purple-600 font-bold text-sm uppercase tracking-wide hover:text-purple-800 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download Invoice
                </button>

                {/* Enrolled Courses */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 text-left">
                    <h2 className="font-semibold text-gray-700 mb-3">Enrolled Courses</h2>
                    <div className="space-y-3">
                        {order.courses?.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                {item.course?.thumbnailURL ? (
                                    <img
                                        src={item.course.thumbnailURL}
                                        alt={item.courseTitle}
                                        className="w-12 h-9 rounded-lg object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.courseTitle}</p>
                                    <p className="text-xs text-gray-500">{item.tutor?.name}</p>
                                </div>
                                <p className="text-sm font-bold text-gray-800 flex-shrink-0">₹{item.discountedPrice}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-800">
                        <span>Total Paid</span>
                        <span>₹{order.finalAmount}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate('/student/my-courses')}
                        className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Go to My Courses
                    </button>
                    <button
                        onClick={() => navigate(`/student/orders/${order._id}`)}
                        className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        View Order Details
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <button
                    onClick={() => navigate('/student/courses')}
                    className="mt-4 text-sm text-purple-600 hover:underline"
                >
                    Continue Shopping
                </button>
            </div>
        </div>
    );
}







