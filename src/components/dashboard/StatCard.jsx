import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import '../../styles/components/index.css';

const StatCard = ({ title, value, tooltipKey, isLoading, error, onRetry, icon, trend }) => {
  const { t } = useTranslation(['dashboard']);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="stat-card loading">
        <h3>{title}</h3>
        <div className="stat-value">{t('dashboard:card.loading')}</div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="stat-card error">
        <h3>{title}</h3>
        <div className="stat-value">{t('dashboard:card.error')}</div>
        {onRetry && (
          <button className="retry-button" onClick={onRetry}>
            {t('dashboard:retry')}
          </button>
        )}
      </div>
    );
  }

  // Determine trend class
  const getTrendClass = () => {
    if (!trend) return '';
    
    if (trend.direction === 'up') return 'trend-up';
    if (trend.direction === 'down') return 'trend-down';
    return 'trend-neutral';
  };
  
  return (
    <div className="stat-card">
      <h3>
        {title}
        {tooltipKey && (
          <span className="info-tooltip" data-tooltip={t(`dashboard:tooltips.${tooltipKey}`)}>?</span>
        )}
      </h3>
      <div className="stat-value">{value}</div>
      
      {trend && (
        <div className={`stat-card-trend ${getTrendClass()}`}>
          {trend.icon} {trend.value}
        </div>
      )}
      
      {icon && (
        <div className="stat-card-icon">{icon}</div>
      )}
    </div>
  );
};

export default StatCard; 