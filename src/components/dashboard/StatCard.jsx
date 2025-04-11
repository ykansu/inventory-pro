import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './StatCard.module.css';

const StatCard = ({ title, value, tooltipKey, isLoading, error, onRetry, icon, trend }) => {
  const { t } = useTranslation(['dashboard']);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className={`${styles.statCard} ${styles.loading}`}>
        <h3>{title}</h3>
        <div className={styles.statValue}>{t('dashboard:card.loading')}</div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className={`${styles.statCard} ${styles.error}`}>
        <h3>{title}</h3>
        <div className={styles.statValue}>{t('dashboard:card.error')}</div>
        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            {t('dashboard:retry')}
          </button>
        )}
      </div>
    );
  }

  // Determine trend class
  const getTrendClass = () => {
    if (!trend) return '';
    
    if (trend.direction === 'up') return styles.trendUp;
    if (trend.direction === 'down') return styles.trendDown;
    return styles.trendNeutral;
  };
  
  return (
    <div className={styles.statCard}>
      <h3>
        {title}
        {tooltipKey && (
          <span className={styles.tooltip} data-tooltip={t(`dashboard:tooltips.${tooltipKey}`)}>?</span>
        )}
      </h3>
      <div className={styles.statValue}>{value}</div>
      
      {trend && (
        <div className={`${styles.statCardTrend} ${getTrendClass()}`}>
          {trend.icon} {trend.value}
        </div>
      )}
      
      {icon && (
        <div className={styles.statCardIcon}>{icon}</div>
      )}
    </div>
  );
};

export default StatCard; 