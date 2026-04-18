import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ShoppingCart, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
};

export default function StudentOrderList() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = { search, page, limit: 10 };
            if (statusFilter !== 'all') params.status = statusFilter;
            const res = await studentAPI.getMyOrders(params);
            setOrders(res.data.orders);
            setPagination(res.data.pagination);
        } catch {
            toast.error('Failed to load orders', { id: 'orders-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [search, statusFilter, page]);

    return (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order ID..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h2>
                    <p className="text-gray-400 mb-6">Your purchase history will appear here</p>
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700"
                    >
                        Browse Courses
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Order ID</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Courses</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-mono text-xs text-purple-700 font-bold">{order.orderId}</td>
                                    <td className="px-5 py-3 text-gray-600">{order.courses?.length} course(s)</td>
                                    <td className="px-5 py-3 font-bold text-gray-800">₹{order.finalAmount}</td>
                                    <td className="px-5 py-3 text-gray-500 text-xs">
                                        {new Date(order.orderDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => navigate(`/student/orders/${order._id}`)}
                                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-full text-sm font-medium ${p === page ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}




