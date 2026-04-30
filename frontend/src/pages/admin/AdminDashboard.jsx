import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/adminAPI';
import {
  Users, BookOpen, GraduationCap, DollarSign,
  FileText, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

function getPresetRange(preset) {
  const now = new Date();
  if (preset === 'this_month') {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      dateTo: now.toISOString().slice(0, 10),
    };
  }
  if (preset === 'last_month') {
    return {
      dateFrom: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
      dateTo: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
    };
  }
  if (preset === 'this_year') {
    return {
      dateFrom: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
      dateTo: now.toISOString().slice(0, 10),
    };
  }
  return { dateFrom: '', dateTo: '' };
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloading, setDownloading] = useState('');

  const [preset, setPreset] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getDashboardStats();
        setStats(res.data);
      } catch {
        toast.error('Failed to load dashboard stats', { id: 'dashboard-error' });
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  const fetchReport = useCallback(async (from, to) => {
    setReportLoading(true);
    try {
      const params = { groupBy: 'monthly' };
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;
      const res = await adminAPI.getSalesReport(params);
      setReport(res.data);
    } catch {
      toast.error('Failed to load sales data');
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport('', ''); }, [fetchReport]);

  const handlePreset = (p) => {
    setPreset(p);
    if (p === 'all') {
      setDateFrom(''); setDateTo('');
      fetchReport('', '');
    } else {
      const { dateFrom: f, dateTo: t } = getPresetRange(p);
      setDateFrom(f); setDateTo(t);
      fetchReport(f, t);
    }
  };

  const handleApply = () => {
    setPreset('custom');
    fetchReport(dateFrom, dateTo);
  };

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      const params = { groupBy: 'monthly' };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const mimeType = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';

      const res = type === 'pdf'
        ? await adminAPI.downloadSalesReportPDF(params)
        : await adminAPI.downloadSalesReportExcel(params);

      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Failed to download ${type.toUpperCase()}`);
    } finally {
      setDownloading('');
    }
  };

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const s = stats?.summary || {};
  const reportSummary = report?.summary;
  const chartIsFiltered = preset !== 'all' || !!(dateFrom || dateTo);
  const chartData = chartIsFiltered
    ? (report?.chartData || [])
    : (stats?.monthlyChart || []);
  const chartXKey = chartIsFiltered ? 'period' : 'label';
  const chartTitle = chartIsFiltered
    ? 'Revenue & Profit Overview (Filtered)'
    : 'Revenue & Profit Overview (Last 12 Months)';

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: `₹${(s.monthlyRevenue || 0).toLocaleString('en-IN')} this month`,
      icon: DollarSign,
      color: 'bg-green-50 border-green-200 text-green-600',
    },
    {
      label: 'Platform Revenue',
      value: reportSummary
        ? `₹${Math.round(reportSummary.totalPlatformRevenue).toLocaleString('en-IN')}`
        : '—',
      sub: 'Admin earnings',
      icon: DollarSign,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    },
    {
      label: 'Tutor Payouts',
      value: reportSummary
        ? `₹${Math.round(reportSummary.totalTutorRevenue).toLocaleString('en-IN')}`
        : '—',
      sub: 'Tutor earnings',
      icon: Users,
      color: 'bg-violet-50 border-violet-200 text-violet-600',
    },
    {
      label: 'Total Orders',
      value: s.totalOrders || 0,
      sub: `${s.revenueGrowth >= 0 ? '+' : ''}${s.revenueGrowth || 0}% vs last month`,
      icon: FileText,
      color: 'bg-pink-50 border-pink-200 text-pink-600',
    },
    {
      label: 'Total Courses',
      value: s.totalCourses || 0,
      sub: `Active: ${s.publishedCourses || 0}`,
      icon: BookOpen,
      color: 'bg-orange-50 border-orange-200 text-orange-600',
    },
    {
      label: 'Total Tutors',
      value: s.totalTutors || 0,
      sub: 'Registered tutors',
      icon: Users,
      color: 'bg-purple-50 border-purple-200 text-purple-600',
    },
    {
      label: 'Total Students',
      value: s.totalStudents || 0,
      sub: 'Registered students',
      icon: GraduationCap,
      color: 'bg-blue-50 border-blue-200 text-blue-600',
    },
  ];

  const presetBtns = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_year', label: 'This Year' },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome to your admin dashboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            {downloading === 'pdf' ? 'Downloading…' : 'Download PDF'}
          </button>
          <button
            onClick={() => handleDownload('excel')}
            disabled={!!downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {downloading === 'excel' ? 'Downloading…' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Date filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {presetBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handlePreset(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                preset === key
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400 hover:text-purple-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Custom Range:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPreset('custom'); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPreset('custom'); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleApply}
            disabled={reportLoading}
            className="px-5 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {reportLoading ? 'Loading…' : 'Apply'}
          </button>
          <button
            onClick={() => handlePreset('all')}
            className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary Cards — 4 per row on lg */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color.split(' ').slice(0, 2).join(' ')}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
              <Icon className={`w-4 h-4 flex-shrink-0 ${color.split(' ')[2]}`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Profit Chart — uses filtered report.chartData when a filter is active, otherwise last 12 months */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">{chartTitle}</h2>
          {reportLoading && <span className="text-xs text-gray-400 animate-pulse">Updating…</span>}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={chartXKey}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, name]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Revenue"
              />
              {chartIsFiltered && (
                <Line
                  type="monotone"
                  dataKey="platformRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Platform Revenue"
                />
              )}
              {chartIsFiltered && (
                <Line
                  type="monotone"
                  dataKey="tutorRevenue"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Tutor Payout"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            {reportLoading ? 'Loading chart…' : 'No revenue data for selected period'}
          </div>
        )}
      </div>

      {/* Recent Orders — full width */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Recent Orders</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-purple-600 hover:underline font-medium"
          >
            View all
          </button>
        </div>
        {stats?.recentOrders?.length > 0 ? (
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
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-2 px-3 font-mono text-purple-700 text-xs font-bold">{order.orderId}</td>
                    <td className="py-2 px-3">
                      <p className="font-medium text-gray-800 text-sm">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {new Date(order.orderDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs max-w-xs truncate">
                      {order.courses?.map(c => c.courseTitle || c.course?.title).join(', ')}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-800">
                      ₹{order.finalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">No orders yet</p>
        )}
      </div>

    </div>
  );
}
