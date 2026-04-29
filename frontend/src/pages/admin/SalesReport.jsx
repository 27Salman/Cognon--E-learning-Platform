import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/adminAPI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalesReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    groupBy: 'monthly',
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      params.groupBy = filters.groupBy;
      const res = await adminAPI.getSalesReport(params);
      setReport(res.data.data);
    } catch {
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      params.groupBy = filters.groupBy;

      const res = type === 'pdf'
        ? await adminAPI.downloadSalesReportPDF(params)
        : await adminAPI.downloadSalesReportExcel(params);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Failed to download ${type.toUpperCase()}`);
    } finally {
      setDownloading('');
    }
  };

  const summaryCards = report ? [
    { label: 'Total Orders', value: report.summary.totalOrders },
    { label: 'Total Revenue', value: `₹${Math.round(report.summary.totalRevenue).toLocaleString('en-IN')}` },
    { label: 'Platform Revenue', value: `₹${Math.round(report.summary.totalPlatformRevenue).toLocaleString('en-IN')}` },
    { label: 'Tutor Payouts', value: `₹${Math.round(report.summary.totalTutorRevenue).toLocaleString('en-IN')}` },
  ] : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Report</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={!!downloading || !report}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {downloading === 'pdf' ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={() => handleDownload('excel')}
            disabled={!!downloading || !report}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {downloading === 'excel' ? 'Downloading...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Group By</label>
          <select
            value={filters.groupBy}
            onChange={e => setFilters(f => ({ ...f, groupBy: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Apply'}
        </button>
        <button
          onClick={() => { setFilters({ dateFrom: '', dateTo: '', groupBy: 'monthly' }); }}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      )}

      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {summaryCards.map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">Revenue Breakdown</h2>
            {report.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={report.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#7c3aed" radius={[4,4,0,0]} />
                  <Bar dataKey="platformRevenue" name="Platform" fill="#a78bfa" radius={[4,4,0,0]} />
                  <Bar dataKey="tutorRevenue" name="Tutor Payout" fill="#c4b5fd" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-10">No data for selected period</p>
            )}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 mb-4">Orders ({report.orders.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Order ID</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Student</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Courses</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Amount</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map(order => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-purple-700 text-xs font-bold">{order.orderId}</td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-800">{order.user?.name}</p>
                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(order.orderDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-gray-600 text-xs max-w-xs truncate">
                        {order.courses.map(c => c.courseTitle).join(', ')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-gray-800">
                        ₹{order.finalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {report.orders.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No orders found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}





