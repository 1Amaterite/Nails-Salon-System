import React from 'react';

export interface PaginationControlsProps {
  /** 1-indexed current page number. */
  currentPage: number;
  /** Total number of pages. Component renders nothing when totalPages ≤ 1. */
  totalPages: number;
  /** Callback fired when the user navigates to a new page. */
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls with Previous / numbered page buttons / Next.
 * Renders `null` when there is only one page, so callers don't need to
 * wrap it in a conditional themselves.
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className="pagination-container">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={isFirst}
        className="pagination-nav-btn"
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={isLast}
        className="pagination-nav-btn"
      >
        Next
      </button>
    </div>
  );
}
