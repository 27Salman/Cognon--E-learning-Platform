import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/adminAPI';
import {
  TrendingUp, Users, BookOpen, ShoppingCart,
  GraduationCap, DollarSign
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getDashboardStats();
        setStats(res.data);
      } catch {
        toast.error('Failed to load dashboard stats', { id: 'dashboard-error' });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
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

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `₹${stats?.summary?.totalRevenue?.toLocaleString() || 0}`,
      sub: `₹${stats?.summary?.monthlyRevenue?.toLocaleString() || 0} this month`,
      icon: DollarSign,
      color: 'bg-green-50 border-green-200 text-green-600'
    },
    {
      label: 'Total Students',
      value: stats?.summary?.totalStudents || 0,
      sub: 'Registered students',
      icon: GraduationCap,
      color: 'bg-blue-50 border-blue-200 text-blue-600'
    },
    {
      label: 'Total Tutors',
      value: stats?.summary?.totalTutors || 0,
      sub: 'Active tutors',
      icon: Users,
      color: 'bg-purple-50 border-purple-200 text-purple-600'
    },
    {
      label: 'Published Courses',
      value: stats?.summary?.publishedCourses || 0,
      sub: `${stats?.summary?.totalCourses || 0} total courses`,
      icon: BookOpen,
      color: 'bg-orange-50 border-orange-200 text-orange-600'
    },
    {
      label: 'Total Orders',
      value: stats?.summary?.totalOrders || 0,
      sub: `${stats?.summary?.revenueGrowth >= 0 ? '+' : ''}${stats?.summary?.revenueGrowth || 0}% vs last month`,
      icon: ShoppingCart,
      color: 'bg-pink-50 border-pink-200 text-pink-600'
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {summaryCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`border rounded-xl p-4 ${color.split(' ').slice(0, 2).join(' ')}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <Icon className={`w-4 h-4 ${color.split(' ')[2]}`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Revenue Trend (Last 12 Months)</h2>
        {stats?.monthlyChart?.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
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
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No revenue data yet
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
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
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/admin/orders/${order._id}`)}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded px-1"
                >
                  <div>
                    <p className="text-xs font-mono text-purple-700 font-bold">{order.orderId}</p>
                    <p className="text-xs text-gray-500">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">₹{order.finalAmount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No orders yet</p>
          )}
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Top Courses</h2>
            <button
              onClick={() => navigate('/admin/courses')}
              className="text-xs text-purple-600 hover:underline font-medium"
            >
              View all
            </button>
          </div>
          {stats?.topCourses?.length > 0 ? (
            <div className="space-y-3">
              {stats.topCourses.map((course, i) => (
                <div key={course._id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">
                      {course.title?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.enrolledCount} students</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                    ₹{course.revenue?.toLocaleString() || 0}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No course data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
