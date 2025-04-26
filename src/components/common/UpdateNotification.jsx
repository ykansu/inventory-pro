import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './UpdateNotification.module.css';

const UpdateNotification = ({ onClose }) => {
  const { t } = useTranslation(['common']);
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // Automatically hide after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className={styles.updatePopover}>
      <div className={styles.updateHeader}>
        <span>{t('updates.title', 'Updates Available')}</span>
        <button className={styles.closeButton} onClick={handleClose}>×</button>
      </div>
      <div className={styles.updateContent}>
        <p>{t('updates.message', 'New updates are available for Inventory Pro.')}</p>
        <p>{t('updates.instructions', 'You can use the update utility to update the application.')}</p>
      </div>
    </div>
  );
};

export default UpdateNotification; 