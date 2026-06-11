import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
    currentPage, totalPages, totalFiltered, limit, onPageChange, itemLabel = 'items'
}){
    if(totalPages <= 1) return null;

    const getPageNumbers = () => {
        const delta = 2;
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);
        const range = [];
        for(let i = start; i <= end; i++) range.push(i);
        return range;
    }

    const from = (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, totalFiltered);

    return (
    <div className="flex flex-col items-center gap-3 px-5 py-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {from}–{to} of {totalFiltered} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(p => p - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              num === currentPage
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onPageChange(p => p + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

}


