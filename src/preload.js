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
  getPaginatedSales: (startDate, endDate, page, pageSize, filters) => 
    ipcRenderer.invoke('sales:getPaginatedSales', startDate, endDate, page, pageSize, filters),
  processSaleReturn: (id, returnData, items) => ipcRenderer.invoke('sales:processReturn', id, returnData, items),
  cancelSale: (id) => ipcRenderer.invoke('sales:cancelSale', id),
  
  // Expenses
  getAllExpenses: (filters) => ipcRenderer.invoke('expenses:getAll', filters),
  getExpenseById: (id) => ipcRenderer.invoke('expenses:getById', id),
  createExpense: (data) => ipcRenderer.invoke('expenses:create', data),
  updateExpense: (id, data) => ipcRenderer.invoke('expenses:update', id, data),
  deleteExpense: (id) => ipcRenderer.invoke('expenses:delete', id),
  getMonthlyExpenses: () => ipcRenderer.invoke('expenses:getMonthlyExpenses'),
  getExpensesByCategory: (startDate, endDate) => ipcRenderer.invoke('expenses:getByCategory', startDate, endDate),
  getExpensesTrend: (months) => ipcRenderer.invoke('expenses:getExpensesTrend', months),
  
  // Expense Categories
  getAllExpenseCategories: () => ipcRenderer.invoke('expense-categories:getAll'),
  getExpenseCategoryById: (id) => ipcRenderer.invoke('expense-categories:getById', id),
  createExpenseCategory: (data) => ipcRenderer.invoke('expense-categories:create', data),
  updateExpenseCategory: (id, data) => ipcRenderer.invoke('expense-categories:update', id, data),
  deleteExpenseCategory: (id) => ipcRenderer.invoke('expense-categories:delete', id),
  getExpenseCategoriesWithCount: () => ipcRenderer.invoke('expense-categories:getWithExpenseCount'),
  
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
  getInventoryValueByCategory: () => ipcRenderer.invoke('dashboard:getInventoryValueByCategory'),
  getInventoryValueBySupplier: () => ipcRenderer.invoke('dashboard:getInventoryValueBySupplier'),
  getTopSellingProducts: (period, limit, sortBy) => ipcRenderer.invoke('dashboard:getTopSellingProducts', period, limit, sortBy),
  getRevenueAndProfitBySupplier: () => ipcRenderer.invoke('dashboard:getRevenueAndProfitBySupplier'),
  getRevenueByPaymentMethod: (startDate, endDate) => ipcRenderer.invoke('dashboard:getRevenueByPaymentMethod', startDate, endDate),
  getProfitByCategory: () => ipcRenderer.invoke('dashboard:getProfitByCategory'),
  getInventoryTrend: (months) => ipcRenderer.invoke('dashboard:getInventoryTrend', months),
  getProfitAndRevenueTrend: (months) => ipcRenderer.invoke('dashboard:getProfitAndRevenueTrend', months),
  getMonthlyProfitMetrics: () => ipcRenderer.invoke('dashboard:getMonthlyProfitMetrics'),
  getInventoryTurnoverRate: () => ipcRenderer.invoke('dashboard:getInventoryTurnoverRate'),
  getStockVariance: () => ipcRenderer.invoke('dashboard:getStockVariance'),
  getSupplierPerformance: () => ipcRenderer.invoke('dashboard:getSupplierPerformance'),
  getAverageSalesByDayOfWeek: (period) => ipcRenderer.invoke('dashboard:getAverageSalesByDayOfWeek', period),
  getAverageSalesByMonthOfYear: (year) => ipcRenderer.invoke('dashboard:getAverageSalesByMonthOfYear', year),
  
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
  getBackupSettings: () => ipcRenderer.invoke('database:getBackupSettings'),
  updateBackupSettings: (settings) => ipcRenderer.invoke('database:updateBackupSettings', settings),
  
  // JSON import/export
  exportToJson: (customPath) => ipcRenderer.invoke('database:exportToJson', customPath),
  importFromJson: (jsonFilePath) => ipcRenderer.invoke('database:importFromJson', jsonFilePath),
  selectJsonFile: () => ipcRenderer.invoke('database:selectJsonFile'),
  selectJsonExportDir: () => ipcRenderer.invoke('database:selectJsonExportDir'),
  updateJsonExportDir: (dirPath) => ipcRenderer.invoke('database:updateJsonExportDir', dirPath),
  getJsonExportDir: () => ipcRenderer.invoke('database:getJsonExportDir'),
  
  // JSON backup scheduler
  getJsonBackupSettings: () => ipcRenderer.invoke('database:getJsonBackupSettings'),
  updateJsonBackupSettings: (settings) => ipcRenderer.invoke('database:updateJsonBackupSettings', settings),
  
  // Excel import/export
  exportToExcel: (customPath) => ipcRenderer.invoke('database:exportToExcel', customPath),
  importFromExcel: (excelFilePath) => ipcRenderer.invoke('database:importFromExcel', excelFilePath),
  selectExcelFile: () => ipcRenderer.invoke('database:selectExcelFile'),
  selectExcelExportDir: () => ipcRenderer.invoke('database:selectExcelExportDir'),
  updateExcelExportDir: (dirPath) => ipcRenderer.invoke('database:updateExcelExportDir', dirPath),
  getExcelExportDir: () => ipcRenderer.invoke('database:getExcelExportDir'),
  
  // Excel backup scheduler
  getExcelBackupSettings: () => ipcRenderer.invoke('database:getExcelBackupSettings'),
  updateExcelBackupSettings: (settings) => ipcRenderer.invoke('database:updateExcelBackupSettings', settings),
  
  // Configuration
  getConfigPath: () => ipcRenderer.invoke('config:getPath'),
  reloadConfig: () => ipcRenderer.invoke('config:reload'),
  onConfigChanged: (callback) => ipcRenderer.on('config-changed', callback),
  removeConfigChangedListener: () => ipcRenderer.removeAllListeners('config-changed'),
  
  // Language settings
  getLanguage: () => ipcRenderer.invoke('language:get'),
  setLanguage: (language) => ipcRenderer.invoke('language:set', language),
});

// Expose update checking functionality to the renderer process
contextBridge.exposeInMainWorld('updates', {
  // Listen for update availability notifications
  onUpdatesAvailable: (callback) => ipcRenderer.on('updates-available', callback),
  removeUpdatesAvailableListener: () => ipcRenderer.removeAllListeners('updates-available'),
});