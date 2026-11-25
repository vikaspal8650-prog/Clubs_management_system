import React from 'react';
import './Table.css';

export const Table = ({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  isLoading = false,
  emptyState,
  onRowClick,
  className = '',
}) => {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead className="table__head">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                className={`table__th ${col.align ? `table__th--${col.align}` : ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`loading-row-${rIdx}`} className="table__tr table__tr--skeleton">
                {columns.map((col, cIdx) => (
                  <td key={`loading-cell-${cIdx}`} className="table__td">
                    <div className="table__skeleton-bar" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table__empty-cell">
                {emptyState || <div className="table__default-empty">No records found.</div>}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const key = keyExtractor(row, rIdx);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`table__tr ${onRowClick ? 'table__tr--clickable' : ''}`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`table__td ${col.align ? `table__td--${col.align}` : ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
