/**
 * Database Service
 * 
 * Provides an interface for React components to interact with the database
 * through Electron's IPC.
 */

// Product-related operations
export const ProductService = {
  // Get all products
  getAllProducts: async () => {
    try {
      const products = await window.database.getAllProducts();
      return products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      return await window.database.getProductById(id);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      return await window.database.createProduct(productData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update existing product
  updateProduct: async (id, productData) => {
    try {
      return await window.database.updateProduct(id, productData);
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      return await window.database.deleteProduct(id);
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      return await window.database.getProductByBarcode(barcode);
    } catch (error) {
      console.error(`Error fetching product by barcode ${barcode}:`, error);
      throw error;
    }
  },

  // Get low stock products
  getLowStockProducts: async () => {
    try {
      return await window.database.getLowStockProducts();
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  // Update product stock
  updateStock: async (id, quantity, adjustmentType, reason, reference) => {
    try {
      return await window.database.updateProductStock(id, quantity, adjustmentType, reason, reference);
    } catch (error) {
      console.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  }
};

// Category-related operations
export const CategoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      return await window.database.getAllCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      return await window.database.getCategoryById(id);
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    try {
      return await window.database.createCategory(categoryData);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update existing category
  updateCategory: async (id, categoryData) => {
    try {
      return await window.database.updateCategory(id, categoryData);
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      return await window.database.deleteCategory(id);
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }
};

// Supplier-related operations
export const SupplierService = {
  // Get all suppliers
  getAllSuppliers: async () => {
    try {
      return await window.database.getAllSuppliers();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  // Get supplier by ID
  getSupplierById: async (id) => {
    try {
      return await window.database.getSupplierById(id);
    } catch (error) {
      console.error(`Error fetching supplier ${id}:`, error);
      throw error;
    }
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    try {
      return await window.database.createSupplier(supplierData);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  // Update existing supplier
  updateSupplier: async (id, supplierData) => {
    try {
      return await window.database.updateSupplier(id, supplierData);
    } catch (error) {
      console.error(`Error updating supplier ${id}:`, error);
      throw error;
    }
  },

  // Delete supplier
  deleteSupplier: async (id) => {
    try {
      return await window.database.deleteSupplier(id);
    } catch (error) {
      console.error(`Error deleting supplier ${id}:`, error);
      throw error;
    }
  }
};

// Sale-related operations
export const SaleService = {
  // Create new sale
  createSale: async (saleData, items) => {
    try {
      return await window.database.createSale(saleData, items);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // Get sale by ID
  getSaleById: async (id) => {
    try {
      return await window.database.getSaleById(id);
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },

  // Get sales by date range
  getSalesByDateRange: async (startDate, endDate) => {
    try {
      return await window.database.getSalesByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error fetching sales by date range:', error);
      throw error;
    }
  },
  
  // Get paginated sales by date range
  getPaginatedSales: async (startDate, endDate, page = 1, pageSize = 10, filters = {}) => {
    try {
      return await window.database.getPaginatedSales(startDate, endDate, page, pageSize, filters);
    } catch (error) {
      console.error('Error fetching paginated sales:', error);
      // Return a structured error object instead of throwing
      return {
        success: false,
        error: error.message || 'Failed to fetch paginated sales',
        sales: [],
        totalCount: 0,
        page: page,
        pageSize: pageSize,
        totalPages: 0
      };
    }
  },

  // Process sale return
  processSaleReturn: async (id, returnData, items) => {
    try {
      return await window.database.processSaleReturn(id, returnData, items);
    } catch (error) {
      console.error(`Error processing return for sale ${id}:`, error);
      throw error;
    }
  },
  
  // Cancel a sale
  cancelSale: async (id) => {
    try {
      return await window.database.cancelSale(id);
    } catch (error) {
      console.error(`Error canceling sale ${id}:`, error);
      throw error;
    }
  },
  
  // Get monthly profit metrics
  getMonthlyProfitMetrics: async () => {
    try {
      return await window.database.getMonthlyProfitMetrics();
    } catch (error) {
      console.error('Error fetching monthly profit metrics:', error);
      throw error;
    }
  },
  
  // Get profit metrics by category
  getCategoryProfits: async () => {
    try {
      return await window.database.getCategoryProfits();
    } catch (error) {
      console.error('Error fetching category profits:', error);
      throw error;
    }
  },
  
  // Get profit trend data for last 6 months
  getProfitValueTrend: async () => {
    try {
      return await window.database.getProfitValueTrend();
    } catch (error) {
      console.error('Error fetching profit value trend:', error);
      throw error;
    }
  }
};

// Dashboard-related operations
export const DashboardService = {
  // Get key dashboard metrics in a single call
  getDashboardStats: async () => {
    try {
      return await window.database.getDashboardStats();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
  
  // Get total product count
  getTotalProductCount: async () => {
    try {
      return await window.database.getTotalProductCount();
    } catch (error) {
      console.error('Error fetching total product count:', error);
      throw error;
    }
  },
  
  // Get low stock item count
  getLowStockItemCount: async () => {
    try {
      return await window.database.getLowStockItemCount();
    } catch (error) {
      console.error('Error fetching low stock item count:', error);
      throw error;
    }
  },
  
  // Get today's sales total
  getTodaySalesTotal: async () => {
    try {
      return await window.database.getTodaySalesTotal();
    } catch (error) {
      console.error('Error fetching today\'s sales total:', error);
      throw error;
    }
  },
  
  // Get monthly revenue and profit data
  getMonthlyRevenueAndProfit: async () => {
    try {
      return await window.database.getMonthlyRevenueAndProfit();
    } catch (error) {
      console.error('Error fetching monthly revenue and profit:', error);
      throw error;
    }
  },
  
  // Get inventory value
  getInventoryValue: async () => {
    try {
      return await window.database.getInventoryValue();
    } catch (error) {
      console.error('Error fetching inventory value:', error);
      throw error;
    }
  },
  
  // Get inventory value by category
  getInventoryValueByCategory: async () => {
    try {
      return await window.database.getInventoryValueByCategory();
    } catch (error) {
      console.error('Error fetching inventory value by category:', error);
      throw error;
    }
  },
  
  // Get inventory value by supplier
  getInventoryValueBySupplier: async () => {
    try {
      return await window.database.getInventoryValueBySupplier();
    } catch (error) {
      console.error('Error fetching inventory value by supplier:', error);
      throw error;
    }
  },
  
  // Get top selling products
  getTopSellingProducts: async (period = 'month', limit = 5, sortBy = 'quantity') => {
    try {
      return await window.database.getTopSellingProducts(period, limit, sortBy);
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }
  },
  
  // Get revenue and profit by supplier
  getRevenueAndProfitBySupplier: async () => {
    try {
      return await window.database.getRevenueAndProfitBySupplier();
    } catch (error) {
      console.error('Error fetching revenue and profit by supplier:', error);
      throw error;
    }
  },
  
  // Get revenue by payment method
  getRevenueByPaymentMethod: async () => {
    try {
      return await window.database.getRevenueByPaymentMethod();
    } catch (error) {
      console.error('Error fetching revenue by payment method:', error);
      throw error;
    }
  },
  
  // Get profit and revenue by category
  getProfitByCategory: async () => {
    try {
      return await window.database.getProfitByCategory();
    } catch (error) {
      console.error('Error fetching profit by category:', error);
      throw error;
    }
  },
  
  // Get inventory trend data for the past months
  getInventoryTrend: async (months = 6) => {
    try {
      const result = await window.database.getInventoryTrend(months);
      return result;
    } catch (error) {
      console.error('Error fetching inventory trend:', error);
      throw error;
    }
  },
  
  // Get profit trend data for the past months
  getProfitAndRevenueTrend: async (months = 6) => {
    try {
      return await window.database.getProfitAndRevenueTrend(months);
    } catch (error) {
      console.error('Error fetching profit and revenue trend:', error);
      throw error;
    }
  },
  
  // Get monthly profit metrics
  getMonthlyProfitMetrics: async () => {
    try {
      return await window.database.getMonthlyProfitMetrics();
    } catch (error) {
      console.error('Error fetching monthly profit metrics:', error);
      throw error;
    }
  },
  
  // Get inventory turnover rate
  getInventoryTurnoverRate: async () => {
    try {
      return await window.database.getInventoryTurnoverRate();
    } catch (error) {
      console.error('Error fetching inventory turnover rate:', error);
      throw error;
    }
  },
  
  // Get stock variance
  getStockVariance: async () => {
    try {
      return await window.database.getStockVariance();
    } catch (error) {
      console.error('Error fetching stock variance:', error);
      throw error;
    }
  },
  
  // Get supplier performance
  getSupplierPerformance: async () => {
    try {
      return await window.database.getSupplierPerformance();
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
      throw error;
    }
  }
};

// Settings-related operations
export const SettingService = {
  // Get all settings
  getAllSettings: async () => {
    try {
      return await window.database.getAllSettings();
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Get setting by key
  getSettingByKey: async (key) => {
    try {
      return await window.database.getSettingByKey(key);
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error);
      throw error;
    }
  },

  // Update setting
  updateSetting: async (key, value) => {
    try {
      return await window.database.updateSetting(key, value);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  },
  
  // Create setting
  createSetting: async (key, value, type = 'string', description = '') => {
    try {
      return await window.database.createSetting(key, value, type, description);
    } catch (error) {
      console.error(`Error creating setting ${key}:`, error);
      throw error;
    }
  },
  
  // Create or update setting
  saveSettingSafely: async (key, value, type = 'string', description = '') => {
    try {
      // Try to get the setting first
      const setting = await window.database.getSettingByKey(key);
      
      if (setting) {
        // Setting exists, update it
        return await window.database.updateSetting(key, value);
      } else {
        // Setting doesn't exist, create it
        return await window.database.createSetting(key, value, type, description);
      }
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      throw error;
    }
  },
  
  // Reset settings to defaults
  resetSettings: async () => {
    try {
      // Default settings
      const defaults = {
        'business_name': 'Inventory Pro Store',
        'business_address': 'Istanbul, Turkey',
        'business_phone': '+90 123 456 7890',
        'business_email': 'contact@inventorypro.com',
        'currency': 'usd',
        'receipt_footer': 'Thank you for your purchase!',
        'date_format': 'mm/dd/yyyy',
        'time_format': '24',
        'enable_notifications': false,
        'language': 'en'
      };
      
      // Apply each default setting
      for (const [key, value] of Object.entries(defaults)) {
        const type = typeof value === 'number' ? 'number' : 
                    typeof value === 'boolean' ? 'boolean' : 'string';
        
        await SettingService.saveSettingSafely(
          key, 
          value, 
          type, 
          `Default ${key} setting`
        );
      }
      
      return await SettingService.getAllSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },
  
  // Dump settings for debugging
  dumpSettings: async () => {
    try {
      return await window.database.dumpSettings();
    } catch (error) {
      console.error(`Error dumping settings:`, error);
      throw error;
    }
  }
};

// Database management operations
export const DatabaseManagementService = {
  // Create a backup of the database
  createBackup: async () => {
    try {
      return await window.database.createBackup();
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },
  
  // Restore from a backup file
  restoreFromBackup: async (backupPath) => {
    try {
      return await window.database.restoreFromBackup(backupPath);
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  },
  
  // Get list of available backups
  getBackupList: async () => {
    try {
      return await window.database.getBackupList();
    } catch (error) {
      console.error('Error getting backup list:', error);
      throw error;
    }
  },
  
  // Reset database to initial state (will delete all data!)
  resetDatabase: async () => {
    try {
      return await window.database.resetDatabase();
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  },
  
  // Export data to JSON file
  exportToJson: async (customPath = null) => {
    try {
      return await window.database.exportToJson(customPath);
    } catch (error) {
      console.error('Error exporting data to JSON:', error);
      throw error;
    }
  },
  
  // Import data from JSON file
  importFromJson: async (jsonFilePath) => {
    try {
      return await window.database.importFromJson(jsonFilePath);
    } catch (error) {
      console.error('Error importing data from JSON:', error);
      throw error;
    }
  },
  
  // Select JSON file for import
  selectJsonFile: async () => {
    try {
      return await window.database.selectJsonFile();
    } catch (error) {
      console.error('Error selecting JSON file:', error);
      throw error;
    }
  },
  
  // Select directory for JSON export
  selectJsonExportDir: async () => {
    try {
      return await window.database.selectJsonExportDir();
    } catch (error) {
      console.error('Error selecting JSON export directory:', error);
      throw error;
    }
  },
  
  // Update JSON export directory
  updateJsonExportDir: async (dirPath) => {
    try {
      return await window.database.updateJsonExportDir(dirPath);
    } catch (error) {
      console.error('Error updating JSON export directory:', error);
      throw error;
    }
  },
  
  // Get JSON export directory
  getJsonExportDir: async () => {
    try {
      return await window.database.getJsonExportDir();
    } catch (error) {
      console.error('Error getting JSON export directory:', error);
      throw error;
    }
  },
  
  // Get JSON backup scheduler settings
  getJsonBackupSettings: async () => {
    try {
      return await window.database.getJsonBackupSettings();
    } catch (error) {
      console.error('Error getting JSON backup settings:', error);
      throw error;
    }
  },
  
  // Update JSON backup scheduler settings
  updateJsonBackupSettings: async (settings) => {
    try {
      return await window.database.updateJsonBackupSettings(settings);
    } catch (error) {
      console.error('Error updating JSON backup settings:', error);
      throw error;
    }
  },
  
  // Export data to Excel file
  exportToExcel: async (customPath = null) => {
    try {
      return await window.database.exportToExcel(customPath);
    } catch (error) {
      console.error('Error exporting data to Excel:', error);
      throw error;
    }
  },
  
  // Import data from Excel file
  importFromExcel: async (excelFilePath) => {
    try {
      return await window.database.importFromExcel(excelFilePath);
    } catch (error) {
      console.error('Error importing data from Excel:', error);
      throw error;
    }
  },
  
  // Select Excel file for import
  selectExcelFile: async () => {
    try {
      return await window.database.selectExcelFile();
    } catch (error) {
      console.error('Error selecting Excel file:', error);
      throw error;
    }
  },
  
  // Select directory for Excel export
  selectExcelExportDir: async () => {
    try {
      return await window.database.selectExcelExportDir();
    } catch (error) {
      console.error('Error selecting Excel export directory:', error);
      throw error;
    }
  },
  
  // Update Excel export directory
  updateExcelExportDir: async (dirPath) => {
    try {
      return await window.database.updateExcelExportDir(dirPath);
    } catch (error) {
      console.error('Error updating Excel export directory:', error);
      throw error;
    }
  },
  
  // Get Excel export directory
  getExcelExportDir: async () => {
    try {
      return await window.database.getExcelExportDir();
    } catch (error) {
      console.error('Error getting Excel export directory:', error);
      throw error;
    }
  },
  
  // Get Excel backup scheduler settings
  getExcelBackupSettings: async () => {
    try {
      return await window.database.getExcelBackupSettings();
    } catch (error) {
      console.error('Error getting Excel backup settings:', error);
      throw error;
    }
  },
  
  // Update Excel backup scheduler settings
  updateExcelBackupSettings: async (settings) => {
    try {
      return await window.database.updateExcelBackupSettings(settings);
    } catch (error) {
      console.error('Error updating Excel backup settings:', error);
      throw error;
    }
  },
};

// Expense-related operations
export const ExpenseService = {
  // Get all expenses with optional filters
  getAllExpenses: async (filters = {}) => {
    try {
      const expenses = await window.database.getAllExpenses(filters);
      return expenses || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get expense by ID
  getExpenseById: async (id) => {
    try {
      return await window.database.getExpenseById(id);
    } catch (error) {
      console.error(`Error fetching expense ${id}:`, error);
      throw error;
    }
  },

  // Create new expense
  createExpense: async (expenseData) => {
    try {
      return await window.database.createExpense(expenseData);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  updateExpense: async (id, expenseData) => {
    try {
      return await window.database.updateExpense(id, expenseData);
    } catch (error) {
      console.error(`Error updating expense ${id}:`, error);
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (id) => {
    try {
      return await window.database.deleteExpense(id);
    } catch (error) {
      console.error(`Error deleting expense ${id}:`, error);
      throw error;
    }
  },

  // Get expenses trend data
  getExpensesTrend: async (months = 6) => {
    try {
      return await window.database.getExpensesTrend(months);
    } catch (error) {
      console.error('Error fetching expenses trend:', error);
      throw error;
    }
  }
};

// Expense Category operations
export const ExpenseCategoryService = {
  // Get all expense categories
  getAllCategories: async () => {
    try {
      return await window.database.getAllExpenseCategories();
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  },

  // Create new expense category
  createCategory: async (categoryData) => {
    try {
      return await window.database.createExpenseCategory(categoryData);
    } catch (error) {
      console.error('Error creating expense category:', error);
      throw error;
    }
  },

  // Update expense category
  updateCategory: async (id, categoryData) => {
    try {
      return await window.database.updateExpenseCategory(id, categoryData);
    } catch (error) {
      console.error(`Error updating expense category ${id}:`, error);
      throw error;
    }
  },

  // Delete expense category
  deleteCategory: async (id) => {
    try {
      return await window.database.deleteExpenseCategory(id);
    } catch (error) {
      console.error(`Error deleting expense category ${id}:`, error);
      throw error;
    }
  }
};
