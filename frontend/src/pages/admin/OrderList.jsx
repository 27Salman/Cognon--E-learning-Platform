import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/adminAPI';
import { Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { search, page, limit: 5 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.orders);
      setSummary(res.data.summary);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load orders', { id: 'admin-orders-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [search, statusFilter, page]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Revenue', value: `₹${summary.totalRevenue?.toLocaleString() || 0}`, color: 'bg-green-50 border-green-200' },
          { label: 'Total Orders', value: summary.total || 0, color: 'bg-blue-50 border-blue-200' },
          { label: 'Completed', value: summary.completed || 0, color: 'bg-purple-50 border-purple-200' },
          { label: 'Pending', value: summary.pending || 0, color: 'bg-yellow-50 border-yellow-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color}`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
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
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Order ID</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Courses</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No orders found</td></tr>
            ) : orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-purple-700 font-bold">{order.orderId}</td>
                <td className="px-5 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{order.user?.name}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{order.courses?.length} course(s)</td>
                <td className="px-5 py-3 font-bold text-gray-800">₹{order.finalAmount?.toLocaleString()}</td>
                <td className="px-5 py-3 text-gray-600 text-xs">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
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




