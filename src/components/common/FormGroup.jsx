import React from 'react';
import styles from './FormGroup.module.css';

const FormGroup = ({ 
  children, 
  label, 
  htmlFor, 
  className = '',
  isCheckbox = false,
  required = false,
  error = ''
}) => {
  const groupClasses = [
    styles.formGroup,
    isCheckbox ? styles.checkboxGroup : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses}>
      {label && (
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

export default FormGroup; 