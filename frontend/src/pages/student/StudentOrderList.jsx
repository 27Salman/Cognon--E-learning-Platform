import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../api/studentAPI';
import { ShoppingCart, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    completed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    failed:    'bg-red-100 text-red-700',
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
            const params = { search, page, limit: 5 };
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
        <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <ShoppingCart className="w-7 h-7 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[250px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Order ID..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingCart className="w-20 h-20 text-gray-300 mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-600 mb-3">No orders yet</h2>
                    <p className="text-gray-400 mb-8 text-lg">Your purchase history will appear here</p>
                    <button
                        onClick={() => navigate(ROUTES.STUDENT_COURSE_CATALOG)}
                        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700"
                    >
                        Browse Courses
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Order ID</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Course</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Amount</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Date</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <tr
                                    key={order._id}
                                    onClick={() => navigate(`/student/orders/${order._id}`)}
                                    className="hover:bg-purple-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-5 font-mono text-sm text-purple-700 font-bold">
                                        {order.orderId}
                                    </td>
                                    <td className="px-6 py-5 text-gray-700 max-w-[300px]">
                                        {order.courses?.length === 1
                                            ? <span className="truncate block">{order.courses[0].courseTitle}</span>
                                            : <span className="text-gray-500">{order.courses?.length} courses</span>
                                        }
                                    </td>
                                    <td className="px-6 py-5 font-semibold text-gray-800 text-base">
                                        ₹{order.finalAmount}
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 text-sm whitespace-nowrap">
                                        {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: '2-digit', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                        ‹
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
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
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}
