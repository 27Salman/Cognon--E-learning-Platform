import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, ChevronRight } from "lucide-react";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import Pagination from "../../components/common/Pagination";
import { studentAPI } from "../../api/studentAPI";

export default function TutorList() {
    const navigate = useNavigate();
    const [tutors, setTutors] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTutors: 0, limit: 8 });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchTutorData = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 8,
                search: debouncedSearch,
                sortBy
            };
            const res = await studentAPI.fetchTutors(params);
            if (res.success) {
                setTutors(res.data.tutors || []);
                setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalTutors: 0, limit: 8 });
            }
        } catch (error) {
            console.error("Error fetching tutors:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutorData();
    }, [page, debouncedSearch, sortBy]);

    const filteredTutors = selectedSubject 
        ? tutors.filter(t => t.tutorProfile?.subject?.toLowerCase().includes(selectedSubject.toLowerCase()))
        : tutors;

    const uniqueSubjects = Array.from(
        new Set(
            tutors
                .map(t => t.tutorProfile?.subject)
                .filter(Boolean)
        )
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <StudentNavbar />

            {/* Breadcrumb section */}
            <div className="bg-white border-b border-gray-100 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 text-xs text-gray-500">
                    <span className="cursor-pointer hover:text-purple-600 transition" onClick={() => navigate('/')}>Home</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-semibold text-gray-800">Tutors</span>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
                <div className="mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tutors</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                        {/* Search Input on Left */}
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Search Tutor"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-5 pr-10 text-sm text-gray-800 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600 cursor-pointer" />
                        </div>

                        {/* Sort and Filter on Right */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                            {/* Sort By Dropdown */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 rounded-full py-2.5 pl-5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:border-purple-500 transition-colors shadow-sm cursor-pointer"
                                >
                                    <option value="relevance">Sort By: Relevance</option>
                                    <option value="name">Name: A to Z</option>
                                    <option value="name_desc">Name: Z to A</option>
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-gray-400">
                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition shadow-sm ${
                                    showFilters || selectedSubject
                                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Collapsible Subject Filter panel */}
                {showFilters && (
                    <div className="bg-white border border-purple-100 rounded-2xl p-5 mb-8 shadow-sm transition-all animate-fadeIn">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Filter by Expertise / Subject</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedSubject("")}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                                    selectedSubject === ""
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                All Subjects
                            </button>
                            {uniqueSubjects.map((sub) => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                                        selectedSubject === sub
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tutor Grid */}
                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                ) : filteredTutors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {filteredTutors.map((tutor) => (
                            <div
                                key={tutor._id}
                                onClick={() => navigate(`/tutors/${tutor._id}`)}
                                className="bg-white border border-gray-100 hover:border-purple-100 rounded-2xl p-6 text-center cursor-pointer hover:shadow-lg hover:-translate-y-1 transition duration-300 flex flex-col items-center"
                            >
                                {/* Circle Avatar */}
                                <div className="relative w-36 h-36 rounded-full bg-purple-50 overflow-hidden mb-5 border-4 border-gray-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                                    {tutor.profileImageURL ? (
                                        <img
                                            src={tutor.profileImageURL}
                                            alt={tutor.name}
                                            className="w-full h-full object-cover transition duration-300 transform hover:scale-105"
                                        />
                                    ) : (
                                        <div className="text-3xl font-bold text-purple-600 select-none">
                                            {tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-gray-900 text-base leading-snug hover:text-purple-600 transition-colors">
                                    {tutor.name}
                                </h3>
                                <p className="text-xs text-purple-600 font-medium mt-1 uppercase tracking-wider">
                                    {tutor.tutorProfile?.subject || "Expert Instructor"}
                                </p>

                                <button className="mt-5 px-6 py-2  text-white bg-purple-700 rounded-full text-xs font-semibold hover:bg-purple-500 hover:text-white transition duration-200 w-full">
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl py-24 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-lg font-bold text-gray-700">No tutors found</h4>
                        <p className="text-sm text-gray-500 mt-1">Try modifying your search query or filters.</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            totalFiltered={pagination.totalTutors}
                            limit={pagination.limit}
                            onPageChange={(p) => setPage(typeof p === 'function' ? p(page) : p)}
                            itemLabel="tutors"
                        />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
