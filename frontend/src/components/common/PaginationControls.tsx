import styles from './PaginationControls.module.css';

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
    <div className={styles.container}>
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={isFirst}
        className={styles.navBtn}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={isLast}
        className={styles.navBtn}
      >
        Next
      </button>
    </div>
  );
}
