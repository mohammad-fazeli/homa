import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (newPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2)
  );

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200">
        {/* قبلی */}
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-600" />
        </button>

        {/* شماره صفحات */}
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`
                w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium
                transition-all
                ${
                  p === page
                    ? "bg-linear-to-t from-indigo-400 to-sky-400 text-white shadow-md scale-105"
                    : "text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>

        {/* بعدی */}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
