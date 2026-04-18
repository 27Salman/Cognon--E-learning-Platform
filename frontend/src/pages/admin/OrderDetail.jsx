import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/adminAPI';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed: 'text-green-600',
  pending: 'text-yellow-600',
  failed: 'text-red-600',
  refunded: 'text-gray-600',
};

const STATUS_BG = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await adminAPI.getOrderById(id);
      setOrder(res.data);
    } catch {
      toast.error('Failed to load order', { id: 'admin-order-detail-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await adminAPI.updatePaymentStatus(id, newStatus);
      toast.success('Payment status updated');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-gray-400">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/admin/orders')} className="mt-4 text-purple-600 hover:underline text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  const platformRevenue = order.courses?.reduce((sum, item) => sum + (item.platformShare || 0), 0) || 0;
  const tutorRevenue = order.courses?.reduce((sum, item) => sum + (item.tutorShare || 0), 0) || 0;

  return (
    <div className="p-6 max-w-3xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Details</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_BG[order.paymentStatus]}`}>
          {order.paymentStatus}
        </span>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Order Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Order ID</p>
            <p className="font-mono font-bold text-purple-700">{order.orderId}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Order Date</p>
            <p className="font-medium text-gray-800">{new Date(order.orderDate).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Payment Method</p>
            <p className="font-medium text-gray-800 capitalize">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Payment Status</p>
            <p className={`font-bold capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
              {order.paymentStatus}
            </p>
          </div>
          {order.razorpayOrderId && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Razorpay Order ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{order.razorpayOrderId}</p>
            </div>
          )}
          {order.razorpayPaymentId && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Razorpay Payment ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{order.razorpayPaymentId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Student Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Student Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Name</p>
            <p className="font-medium text-gray-800">{order.user?.name}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Email</p>
            <p className="font-medium text-gray-800">{order.user?.email}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Phone</p>
            <p className="font-medium text-gray-800">{order.user?.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Purchased Courses */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Purchased Courses</h2>
        <div className="space-y-3">
          {order.courses?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                {item.course?.thumbnailURL ? (
                  <img src={item.course.thumbnailURL} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                    {item.courseTitle?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.courseTitle}</p>
                  <p className="text-xs text-gray-500">Tutor: {item.tutor?.name}</p>
                </div>
              </div>
              <div className="text-right text-sm flex-shrink-0 ml-4">
                {item.originalPrice !== item.discountedPrice && (
                  <p className="text-gray-400 line-through text-xs">₹{item.originalPrice}</p>
                )}
                <p className="font-bold text-gray-800">₹{item.discountedPrice}</p>
                <p className="text-xs text-gray-400">Tutor share: ₹{item.tutorShare}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Price Breakdown</h2>
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
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Platform Revenue (10%)</span>
              <span>₹{Math.round(platformRevenue)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tutor Revenue (90%)</span>
              <span>₹{Math.round(tutorRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Payment Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Update Payment Status</h2>
        <div className="flex flex-wrap gap-2">
          {['completed', 'pending', 'failed', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={updating || order.paymentStatus === status}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                order.paymentStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        {updating && <p className="text-xs text-gray-400 mt-2">Updating...</p>}
      </div>
    </div>
  );
}
