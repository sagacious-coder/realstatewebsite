import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1.5 py-6 select-none', className)}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        aria-label="Previous page"
        className="flex items-center justify-center h-10 w-10 rounded-[4px] border border-line bg-white text-navy hover:bg-mist disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" strokeWidth={1.5} />
      </button>

      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="flex items-center justify-center h-10 w-8 text-muted"
              aria-hidden="true"
            >
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
            </span>
          );
        }

        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange?.(p)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center justify-center h-10 min-w-[40px] px-3 font-sans text-sm font-medium rounded-[4px] border transition-colors',
              isActive
                ? 'bg-navy text-ivory border-navy font-semibold shadow-subtle'
                : 'bg-white text-navy border-line hover:bg-mist'
            )}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        aria-label="Next page"
        className="flex items-center justify-center h-10 w-10 rounded-[4px] border border-line bg-white text-navy hover:bg-mist disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="w-4 h-4 rtl:rotate-180" strokeWidth={1.5} />
      </button>
    </nav>
  );
}

export default Pagination;
