import React from 'react';
import styles from './LoadingOverlay.module.css';

const LoadingOverlay = ({ message = 'Processing...' }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner}></div>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay; 