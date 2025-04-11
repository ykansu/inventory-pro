import React from 'react';
import styles from './SearchBox.module.css';

/**
 * Reusable search box component
 * 
 * @param {Object} props - Component props
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Change handler function
 * @param {string} [props.className] - Additional CSS class names
 */
const SearchBox = ({ 
  placeholder = 'Search...',
  value, 
  onChange,
  className = '',
  ...props 
}) => {
  return (
    <div className={`${styles.searchBox} ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        role="searchbox"
        aria-label={placeholder}
        {...props}
      />
    </div>
  );
};

export default SearchBox; 