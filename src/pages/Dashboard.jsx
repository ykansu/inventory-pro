import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';
import TotalProductsCard from '../components/dashboard/TotalProductsCard';
import LowStockItemsCard from '../components/dashboard/LowStockItemsCard';
import TodaySalesCard from '../components/dashboard/TodaySalesCard';
import MonthlyProfitMetricsCards from '../components/dashboard/MonthlyProfitMetricsCards';
import InventoryMetricsCards from '../components/dashboard/InventoryMetricsCards';
import ProfitTrendChart from '../components/dashboard/ProfitTrendChart';
import CategoryProfitsChart from '../components/dashboard/CategoryProfitsChart';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import RevenueByPaymentChart from '../components/dashboard/RevenueByPaymentChart';
import RevenueBySupplierChart from '../components/dashboard/RevenueBySupplierChart';
import InventoryTrendChart from '../components/dashboard/InventoryTrendChart';
import InventoryValueByCategoryChart from '../components/dashboard/InventoryValueByCategoryChart';
import InventoryValueBySupplierChart from '../components/dashboard/InventoryValueBySupplierChart';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { settings } = useDatabase();
  const [businessName, setBusinessName] = React.useState('Inventory Pro Store');

  // Load settings
  React.useEffect(() => {
    const loadBusinessName = async () => {
      try {
        if (settings) {
          const settingsObj = await settings.getAllSettings();
          setBusinessName(settingsObj.business_name || 'Inventory Pro Store');
        }
      } catch (error) {
        console.error('Failed to load business name:', error);
      }
    };

    loadBusinessName();
  }, [settings]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>{t('dashboard:overview')}</h2>
        <p>{t('dashboard:welcome')}</p>
        <div className="business-name">{businessName}</div>
      </div>
      
      {/* Key Performance Metrics - First Row */}
      <div className="dashboard-stats">
        <TotalProductsCard />
        <LowStockItemsCard />
        <TodaySalesCard />
        <MonthlyProfitMetricsCards />
        <InventoryMetricsCards />
      </div>
      
      {/* Dashboard Sections - Grid Layout */}
      <div className="dashboard-sections">
        <CategoryProfitsChart />
        <TopProductsChart />
        <RevenueBySupplierChart />
        <RevenueByPaymentChart />
        <InventoryValueByCategoryChart />
        <InventoryValueBySupplierChart />
        <InventoryTrendChart />
        <ProfitTrendChart />
      </div>
    </div>
  );
};

export default Dashboard;
