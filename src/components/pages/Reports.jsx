import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './Reports.module.css';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { t } = useTranslation(['reports', 'common']);

  return (
    <div className={styles.reportsPage}>
      <div className="page-header">
        <h2>{t('reports:title')}</h2>
      </div>

      <div className={styles.reportsContainer}>
        <div className={styles.reportSidebar}>
          <h3>{t('reports:sidebar.title')}</h3>
          <ul className={styles.reportTypes}>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'daily' ? styles.active : ''}`}
                onClick={() => setReportType('daily')}
              >
                {t('reports:types.daily')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'inventory' ? styles.active : ''}`}
                onClick={() => setReportType('inventory')}
              >
                {t('reports:types.inventory')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'lowStock' ? styles.active : ''}`}
                onClick={() => setReportType('lowStock')}
              >
                {t('reports:types.lowStock')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'topSelling' ? styles.active : ''}`}
                onClick={() => setReportType('topSelling')}
              >
                {t('reports:types.topSelling')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'profitMargin' ? styles.active : ''}`}
                onClick={() => setReportType('profitMargin')}
              >
                {t('reports:types.profitMargin')}
              </button>
            </li>
          </ul>
        </div>

        <div className={styles.reportContent}>
          <div className={styles.reportFilters}>
            <div className={styles.dateFilters}>
              <div className={styles.formGroup}>
                <label htmlFor="startDate">{t('reports:filters.from')}</label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endDate">{t('reports:filters.to')}</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
              <button className={styles.filterButton}>{t('reports:filters.generate')}</button>
            </div>

            <div className={styles.exportOptions}>
              <button className={styles.exportButton}>{t('reports:export.csv')}</button>
              <button className={styles.printButton}>{t('reports:export.print')}</button>
            </div>
          </div>

          <div className={styles.reportDisplay}>
            {reportType === 'daily' && (
              <div className={styles.dailyReport}>
                <h3>{t('reports:daily.title')}</h3>
                <p className={styles.reportDate}>{t('reports:daily.period', { start: dateRange.start || t('reports:notSelected'), end: dateRange.end || t('reports:notSelected') })}</p>
                
                <div className={styles.reportSummary}>
                  <div className={styles.summaryCard}>
                    <h4>{t('reports:daily.summary.totalSales')}</h4>
                    <div className={styles.summaryValue}>$0.00</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>{t('reports:daily.summary.transactions')}</h4>
                    <div className={styles.summaryValue}>0</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>{t('reports:daily.summary.averageValue')}</h4>
                    <div className={styles.summaryValue}>$0.00</div>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>{t('reports:daily.summary.grossProfit')}</h4>
                    <div className={styles.summaryValue}>$0.00</div>
                  </div>
                </div>

                <div className={styles.reportSection}>
                  <h4>{t('reports:daily.paymentBreakdown.title')}</h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>{t('reports:daily.paymentBreakdown.headers.method')}</th>
                        <th>{t('reports:daily.paymentBreakdown.headers.amount')}</th>
                        <th>{t('reports:daily.paymentBreakdown.headers.percentage')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={styles.emptyState}>
                        <td colSpan="3">
                          <p>{t('reports:noData')}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles.reportSection}>
                  <h4>{t('reports:daily.salesByCategory.title')}</h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>{t('reports:daily.salesByCategory.headers.category')}</th>
                        <th>{t('reports:daily.salesByCategory.headers.itemsSold')}</th>
                        <th>{t('reports:daily.salesByCategory.headers.totalSales')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={styles.emptyState}>
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
              <div className={styles.placeholderReport}>
                <h3>{t(`reports:types.${reportType}`)}</h3>
                <div className={styles.placeholderContent}>
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
