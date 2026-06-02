import React from 'react';

export interface ColumnDef<T> {
  /** A unique identifier for the column. */
  key: string;
  /** The text or node to display in the header cell. */
  header: React.ReactNode;
  /** Optional custom rendering function for body cells in this column. */
  render?: (item: T, index: number) => React.ReactNode;
  /** Custom style to apply to both header and body cells in this column. */
  style?: React.CSSProperties;
  /** Custom style to apply only to the header cell. */
  headerStyle?: React.CSSProperties;
}

export interface DataTableProps<T> {
  /** The columns configuration array. */
  columns: ColumnDef<T>[];
  /** The raw data array. */
  data: T[];
  /** Function to extract a unique key for each item/row. */
  keyExtractor: (item: T, index: number) => string | number;
  /** Component or element to render when data is empty. */
  emptyState?: React.ReactNode;
  /** Optional callback when a row is clicked. */
  onRowClick?: (item: T, index: number) => void;
  /** Style override for the HTML <table> element. */
  tableStyle?: React.CSSProperties;
}

/**
 * DataTable provides a highly reusable, type-safe, and styled layout for
 * displaying tabular information, integrating seamlessly with the Nails Salon style system.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  onRowClick,
  tableStyle,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="data-table-container">
      <table className="data-table" style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.headerStyle || col.style}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => {
            const key = keyExtractor(item, idx);
            const isClickable = !!onRowClick;
            return (
              <tr
                key={key}
                className={`data-table-row ${isClickable ? 'clickable' : ''}`}
                onClick={() => onRowClick?.(item, idx)}
              >
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(item, idx)
                    : ((item as Record<string, unknown>)[col.key] as React.ReactNode);
                  return (
                    <td key={col.key} style={col.style}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
