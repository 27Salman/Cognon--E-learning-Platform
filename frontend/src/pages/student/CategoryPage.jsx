import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchPublishedCourses, setFilters } from "../../store/slices/studentSlice";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import { studentAPI } from "../../api/studentAPI";
import { BookOpen, Search, X, Clock } from "lucide-react";

function formatDuration(minutes) {
    if (!minutes || minutes === 0) return null;
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.round(minutes / 60);
    return `${hrs} hr${hrs !== 1 ? 's' : ''}`;
}

function CourseCard({ course }) {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/student/courses/${course._id}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
        >
            <div className="w-full h-36 bg-gray-100 overflow-hidden">
                {course.thumbnailURL ? (
                    <img src={course.thumbnailURL} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-purple-300" />
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span className="text-purple-500 font-medium">{course.category}</span>
                    {formatDuration(course.totalDuration) && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(course.totalDuration)}</span>
                    )}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">{course.title}</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                            {course.tutor?.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <span className="text-xs text-gray-600">{course.tutor?.name}</span>
                    </div>
                    <span className="text-purple-600 font-bold text-sm">
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function CategoryPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { catalog, loading } = useSelector(state => state.student);

    const [studentInfo, setStudentInfo] = useState(() => {
        try { return JSON.parse(localStorage.getItem("studentInfo")) || {}; } catch { return {}; }
    });
    const [searchValue, setSearchValue] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const params = new URLSearchParams(location.search);
    const focusCategory = params.get("category") || null;

    useEffect(() => {
        studentAPI.getProfile().then(res => setStudentInfo(res.data || res)).catch(() => {});
        dispatch(fetchPublishedCourses({}));
    }, [dispatch]);

    useEffect(() => {
        if (searchValue.trim().length < 2) { setSuggestions([]); return; }
        const matches = catalog.filter(c =>
            c.title.toLowerCase().includes(searchValue.toLowerCase())
        ).slice(0, 5);
        setSuggestions(matches);
    }, [searchValue, catalog]);

    const handleSearch = (val) => {
        setSearchValue(val);
    };

    const handleClear = () => {
        setSearchValue("");
    };

    const filteredCatalog = searchValue.trim()
        ? catalog.filter(c =>
            c.title.toLowerCase().includes(searchValue.toLowerCase()) ||
            (c.category || "").toLowerCase().includes(searchValue.toLowerCase())
          )
        : catalog;

    const grouped = filteredCatalog.reduce((acc, course) => {
        const cat = course.category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(course);
        return acc;
    }, {});

    const categories = Object.keys(grouped).sort();

    // If focusCategory, scroll to it or filter
    const displayCategories = focusCategory
        ? categories.filter(c => c === focusCategory)
        : categories;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar studentInfo={studentInfo} />

            {/* Search header */}
            <div className="bg-white border-b border-gray-200 py-5 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-800 mb-3 text-center">Browse by Category</h1>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchValue}
                            onChange={e => handleSearch(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        {searchValue && (
                            <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                {suggestions.map(s => (
                                    <button
                                        key={s._id}
                                        onMouseDown={() => navigate(`/student/courses/${s._id}`)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-left"
                                    >
                                        <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">{s.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {focusCategory && (
                        <button
                            onClick={() => navigate('/student/categories')}
                            className="mt-3 text-sm text-purple-600 hover:underline"
                        >
                            ← All Categories
                        </button>
                    )}
                </div>
            </div>

            {/* Category sections */}
            <div className="flex-1 py-8 px-6">
                {loading ? (
                    <div className="space-y-10">
                        {[1, 2, 3].map(i => (
                            <div key={i}>
                                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
                                <div className="grid grid-cols-4 gap-5">
                                    {[...Array(4)].map((_, j) => <div key={j} className="h-52 bg-gray-100 rounded-xl animate-pulse" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayCategories.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No courses found</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {displayCategories.map(category => (
                            <section key={category}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">{category}</h2>
                                    {grouped[category].length > 4 && (
                                        <button
                                            onClick={() => navigate(`/student/categories?category=${encodeURIComponent(category)}`)}
                                            className="text-sm text-purple-600 font-medium hover:underline"
                                        >
                                            See all
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                                    {(focusCategory ? grouped[category] : grouped[category].slice(0, 4)).map(course => (
                                        <CourseCard key={course._id} course={course} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
