import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/pages/reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { t } = useTranslation(['reports', 'common']);

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>{t('reports:title')}</h2>
      </div>

      <div className="reports-container">
        <div className="report-sidebar">
          <h3>{t('reports:sidebar.title')}</h3>
          <ul className="report-types">
            <li>
              <button 
                className={`report-type-button ${reportType === 'daily' ? 'active' : ''}`}
                onClick={() => setReportType('daily')}
              >
                {t('reports:types.daily')}
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'inventory' ? 'active' : ''}`}
                onClick={() => setReportType('inventory')}
              >
                {t('reports:types.inventory')}
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'lowStock' ? 'active' : ''}`}
                onClick={() => setReportType('lowStock')}
              >
                {t('reports:types.lowStock')}
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'topSelling' ? 'active' : ''}`}
                onClick={() => setReportType('topSelling')}
              >
                {t('reports:types.topSelling')}
              </button>
            </li>
            <li>
              <button 
                className={`report-type-button ${reportType === 'profitMargin' ? 'active' : ''}`}
                onClick={() => setReportType('profitMargin')}
              >
                {t('reports:types.profitMargin')}
              </button>
            </li>
          </ul>
        </div>

        <div className="report-content">
          <div className="report-filters">
            <div className="date-filters">
              <div className="form-group">
                <label htmlFor="startDate">{t('reports:filters.from')}</label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">{t('reports:filters.to')}</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <button className="filter-button">{t('reports:filters.generate')}</button>
            </div>

            <div className="export-options">
              <button className="export-button">{t('reports:export.csv')}</button>
              <button className="print-button">{t('reports:export.print')}</button>
            </div>
          </div>

          <div className="report-display">
            {reportType === 'daily' && (
              <div className="daily-report">
                <h3>{t('reports:daily.title')}</h3>
                <p className="report-date">{t('reports:daily.period', { start: dateRange.start || t('reports:notSelected'), end: dateRange.end || t('reports:notSelected') })}</p>
                
                <div className="report-summary">
                  <div className="summary-card">
                    <h4>{t('reports:daily.summary.totalSales')}</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                  <div className="summary-card">
                    <h4>{t('reports:daily.summary.transactions')}</h4>
                    <div className="summary-value">0</div>
                  </div>
                  <div className="summary-card">
                    <h4>{t('reports:daily.summary.averageValue')}</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                  <div className="summary-card">
                    <h4>{t('reports:daily.summary.grossProfit')}</h4>
                    <div className="summary-value">$0.00</div>
                  </div>
                </div>

                <div className="report-section">
                  <h4>{t('reports:daily.paymentBreakdown.title')}</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>{t('reports:daily.paymentBreakdown.headers.method')}</th>
                        <th>{t('reports:daily.paymentBreakdown.headers.amount')}</th>
                        <th>{t('reports:daily.paymentBreakdown.headers.percentage')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="empty-state">
                        <td colSpan="3">
                          <p>{t('reports:noData')}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h4>{t('reports:daily.salesByCategory.title')}</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>{t('reports:daily.salesByCategory.headers.category')}</th>
                        <th>{t('reports:daily.salesByCategory.headers.itemsSold')}</th>
                        <th>{t('reports:daily.salesByCategory.headers.totalSales')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="empty-state">
                        <td colSpan="3">
                          <p>{t('reports:noData')}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType !== 'daily' && (
              <div className="placeholder-report">
                <h3>{t(`reports:types.${reportType}`)}</h3>
                <div className="placeholder-content">
                  <p>{t('reports:generateInstructions')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
