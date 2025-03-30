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

  // Process sale return
  processSaleReturn: async (id, returnData, items) => {
    try {
      return await window.database.processSaleReturn(id, returnData, items);
    } catch (error) {
      console.error(`Error processing return for sale ${id}:`, error);
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
  }
};
