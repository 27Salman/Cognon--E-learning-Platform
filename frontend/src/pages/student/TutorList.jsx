import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  BookOpen,
  ChevronRight,
  Star,
} from "lucide-react";
import StudentNavbar from "../../components/student/StudentNavbar";
import Footer from "../../components/common/Footer";
import Pagination from "../../components/common/Pagination";
import { studentAPI } from "../../api/studentAPI";

function AvatarSVG({ name, size = 64 }) {
  const colors = [
    ["#7c3aed", "#a78bfa"],
    ["#6d28d9", "#8b5cf6"],
    ["#5b21b6", "#c4b5fd"],
    ["#4c1d95", "#ddd6fe"],
  ];
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const [bg, fg] = colors[idx];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const gradientId = `av-${idx}-${name.replace(/\s/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ borderRadius: "50%", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={fg} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="22"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

export default function TutorList() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTutors: 0,
    limit: 8,
  });
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
        sortBy,
      };
      const res = await studentAPI.fetchTutors(params);
      if (res.success) {
        setTutors(res.data.tutors || []);
        setPagination(
          res.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalTutors: 0,
            limit: 8,
          },
        );
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
    ? tutors.filter((t) =>
        t.tutorProfile?.subject
          ?.toLowerCase()
          .includes(selectedSubject.toLowerCase()),
      )
    : tutors;

  const uniqueSubjects = Array.from(
    new Set(tutors.map((t) => t.tutorProfile?.subject).filter(Boolean)),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StudentNavbar />

      {/* Breadcrumb section */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 text-xs text-gray-500">
          <span
            className="cursor-pointer hover:text-purple-600 transition"
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-gray-800">Tutors</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Tutors
          </h2>
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
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Filter by Expertise / Subject
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubject("")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  selectedSubject === ""
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse h-[380px] overflow-hidden"
              >
                <div className="h-36 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTutors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor._id}
                onClick={() => navigate(`/tutors/${tutor._id}`)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between h-[380px]"
              >
                {/* Avatar header */}
                <div className="h-36 bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent" />
                  {tutor.profileImageURL ? (
                    <img
                      src={tutor.profileImageURL}
                      alt={tutor.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow relative z-10"
                    />
                  ) : (
                    <AvatarSVG name={tutor.name} size={72} />
                  )}
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1">
                      {tutor.name}
                    </h3>
                    <p className="text-purple-600 text-xs font-medium mb-3 line-clamp-2 h-8 leading-tight">
                      {tutor.tutorProfile?.subject || "Instructor"}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-750">
                          {(tutor.averageRating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>{tutor.totalStudents ?? 0} students</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      {tutor.totalCourses ?? 0} courses published
                    </p>
                    <button className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 text-xs font-medium hover:shadow-md">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl py-24 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
            <h4 className="text-lg font-bold text-gray-700">No tutors found</h4>
            <p className="text-sm text-gray-500 mt-1">
              Try modifying your search query or filters.
            </p>
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
              onPageChange={(p) =>
                setPage(typeof p === "function" ? p(page) : p)
              }
              itemLabel="tutors"
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
