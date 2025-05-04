import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './Reports.module.css';
import RevenueByPaymentReport from '../reports/RevenueByPaymentReport';
import BestSellingProductsReport from '../reports/BestSellingProductsReport';
import RevenueBySupplierReport from '../reports/RevenueBySupplierReport';
import CategoryProfitsChart from '../reports/CategoryProfitsChart';
import FinancialMetricsReport from '../reports/FinancialMetricsReport';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

const Reports = () => {
  const [reportType, setReportType] = useState('financialMetrics');
  // The dateRange state is used for the actual report; pendingDateRange is for the pickers.
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [pendingDateRange, setPendingDateRange] = useState(dateRange);
  const { t } = useTranslation(['reports', 'common']);

  const handleGenerate = () => {
    setDateRange({ ...pendingDateRange });
  };

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
                className={`${styles.reportTypeButton} ${reportType === 'financialMetrics' ? styles.active : ''}`}
                onClick={() => setReportType('financialMetrics')}
              >
                {t('reports:types.financialMetrics', 'Financial Metrics')}
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
                className={`${styles.reportTypeButton} ${reportType === 'revenueByPayment' ? styles.active : ''}`}
                onClick={() => setReportType('revenueByPayment')}
              >
                {t('reports:types.revenueByPayment')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'revenueBySupplier' ? styles.active : ''}`}
                onClick={() => setReportType('revenueBySupplier')}
              >
                {t('reports:types.revenueBySupplier', 'Revenue by Supplier')}
              </button>
            </li>
            <li>
              <button 
                className={`${styles.reportTypeButton} ${reportType === 'categoryProfits' ? styles.active : ''}`}
                onClick={() => setReportType('categoryProfits')}
              >
                {t('reports:types.categoryProfits', 'Category Profits')}
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
                  value={pendingDateRange.start ? format(pendingDateRange.start, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setPendingDateRange({ ...pendingDateRange, start: e.target.value ? parseISO(e.target.value) : null })}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endDate">{t('reports:filters.to')}</label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={pendingDateRange.end ? format(pendingDateRange.end, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setPendingDateRange({ ...pendingDateRange, end: e.target.value ? parseISO(e.target.value) : null })}
                />
              </div>
              <button className={styles.filterButton} onClick={handleGenerate}>{t('reports:filters.generate')}</button>
            </div>
          </div>

          <div className={styles.reportDisplay}>
            {reportType === 'financialMetrics' && (
              <FinancialMetricsReport startDate={dateRange.start} endDate={dateRange.end} />
            )}
            
            {reportType === 'topSelling' && (
              <BestSellingProductsReport startDate={dateRange.start} endDate={dateRange.end} />
            )}

            {reportType === 'revenueByPayment' && (
              <RevenueByPaymentReport startDate={dateRange.start} endDate={dateRange.end} />
            )}
            
            {reportType === 'revenueBySupplier' && (
              <RevenueBySupplierReport startDate={dateRange.start} endDate={dateRange.end} />
            )}
            
            {reportType === 'categoryProfits' && (
              <CategoryProfitsChart startDate={dateRange.start} endDate={dateRange.end} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
