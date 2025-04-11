import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './Pagination.module.css';

/**
 * Reusable pagination component for showing pagination controls and info
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items across all pages
 * @param {number} props.pageSize - Number of items per page
 * @param {Function} props.onPageChange - Callback when page changes: (newPage) => void
 * @param {string} props.className - Optional additional CSS class
 * @returns {JSX.Element} Pagination component
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  onPageChange,
  className = ''
}) => {
  const { t } = useTranslation(['common']);
  
  // Do not render pagination if there are no items
  if (totalItems <= 0) {
    return null;
  }
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  // Calculate item indices for display
  const startIndex = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div className={`${styles.pagination} ${className}`}>
      <div className={styles.paginationControls}>
        <button
          className={styles.paginationButton}
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          aria-label={t('common:previous')}
        >
          {t('common:previous')}
        </button>
        
        <span className={styles.pageInfo}>
          {t('common:pageInfo', {
            current: currentPage,
            total: totalPages
          })}
        </span>
        
        <button
          className={styles.paginationButton}
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          aria-label={t('common:next')}
        >
          {t('common:next')}
        </button>
      </div>
      
      <span className={styles.paginationInfo}>
        {t('common:pagination', {
          start: startIndex,
          end: endIndex,
          total: totalItems
        })}
      </span>
    </div>
  );
};

export default Pagination; 