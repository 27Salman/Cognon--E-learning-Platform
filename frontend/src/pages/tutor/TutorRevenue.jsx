import { useState, useEffect } from 'react';
import { tutorAPI } from '../../api/tutorAPI';
import { Search, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, ArrowLeft, DollarSign, Users, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';


//List 
function RevenueList({ onCourseClick }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [downloading, setDownloading] = useState('');
    const [sort, setSort] = useState('relevance');
    const [page, setPage] = useState(1);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const LIMIT = 5;

    useEffect(() => {
        (async () => {
            try {
                const res = await tutorAPI.getRevenueDashboard();
                setData(res.data);
            } catch {
                toast.error('Failed to load revenue data', { id: 'revenue-error' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDownload = async (type) => {
        if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
            toast.error('Start date cannot be after end date');
            return;
        }
        setDownloading(type);
        try {
            const mimeType = type === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const ext = type === 'pdf' ? 'pdf' : 'xlsx';
            const params = {};
            if (dateFrom) params.dateFrom = dateFrom;
            if (dateTo) params.dateTo = dateTo;

            const res = type === 'pdf'
                ? await tutorAPI.downloadSalesReportPDF(params)
                : await tutorAPI.downloadSalesReportExcel(params);

            const blob = new Blob([res.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tutor-sales-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success(`${type.toUpperCase()} report downloaded`);
        } catch {
            toast.error(`Failed to download ${type.toUpperCase()}`);
        } finally {
            setDownloading('');
        }
    };

    if (loading) {
        return (
            <div className="p-6 animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-32" />
                <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
        );
    }

    let courses = (data?.courses || []).filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    if (sort === 'revenue_desc') courses = [...courses].sort((a, b) => b.totalRevenue - a.totalRevenue);
    else if (sort === 'revenue_asc') courses = [...courses].sort((a, b) => a.totalRevenue - b.totalRevenue);
    else if (sort === 'students_desc') courses = [...courses].sort((a, b) => b.enrolledCount - a.enrolledCount);
    else if (sort === 'newest') courses = [...courses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalPages = Math.ceil(courses.length / LIMIT);
    const paginated = courses.slice((page - 1) * LIMIT, page * LIMIT);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Revenue</h1>

            {/* Overall summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: 'Total Earnings',
                        value: `₹${(data?.summary?.totalEarnings || 0).toLocaleString('en-IN')}`,
                        sub: 'Your share after platform cut',
                        icon: DollarSign,
                        color: 'bg-green-50 text-green-600',
                    },
                    {
                        label: 'Total Revenue',
                        value: `₹${(data?.summary?.totalRevenue || 0).toLocaleString('en-IN')}`,
                        sub: 'Gross amount paid by students',
                        icon: TrendingUp,
                        color: 'bg-emerald-50 text-emerald-600',
                    },
                    {
                        label: 'Total Enrollments',
                        value: data?.summary?.totalEnrollments || 0,
                        sub: 'Across all courses',
                        icon: Users,
                        color: 'bg-blue-50 text-blue-600',
                    },
                    {
                        label: 'Active Courses',
                        value: data?.summary?.activeCourses || 0,
                        sub: `${data?.summary?.totalCourses || 0} total courses`,
                        icon: BookOpen,
                        color: 'bg-purple-50 text-purple-600',
                    },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className={`rounded-xl border border-gray-200 p-4 ${color.split(' ')[0]}`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-500">{label}</p>
                            <Icon className={`w-4 h-4 ${color.split(' ')[1]}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    Download Sales Report
                </p>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || today}
                            onChange={e => setDateFrom(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            max={today}
                            onChange={e => setDateTo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r bg-purple-500 hover:from-purple-600 hover:to-violet-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"                        >
                            <span>✕</span> Clear
                        </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => handleDownload('pdf')}
                            disabled={!!downloading || loading}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {downloading === 'pdf' ? 'Downloading…' : 'PDF'}
                        </button>
                        <button
                            onClick={() => handleDownload('excel')}
                            disabled={!!downloading || loading}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            {downloading === 'excel' ? 'Downloading…' : 'Excel'}
                        </button>
                    </div>
                </div>
                {(dateFrom || dateTo) && (
                    <p className="text-xs text-gray-400 mt-2">
                        {dateFrom && dateTo
                            ? `Report: ${new Date(dateFrom).toLocaleDateString('en-IN')} — ${new Date(dateTo).toLocaleDateString('en-IN')}`
                            : dateFrom
                            ? `From ${new Date(dateFrom).toLocaleDateString('en-IN')}`
                            : `Up to ${new Date(dateTo).toLocaleDateString('en-IN')}`
                        }
                    </p>
                )}
                {!dateFrom && !dateTo && (
                    <p className="text-xs text-gray-400 mt-2">No date filter — downloads all-time report</p>
                )}
            </div>
            {/* Search + Sort */}
            <div className="flex items-center justify-between mb-5 gap-4 flex-wrap p-4 border rounded">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Course"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort By</span>
                    <select
                        value={sort}
                        onChange={e => { setSort(e.target.value); setPage(1); }}
                        className="border border-purple-400 text-purple-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                        <option value="relevance">Relevance</option>
                        <option value="revenue_desc">Revenue (High to Low)</option>
                        <option value="revenue_asc">Revenue (Low to High)</option>
                        <option value="students_desc">Most Students</option>
                        <option value="newest">Newest</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs w-12">S1</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Course Name</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Students</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Rate</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Category</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Uploaded Date</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Total Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">
                                    {search ? 'No courses match your search' : 'No courses yet'}
                                </td>
                            </tr>
                        ) : paginated.map((course, idx) => (
                            <tr
                                key={course._id}
                                onClick={() => onCourseClick(course)}
                                className="hover:bg-purple-50 cursor-pointer transition-colors"
                            >
                                <td className="px-5 py-3.5 text-gray-500">{(page - 1) * LIMIT + idx + 1}</td>
                                <td className="px-5 py-3.5 font-medium text-gray-800">{course.title}</td>
                                <td className="px-5 py-3.5 text-gray-600">{course.enrolledCount}</td>
                                <td className="px-5 py-3.5 text-gray-600">₹{course.price}</td>
                                <td className="px-5 py-3.5 text-gray-600">{course.category || '—'}</td>
                                <td className="px-5 py-3.5 text-gray-600">
                                    {new Date(course.createdAt).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-5 py-3.5 font-semibold text-gray-800">
                                    ₹{(course.totalRevenue || 0).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                p === page
                                    ? 'bg-purple-600 text-white'
                                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {String(p).padStart(2, '0')}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

//Details
function RevenueDetails({ course, onBack }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 5;

    const fetchDetails = async (p = 1, s = '') => {
        setLoading(true);
        try {
            const res = await tutorAPI.getCourseRevenueDetails(course._id, { page: p, limit: LIMIT, search: s });
            setDetails(res.data);
        } catch {
            toast.error('Failed to load course details', { id: 'revenue-detail-error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetails(1, ''); }, [course._id]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
        fetchDetails(1, e.target.value);
    };

    const handlePage = (p) => {
        setPage(p);
        fetchDetails(p, search);
    };

    const totalPages = details?.pagination?.totalPages || 1;

    return (
        <div className="p-6">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-purple-700 mb-5 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Revenue
            </button>

            <h1 className="text-2xl font-bold text-gray-800 mb-1">Revenue Details</h1>
            <p className="text-sm text-gray-500 mb-6">{course.title}</p>

            {/* Course summary cards — per-course real-world metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[
                    {
                        label: 'Students Enrolled',
                        value: details?.course?.totalEnrollments ?? course.enrolledCount,
                        sub: 'Total enrollments',
                        color: 'bg-blue-50 border-blue-100',
                        text: 'text-blue-700',
                    },
                    {
                        label: 'Gross Revenue',
                        value: `₹${((details?.course?.grossRevenue ?? course.totalRevenue) || 0).toLocaleString('en-IN')}`,
                        sub: 'What students paid',
                        color: 'bg-green-50 border-green-100',
                        text: 'text-green-700',
                    },
                    {
                        label: 'Your Earnings',
                        value: `₹${((details?.course?.tutorTotalEarning ?? course.tutorEarning) || 0).toLocaleString('en-IN')}`,
                        sub: 'After platform commission',
                        color: 'bg-purple-50 border-purple-100',
                        text: 'text-purple-700',
                    },
                    {
                        label: 'Avg. Discount',
                        value: `₹${details?.course?.avgDiscount ?? 0}`,
                        sub: 'Per enrollment',
                        color: 'bg-orange-50 border-orange-100',
                        text: 'text-orange-700',
                    },
                    {
                        label: 'Coupon Usage',
                        value: details?.course?.couponUsageCount ?? 0,
                        sub: 'Students used a coupon',
                        color: 'bg-pink-50 border-pink-100',
                        text: 'text-pink-700',
                    },
                ].map(({ label, value, sub, color, text }) => (
                    <div key={label} className={`rounded-xl border p-4 ${color}`}>
                        <p className={`text-xs font-medium mb-1 ${text}`}>{label}</p>
                        <p className="text-xl font-bold text-gray-800">{value}</p>
                        <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4 w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Course"
                    value={search}
                    onChange={handleSearch}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
            </div>

            {/* Enrollments table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-100">
                        <tr>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs w-12">S1</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Students</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Course</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Original Price</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Final Price</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Coupon Status</th>
                            <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs">Date of Purchase</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td>
                            </tr>
                        ) : details?.enrollments?.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-400">No enrollments yet</td>
                            </tr>
                        ) : details?.enrollments?.map((e, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-5 py-3.5 text-gray-500">{(page - 1) * LIMIT + idx + 1}</td>
                                <td className="px-5 py-3.5">
                                    <p className="font-medium text-gray-800">{e.student?.name}</p>
                                    <p className="text-xs text-gray-400">{e.student?.email}</p>
                                </td>
                                <td className="px-5 py-3.5 text-gray-600">{course.title}</td>
                                <td className="px-5 py-3.5 text-gray-600">₹{e.originalPrice}</td>
                                <td className="px-5 py-3.5 font-medium text-gray-800">₹{e.finalPrice}</td>
                                <td className="px-5 py-3.5">
                                    {e.couponUsed ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-mono">
                                            {e.couponUsed}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">No Coupon</span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 text-gray-600 text-xs">
                                    {new Date(e.purchaseDate).toLocaleDateString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => handlePage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => handlePage(p)}
                            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                                p === page
                                    ? 'bg-purple-600 text-white'
                                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {String(p).padStart(2, '0')}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function TutorRevenue() {
    const [selectedCourse, setSelectedCourse] = useState(null);

    if (selectedCourse) {
        return (
            <RevenueDetails
                course={selectedCourse}
                onBack={() => setSelectedCourse(null)}
            />
        );
    }

    return <RevenueList onCourseClick={setSelectedCourse} />;
}
