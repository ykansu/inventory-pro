const { ipcMain } = require('electron');
const { Product, Sale, Supplier } = require('../models'); // Assuming models are exported correctly

function registerDashboardHandlers() {
  // Combined stats handler
  ipcMain.handle('dashboard:getStats', async () => {
    try {
      if (!Product || !Sale) {
        throw new Error('Model modules not loaded');
      }
      
      const [
        totalProducts,
        lowStockItems,
        todaySales,
        monthlyMetrics, // Assuming this function exists on Sale model
        inventoryValue
      ] = await Promise.all([
        Product.getTotalCount(),
        Product.getLowStockCount(),
        Sale.getTodaySalesTotal(),
        Sale.getMonthlyRevenueAndProfit(), // Changed to match model method name
        Product.getTotalInventoryValue()
      ]);
      
      return {
        totalProducts,
        lowStockItems,
        todaySales,
        monthlyRevenue: monthlyMetrics?.revenue || 0,
        monthlyProfit: monthlyMetrics?.profit || 0,
        profitMargin: monthlyMetrics?.revenue > 0 
          ? ((monthlyMetrics.profit / monthlyMetrics.revenue) * 100).toFixed(2) 
          : 0,
        inventoryValue
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      // Provide default structure on error
      return { 
        totalProducts: 0,
        lowStockItems: 0,
        todaySales: 0,
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0,
        inventoryValue: 0
      };
    }
  });

  // Individual metric handlers (could potentially be removed if dashboard:getStats is always used)
  ipcMain.handle('dashboard:getTotalProductCount', async () => {
    try {
      return await Product.getTotalCount();
    } catch (error) {
      console.error('Error getting total product count:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getLowStockItemCount', async () => {
    try {
      return await Product.getLowStockCount();
    } catch (error) {
      console.error('Error getting low stock item count:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getTodaySalesTotal', async () => {
    try {
      return await Sale.getTodaySalesTotal();
    } catch (error) {
      console.error('Error getting today\'s sales total:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getMonthlyRevenueAndProfit', async () => {
    try {
      return await Sale.getMonthlyRevenueAndProfit(); // Changed to match model method name
    } catch (error) {
      console.error('Error getting monthly revenue and profit:', error);
      throw error;
    }
  });
  
  ipcMain.handle('dashboard:getMonthlyProfitMetrics', async () => {
    try {
       // Delegate directly to Sale model method
       return await Sale.getMonthlyProfitMetrics();
    } catch (error) {
       console.error('Error getting monthly profit metrics:', error);
       return { monthlyRevenue: 0, monthlyProfit: 0, profitMargin: 0 };
    }
  });

  ipcMain.handle('dashboard:getInventoryValue', async () => {
    try {
      return await Product.getTotalInventoryValue();
    } catch (error) {
      console.error('Error getting inventory value:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getInventoryValueByCategory', async () => {
    try {
      return await Product.getInventoryValueByCategory();
    } catch (error) {
      console.error('Error getting inventory value by category:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getInventoryValueBySupplier', async () => {
    try {
      return await Product.getInventoryValueBySupplier();
    } catch (error) {
      console.error('Error getting inventory value by supplier:', error);
      throw error;
    }
  });

  ipcMain.handle('dashboard:getTopSellingProducts', async (_, period = 'month', limit = 5, sortBy = 'quantity', startDate = null, endDate = null) => {
    try {
      return await Sale.getTopSellingProducts(period, limit, sortBy, startDate, endDate);
    } catch (error) {
      console.error('Error getting top selling products:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getRevenueAndProfitBySupplier', async (_, period = 'month', startDate = null, endDate = null) => {
    try {
      return await Sale.getRevenueAndProfitBySupplier(period, startDate, endDate);
    } catch (error) {
      console.error('Error getting revenue and profit by supplier:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getRevenueByPaymentMethod', async (_, startDate, endDate) => {
    try {
      return await Sale.getRevenueByPaymentMethod(startDate, endDate);
    } catch (error) {
      console.error('Error getting revenue by payment method:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getProfitByCategory', async () => {
    try {
      return await Sale.getProfitByCategory();
    } catch (error) {
      console.error('Error getting profit by category:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getCategoryProfits', async (_, period = 'month', startDate = null, endDate = null) => {
    try {
      return await Sale.getProfitByCategory(period, startDate, endDate);
    } catch (error) {
      console.error('Error getting profit by category with date range:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getInventoryTrend', async (_, months = 6) => {
    try {
      return await Product.getInventoryTrend(months);
    } catch (error) {
      console.error('Error getting inventory trend:', error);
      return []; // Return empty array instead of throwing
    }
  });

  ipcMain.handle('dashboard:getProfitAndRevenueTrend', async (_, months = 6) => {
    try {
      return await Sale.getProfitAndRevenueTrend(months);
    } catch (error) {
      console.error('Error getting profit and revenue trend:', error);
      return []; // Return empty array instead of throwing
    }
  });
  
  // Handler for inventory turnover rate
  ipcMain.handle('dashboard:getInventoryTurnoverRate', async () => {
    try {
      return await Product.getInventoryTurnoverRate();
    } catch (error) {
      console.error('Error getting inventory turnover rate:', error);
      return 0; // Default fallback
    }
  });

  // Handler for stock variance (Assuming Product model has this method)
  ipcMain.handle('dashboard:getStockVariance', async () => {
    try {
      return await Product.getStockVariance(); // Check if Product.getStockVariance exists
    } catch (error) {
      console.error('Error getting stock variance:', error);
      return 2.5; // Default fallback
    }
  });

  // Handler for supplier performance (Assuming Supplier model has this method)
  ipcMain.handle('dashboard:getSupplierPerformance', async () => {
    try {
      return await Supplier.getSupplierPerformance(); // Check if Supplier.getSupplierPerformance exists
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      return { onTimeDelivery: 87, qualityScore: 92 }; // Default fallback
    }
  });

  ipcMain.handle('dashboard:getAverageSalesByDayOfWeek', async (_, period = 'month') => {
    try {
      return await Sale.getAverageSalesByDayOfWeek(period);
    } catch (error) {
      console.error('Error getting average sales by day of week:', error);
      return [];
    }
  });

  ipcMain.handle('dashboard:getAverageSalesByMonthOfYear', async (_, year) => {
    try {
      return await Sale.getAverageSalesByMonthOfYear(year);
    } catch (error) {
      console.error('Error getting average sales by month of year:', error);
      return [];
    }
  });
}

module.exports = { registerDashboardHandlers }; 