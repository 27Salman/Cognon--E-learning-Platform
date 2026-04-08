import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';
import { setFilters, fetchPublishedCourses } from '../../store/slices/studentSlice';

const CATEGORIES = ['Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business', 'Marketing'];

export default function CourseFilters() {
    const dispatch = useDispatch();
    const { filters } = useSelector(state => state.student);
    const debounceRef = useRef(null);

    const handleSearch = (value) => {
        dispatch(setFilters({ search: value }));
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            dispatch(fetchPublishedCourses({ ...filters, search: value }));
        }, 400);
    };

    const handleCategory = (category) => {
        const newCategory = filters.category === category ? '' : category;
        dispatch(setFilters({ category: newCategory }));
        dispatch(fetchPublishedCourses({ ...filters, category: newCategory }));
    };

    const handleClear = () => {
        dispatch(setFilters({ category: '', search: '' }));
        dispatch(fetchPublishedCourses({}));
    };

    const hasFilters = filters.category || filters.search;

    return (
        <div className="space-y-3 mb-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 items-center">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => handleCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            filters.category === cat
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
                {hasFilters && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>
        </div>
    );
}
