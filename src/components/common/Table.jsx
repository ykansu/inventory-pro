import React from 'react';
import styles from './Table.module.css';

const Table = ({ 
  columns, 
  data, 
  emptyMessage = 'No data available', 
  className = '',
  isLoading = false,
  error = null
}) => {
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const tableClasses = [styles.table, className].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={column.className} 
                style={column.style}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={row.className} 
                onClick={row.onClick}
              >
                {columns.map((column) => (
                  <td 
                    key={`${row.id || rowIndex}-${column.key}`}
                    className={column.cellClassName}
                    style={column.cellStyle}
                  >
                    {column.render 
                      ? column.render(row, rowIndex) 
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr className={styles.emptyRow}>
              <td colSpan={columns.length} className={styles.emptyMessage}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table; 