import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { fetchDashboard } from '../../store/slices/courseSlice';
import { tutorAPI } from '../../api/tutorAPI';
import { TUTOR_APPROVAL_STATUS } from '../../utils/constants';

const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
];

export default function TutorDashboard() {
    const { tutorInfo } = useOutletContext();
    const dispatch = useDispatch();
    const { dashboard, loading } = useSelector(state => state.courses);
    const [chartPeriod, setChartPeriod] = useState('week');
    const [monthlyData, setMonthlyData] = useState([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const approvalStatus = tutorInfo?.tutorProfile?.approvalStatus;
    const isApproved = approvalStatus === TUTOR_APPROVAL_STATUS.APPROVED;
    const showPendingWarning = approvalStatus && !isApproved;

    useEffect(() => {
        dispatch(fetchDashboard());
    }, [dispatch]);

    useEffect(() => {
        const needsMonthly = chartPeriod === 'month';        
        if (needsMonthly && monthlyData.length === 0) {
            setMonthlyLoading(true);
            tutorAPI.getRevenueDashboard()
                .then(res => {
                    const data = res.data || res;
                    setMonthlyData(data.monthlyRevenue || []);
                })
                .catch(() => {})
                .finally(() => setMonthlyLoading(false));
        }
    }, [chartPeriod]);

    const defaultWeekly = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
        day, students: 0, revenue: 0
    }));

    const weeklyChartData = dashboard?.weeklyChart || defaultWeekly;

    const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayData = weeklyChartData.filter(d => d.day === todayName);

    const allMonthlyChartData = monthlyData.map(m => {
        const [year, mon] = (m.month || '').split('-');
        const label = mon
            ? new Date(Number(year), Number(mon) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' })
            : m.month;
        return {
            day: label,
            students: m.enrollments || 0,
            revenue: m.revenue || 0,
        };
    });

    const getActiveData = () => {
        switch (chartPeriod) {
            case 'today':
                return todayData;

            case 'week':
                return weeklyChartData;

            case 'month':
                return allMonthlyChartData;

            default:
                return weeklyChartData;
        }
    };

    const activeChartData = getActiveData();
    const isChartLoading = chartPeriod === 'month' ? monthlyLoading : loading;
    const useBarChart = chartPeriod === 'today';

    const stats = [
        { label: 'Students',      value: dashboard?.totalStudents ?? 0,                                    icon: Users,      color: 'text-blue-500' },
        { label: 'Total Courses', value: dashboard?.totalCourses ?? 0,                                     icon: BookOpen,   color: 'text-purple-300' },
        { label: 'Active Courses',value: dashboard?.activeCourses ?? 0,                                    icon: TrendingUp, color: 'text-green-300' },
        { label: 'Total Revenue', value: `₹${(dashboard?.totalRevenue ?? 0).toLocaleString('en-IN')}`,    icon: DollarSign, color: 'text-yellow-300' },
    ];

    return (
        <div className="p-6">
            {showPendingWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                    <p className="text-sm font-medium text-amber-800">Account pending approval</p>
                    <p className="text-sm text-amber-600 mt-0.5">
                        Your tutor account is awaiting admin approval before you can publish courses.
                    </p>
                </div>
            )}

            {/* Dashboard card */}
            <div className="bg-purple-700 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-6 mb-6">
                    {stats.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{loading ? '…' : value}</p>
                                <p className="text-xs text-purple-200">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Analysis</p>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            {PERIODS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setChartPeriod(key)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                        chartPeriod === key
                                            ? 'bg-white text-purple-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {isChartLoading ? (
                        <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm animate-pulse">
                            Loading chart…
                        </div>
                    ) : activeChartData.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                            No data for this period
                        </div>
                    ) : useBarChart ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={activeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Bar dataKey="students" fill="#ef4444" name="Students" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="revenue" fill="#7c3aed" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={activeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                <Line type="monotone" dataKey="students" stroke="#ef4444" strokeWidth={2} dot={false} name="Students" />
                                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} name="Revenue (₹)" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Course table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-700">Course Overview</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {['Course Name', 'Students', 'Enrolled', 'Revenue', 'Status'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold whitespace-nowrap text-xs">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : dashboard?.recentCourses?.length > 0 ? (
                                dashboard.recentCourses.map(course => (
                                    <tr key={course._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{course.title}</td>
                                        <td className="px-4 py-3 text-gray-600">{course.studentsCount}</td>
                                        <td className="px-4 py-3 text-gray-600">{course.studentsCount}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">₹{(course.revenue || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                course.status === 'published'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {course.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                                        No courses yet. Create your first course!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


