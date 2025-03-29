import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>{t('dashboard:overview')}</h2>
        <p>{t('dashboard:welcome')}</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{t('dashboard:stats.totalProducts')}</h3>
          <div className="stat-value">0</div>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard:stats.lowStockItems')}</h3>
          <div className="stat-value">0</div>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard:stats.todaySales')}</h3>
          <div className="stat-value">$0.00</div>
        </div>
        
        <div className="stat-card">
          <h3>{t('dashboard:stats.monthlyRevenue')}</h3>
          <div className="stat-value">$0.00</div>
        </div>
      </div>
      
      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>{t('dashboard:sections.recentSales')}</h3>
          <div className="placeholder-content">
            <p>{t('dashboard:placeholders.noSalesData')}</p>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>{t('dashboard:sections.popularProducts')}</h3>
          <div className="placeholder-content">
            <p>{t('dashboard:placeholders.noProductData')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
