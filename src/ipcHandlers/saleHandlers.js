const { ipcMain } = require('electron');
const { Sale } = require('../models');

function registerSaleHandlers() {
  ipcMain.handle('sales:create', async (_, saleData, items) => {
    try {
      return await Sale.createWithItems(saleData, items);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  });

  ipcMain.handle('sales:getById', async (_, id) => {
    try {
      return await Sale.getWithItems(id);
    } catch (error) {
      console.error(`Error getting sale ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('sales:getByDateRange', async (_, startDate, endDate) => {
    try {
      return await Sale.getByDateRange(startDate, endDate);
    } catch (error) {
      console.error(`Error getting sales by date range:`, error);
      throw error;
    }
  });

  ipcMain.handle('sales:getPaginatedSales', async (_, startDate, endDate, page, pageSize, filters) => {
    try {
      const { paymentMethod, query } = filters || {};
      return await Sale.getPaginatedSales(startDate, endDate, page, pageSize, paymentMethod, query);
    } catch (error) {
      console.error(`Error getting paginated sales:`, error);
      return {
        success: false,
        error: error.message,
        sales: [],
        totalCount: 0,
        page: page,
        pageSize: pageSize,
        totalPages: 0
      };
    }
  });

  ipcMain.handle('sales:processReturn', async (_, id, returnData, items) => {
    try {
      return await Sale.processReturn(id, returnData, items);
    } catch (error) {
      console.error(`Error processing return for sale ${id}:`, error);
      throw error;
    }
  });

  ipcMain.handle('sales:cancelSale', async (_, id) => {
    try {
      return await Sale.cancelSale(id);
    } catch (error) {
      console.error(`Error canceling sale ${id}:`, error);
      throw error;
    }
  });

  // Note: Profit metrics handlers that use the Sale model are included here
  ipcMain.handle('profits:getMonthlyMetrics', async () => {
    try {
      const metrics = await Sale.getMonthlyProfitMetrics();
      return metrics;
    } catch (error) {
      console.error('Error getting monthly profit metrics:', error);
      return {
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0
      };
    }
  });

  ipcMain.handle('profits:getCategoryProfits', async () => {
    try {
      return await Sale.getCategoryProfits(); // Assuming this exists or should be moved to Sale model
    } catch (error) {
      console.error('Error getting category profits:', error);
      throw error;
    }
  });

  ipcMain.handle('profits:getProfitValueTrend', async () => {
    try {
      return await Sale.getProfitValueTrend(); // Assuming this exists or should be moved to Sale model
    } catch (error) {
      console.error('Error getting profit trend data:', error);
      throw error;
    }
  });
}

module.exports = { registerSaleHandlers }; 