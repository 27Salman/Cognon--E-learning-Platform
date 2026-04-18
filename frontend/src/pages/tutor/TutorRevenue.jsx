import { useState, useEffect } from 'react';
import { tutorAPI } from '../../api/tutorAPI';
import { TrendingUp, DollarSign, Users, BookOpen, Search, ChevronRight } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export default function TutorRevenue() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseDetails, setCourseDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailSearch, setDetailSearch] = useState('');
    const [detailPage, setDetailPage] = useState(1);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await tutorAPI.getRevenueDashboard();
                setData(res.data);
            } catch {
                toast.error('Failed to load revenue data', { id: 'revenue-error' });
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, []);

    const fetchCourseDetails = async (courseId, page = 1, search = '') => {
        setDetailLoading(true);
        try {
            const res = await tutorAPI.getCourseRevenueDetails(courseId, { page, limit: 5, search });
            setCourseDetails(res.data);
        } catch {
            toast.error('Failed to load course details', { id: 'revenue-course-error' });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCourseClick = (course) => {
        setSelectedCourse(course);
        setDetailSearch('');
        setDetailPage(1);
        fetchCourseDetails(course._id, 1, '');
    };

    const handleDetailSearch = (e) => {
        setDetailSearch(e.target.value);
        setDetailPage(1);
        fetchCourseDetails(selectedCourse._id, 1, e.target.value);
    };

    const filteredCourses = data?.courses?.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <div className="flex-1 p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-48" />
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
                        </div>
                        <div className="h-64 bg-gray-200 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    // Course detail view
    if (selectedCourse) {
        return (
            <div className="flex-1 p-6">
                <button
                    onClick={() => { setSelectedCourse(null); setCourseDetails(null); }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm font-medium"
                >
                    ← Back to Revenue
                </button>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedCourse.title}</h1>
                <p className="text-gray-500 text-sm mb-6">Revenue Details</p>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Enrollments', value: courseDetails?.course?.totalEnrollments || 0 },
                        { label: 'Course Price', value: `₹${courseDetails?.course?.price || 0}` },
                        { label: 'Total Revenue', value: `₹${courseDetails?.course?.totalRevenue || 0}` },
                        { label: 'Your Earnings (90%)', value: `₹${courseDetails?.course?.tutorTotalEarning || 0}` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-xl font-bold text-gray-800">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Enrollments Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700">Student Enrollments</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={detailSearch}
                                onChange={handleDetailSearch}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Original Price</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Final Price</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Your Earning</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Coupon</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {detailLoading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : courseDetails?.enrollments?.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No enrollments yet</td></tr>
                            ) : courseDetails?.enrollments?.map((enrollment, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{enrollment.student?.name}</p>
                                            <p className="text-xs text-gray-500">{enrollment.student?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600">₹{enrollment.originalPrice}</td>
                                    <td className="px-5 py-3 font-medium text-gray-800">₹{enrollment.finalPrice}</td>
                                    <td className="px-5 py-3 font-bold text-green-600">₹{enrollment.tutorEarning}</td>
                                    <td className="px-5 py-3">
                                        {enrollment.couponUsed ? (
                                            <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                {enrollment.couponUsed}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-gray-600 text-xs">
                                        {new Date(enrollment.purchaseDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {courseDetails?.pagination?.totalPages > 1 && (
                        <div className="flex justify-center gap-2 p-4">
                            {Array.from({ length: courseDetails.pagination.totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p}
                                    onClick={() => { setDetailPage(p); fetchCourseDetails(selectedCourse._id, p, detailSearch); }}
                                    className={`w-8 h-8 rounded-full text-sm font-medium ${p === detailPage ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Main revenue dashboard
    return (
        <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">Revenue Dashboard</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Earnings', value: `₹${data?.summary?.totalEarnings?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
                    { label: 'Total Enrollments', value: data?.summary?.totalEnrollments || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Total Courses', value: data?.summary?.totalCourses || 0, icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Active Courses', value: data?.summary?.activeCourses || 0, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 font-medium">{label}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.split(' ')[1]}`}>
                                <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{value}</p>
                    </div>
                ))}
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h2 className="font-semibold text-gray-700 mb-4">Monthly Revenue (Last 12 Months)</h2>
                {data?.monthlyRevenue?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data.monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Earnings']} />
                            <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Earnings" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                        No revenue data yet
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Revenue Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700">Revenue by Course</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredCourses.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">No courses found</div>
                        ) : filteredCourses.map((course) => (
                            <div
                                key={course._id}
                                onClick={() => handleCourseClick(course)}
                                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                            >
                                {course.thumbnail ? (
                                    <img src={course.thumbnailURL || course.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{course.title}</p>
                                    <p className="text-xs text-gray-500">{course.enrolledCount} students · ₹{course.price}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-green-600">₹{course.tutorEarning}</p>
                                    <p className="text-xs text-gray-400">your share</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Enrollments */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-700">Recent Enrollments</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data?.recentEnrollments?.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">No enrollments yet</div>
                        ) : data?.recentEnrollments?.map((enrollment, i) => (
                            <div key={i} className="flex items-center gap-3 p-4">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-purple-600 font-bold text-xs">
                                        {enrollment.student?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{enrollment.student?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{enrollment.courseTitle}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold text-green-600">+₹{enrollment.tutorEarning}</p>
                                    <p className="text-xs text-gray-400">{new Date(enrollment.purchaseDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}




