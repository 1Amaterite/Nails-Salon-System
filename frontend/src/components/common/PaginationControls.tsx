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

  const navButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: disabled ? '#E5E7EB' : 'var(--accent)',
    color: disabled ? '#9CA3AF' : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '6px',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '24px',
      }}
    >
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={isFirst}
        className="btn-primary"
        style={navButtonStyle(isFirst)}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background:
              currentPage === page ? 'rgba(190, 24, 93, 0.15)' : 'transparent',
            color: currentPage === page ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
          }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={isLast}
        className="btn-primary"
        style={navButtonStyle(isLast)}
      >
        Next
      </button>
    </div>
  );
}
