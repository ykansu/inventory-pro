import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSettings } from '../../context/SettingsContext';
import TotalProductsCard from '../dashboard/TotalProductsCard';
import LowStockItemsCard from '../dashboard/LowStockItemsCard';
import TodaySalesCard from '../dashboard/TodaySalesCard';
import MonthlyProfitMetricsCards from '../dashboard/MonthlyProfitMetricsCards';
import MonthlyExpensesCard from '../dashboard/MonthlyExpensesCard';
import TotalCashCard from '../dashboard/TotalCashCard';
import InventoryMetricsCards from '../dashboard/InventoryMetricsCards';
import ProfitTrendChart from '../dashboard/ProfitTrendChart';
import CategoryProfitsChart from '../dashboard/CategoryProfitsChart';
import TopProductsChart from '../dashboard/TopProductsChart';
import RevenueByPaymentChart from '../dashboard/RevenueByPaymentChart';
import RevenueBySupplierChart from '../dashboard/RevenueBySupplierChart';
import ExpensesTrendChart from '../dashboard/ExpensesTrendChart';
import InventoryValueByCategoryChart from '../dashboard/InventoryValueByCategoryChart';
import InventoryValueBySupplierChart from '../dashboard/InventoryValueBySupplierChart';
import RevenueExpenseDifferenceCard from '../dashboard/RevenueExpenseDifference';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { getBusinessName } = useSettings();
  
  return (
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardHeader}>
        <h2>{t('dashboard:overview')}</h2>
        <p>{t('dashboard:welcome')}</p>
        <div className={styles.businessName}>{getBusinessName()}</div>
      </div>
      
      {/* Key Performance Metrics - First Row */}
      <div className={styles.dashboardStats}>
        <TotalProductsCard />
        <LowStockItemsCard />
        <TodaySalesCard />
        <MonthlyProfitMetricsCards />
        <InventoryMetricsCards />
        <MonthlyExpensesCard />
        <TotalCashCard />
        <RevenueExpenseDifferenceCard />
      </div>
      
      {/* Dashboard Sections - Grid Layout */}
      <div className={styles.dashboardSections}>
        <TopProductsChart />
        <RevenueBySupplierChart />
        <RevenueByPaymentChart />
        <InventoryValueBySupplierChart />
        <ExpensesTrendChart />
        <ProfitTrendChart />
        <CategoryProfitsChart />
        <InventoryValueByCategoryChart />
      </div>
    </div>
  );
};

export default Dashboard;
