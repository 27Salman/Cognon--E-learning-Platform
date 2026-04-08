import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Users, BookOpen, DollarSign } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { fetchDashboard } from '../../store/slices/courseSlice';
import { TUTOR_APPROVAL_STATUS } from '../../utils/constants';

const buildChartData = (courses = []) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => ({
        day,
        students: Math.round((courses.reduce((s, c) => s + (c.studentsCount || 0), 0) / 7) * (0.6 + Math.sin(i) * 0.4)),
        revenue: Math.round((courses.reduce((s, c) => s + (c.revenue || 0), 0) / 7) * (0.5 + Math.cos(i) * 0.5)),
    }));
};

export default function TutorDashboard() {
    const { tutorInfo } = useOutletContext();
    const dispatch = useDispatch();
    const { dashboard, loading } = useSelector(state => state.courses);

    const approvalStatus = tutorInfo?.tutorProfile?.approvalStatus;
    const isApproved = approvalStatus === TUTOR_APPROVAL_STATUS.APPROVED;
    const showPendingWarning = approvalStatus && !isApproved;

    useEffect(() => {
        dispatch(fetchDashboard());
    }, [dispatch]);

    const chartData = buildChartData(dashboard?.recentCourses || []);

    const stats = [
        { label: 'Students', value: dashboard?.totalStudents ?? 0, icon: '👤' },
        { label: 'Total Courses', value: dashboard?.totalCourses ?? 0, icon: '▶' },
        { label: 'Total Revenue', value: `₹${(dashboard?.totalRevenue ?? 0).toLocaleString()}`, icon: '💳' },
    ];

    return (
        <div className="p-6">
            {showPendingWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                    <p className="text-sm font-medium text-amber-800">Account pending approval</p>
                    <p className="text-sm text-amber-600 mt-0.5">Your tutor account is awaiting admin approval before you can publish courses.</p>
                </div>
            )}

            {/* Dashboard card */}
            <div className="bg-purple-700 rounded-2xl p-6 mb-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <div className="flex gap-2">
                        <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                            Download PDF
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                            Download Excel
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-8 mb-6">
                    {stats.map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                                {icon}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{loading ? '...' : value}</p>
                                <p className="text-xs text-purple-200">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Analysis</p>
                        <span className="text-xs text-gray-400">This week</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#374151', fontSize: 12 }}
                                labelStyle={{ color: '#6b7280' }}
                            />
                            <Line type="monotone" dataKey="students" stroke="#ef4444" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Course table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {['Course Name', 'Students', 'Enrolled', 'Drafts', 'Notice', 'Status'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : dashboard?.recentCourses?.length > 0 ? (
                                dashboard.recentCourses.map(course => (
                                    <tr key={course._id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{course.title}</td>
                                        <td className="px-4 py-3 text-gray-600">{course.studentsCount}</td>
                                        <td className="px-4 py-3 text-gray-600">{course.studentsCount}</td>
                                        <td className="px-4 py-3 text-gray-600">—</td>
                                        <td className="px-4 py-3 text-gray-600">₹{course.revenue}</td>
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
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
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
