import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (newPage: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2)
  );

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-line">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-2 rounded-full hover:bg-paper disabled:opacity-30"
        >
          <ChevronRightIcon className="w-5 h-5 text-muted" />
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium ${
                p === page
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:bg-paper"
              }`}
            >
              {p.toLocaleString("fa-IR")}
            </button>
          ))}
        </div>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-2 rounded-full hover:bg-paper disabled:opacity-30"
        >
          <ChevronLeftIcon className="w-5 h-5 text-muted" />
        </button>
      </div>
    </div>
  );
}
