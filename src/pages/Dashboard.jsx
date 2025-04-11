import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../context/SettingsContext';
import TotalProductsCard from '../components/dashboard/TotalProductsCard';
import LowStockItemsCard from '../components/dashboard/LowStockItemsCard';
import TodaySalesCard from '../components/dashboard/TodaySalesCard';
import MonthlyProfitMetricsCards from '../components/dashboard/MonthlyProfitMetricsCards';
import MonthlyExpensesCard from '../components/dashboard/MonthlyExpensesCard';
import TotalCashCard from '../components/dashboard/TotalCashCard';
import InventoryMetricsCards from '../components/dashboard/InventoryMetricsCards';
import ProfitTrendChart from '../components/dashboard/ProfitTrendChart';
import CategoryProfitsChart from '../components/dashboard/CategoryProfitsChart';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import RevenueByPaymentChart from '../components/dashboard/RevenueByPaymentChart';
import RevenueBySupplierChart from '../components/dashboard/RevenueBySupplierChart';
import ExpensesTrendChart from '../components/dashboard/ExpensesTrendChart';
import InventoryValueByCategoryChart from '../components/dashboard/InventoryValueByCategoryChart';
import InventoryValueBySupplierChart from '../components/dashboard/InventoryValueBySupplierChart';
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
