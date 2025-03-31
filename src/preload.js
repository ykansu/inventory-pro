// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// Expose database functionality to the renderer process
contextBridge.exposeInMainWorld('database', {
  // Products
  getAllProducts: () => ipcRenderer.invoke('products:getAll'),
  getProductById: (id) => ipcRenderer.invoke('products:getById', id),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  getProductByBarcode: (barcode) => ipcRenderer.invoke('products:getByBarcode', barcode),
  getLowStockProducts: () => ipcRenderer.invoke('products:getLowStock'),
  updateProductStock: (id, quantity, type, reason, reference) => 
    ipcRenderer.invoke('products:updateStock', id, quantity, type, reason, reference),
  
  // Categories
  getAllCategories: () => ipcRenderer.invoke('categories:getAll'),
  getCategoryById: (id) => ipcRenderer.invoke('categories:getById', id),
  createCategory: (data) => ipcRenderer.invoke('categories:create', data),
  updateCategory: (id, data) => ipcRenderer.invoke('categories:update', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('categories:delete', id),
  
  // Suppliers
  getAllSuppliers: () => ipcRenderer.invoke('suppliers:getAll'),
  getSupplierById: (id) => ipcRenderer.invoke('suppliers:getById', id),
  createSupplier: (data) => ipcRenderer.invoke('suppliers:create', data),
  updateSupplier: (id, data) => ipcRenderer.invoke('suppliers:update', id, data),
  deleteSupplier: (id) => ipcRenderer.invoke('suppliers:delete', id),
  
  // Sales
  createSale: (saleData, items) => ipcRenderer.invoke('sales:create', saleData, items),
  getSaleById: (id) => ipcRenderer.invoke('sales:getById', id),
  getSalesByDateRange: (startDate, endDate) => ipcRenderer.invoke('sales:getByDateRange', startDate, endDate),
  processSaleReturn: (id, returnData, items) => ipcRenderer.invoke('sales:processReturn', id, returnData, items),
  
  // Profit metrics
  getMonthlyProfitMetrics: () => ipcRenderer.invoke('profits:getMonthlyMetrics'),
  getCategoryProfits: () => ipcRenderer.invoke('profits:getCategoryProfits'),
  getProfitValueTrend: () => ipcRenderer.invoke('profits:getProfitValueTrend'),
  
  // Dashboard metrics
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getTotalProductCount: () => ipcRenderer.invoke('dashboard:getTotalProductCount'),
  getLowStockItemCount: () => ipcRenderer.invoke('dashboard:getLowStockItemCount'),
  getTodaySalesTotal: () => ipcRenderer.invoke('dashboard:getTodaySalesTotal'),
  getMonthlyRevenueAndProfit: () => ipcRenderer.invoke('dashboard:getMonthlyRevenueAndProfit'),
  getInventoryValue: () => ipcRenderer.invoke('dashboard:getInventoryValue'),
  getTopSellingProducts: (limit) => ipcRenderer.invoke('dashboard:getTopSellingProducts', limit),
  getRevenueAndProfitBySupplier: () => ipcRenderer.invoke('dashboard:getRevenueAndProfitBySupplier'),
  getRevenueByPaymentMethod: () => ipcRenderer.invoke('dashboard:getRevenueByPaymentMethod'),
  getProfitByCategory: () => ipcRenderer.invoke('dashboard:getProfitByCategory'),
  getInventoryTrend: (months) => ipcRenderer.invoke('dashboard:getInventoryTrend', months),
  getProfitAndRevenueTrend: (months) => ipcRenderer.invoke('dashboard:getProfitAndRevenueTrend', months),
  getMonthlyProfitMetrics: () => ipcRenderer.invoke('dashboard:getMonthlyProfitMetrics'),
  
  // Settings
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),
  getSettingByKey: (key) => ipcRenderer.invoke('settings:getByKey', key),
  updateSetting: (key, value) => ipcRenderer.invoke('settings:update', key, value),
  createSetting: (key, value, type, description) => ipcRenderer.invoke('settings:create', key, value, type, description),
  saveSettingSafely: (key, value, type, description) => ipcRenderer.invoke('settings:saveSafely', key, value, type, description),
  
  // Database management
  createBackup: () => ipcRenderer.invoke('database:createBackup'),
  restoreFromBackup: (backupPath) => ipcRenderer.invoke('database:restoreFromBackup', backupPath),
  getBackupList: () => ipcRenderer.invoke('database:getBackupList'),
  resetDatabase: () => ipcRenderer.invoke('database:resetDatabase'),
});