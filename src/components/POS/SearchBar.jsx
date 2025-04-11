import React from 'react';
import styles from './SearchBar.module.css';
import { useTranslation } from '../../hooks/useTranslation';

const SearchBar = ({ searchQuery, onSearchChange, onSearch, onBarcodeInput, searchInputRef }) => {
  const { t } = useTranslation(['pos', 'common']);
  
  return (
    <div className={styles.productSearch}>
      <form onSubmit={onSearch}>
        <input
          type="text"
          ref={searchInputRef}
          placeholder={t('pos:search.placeholder')}
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={onBarcodeInput}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          {t('pos:search.button')}
        </button>
      </form>
    </div>
  );
};

export default SearchBar; 