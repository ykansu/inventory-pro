const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');

// Dynamically load modules with error handling
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    return null;
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (err) {
  console.error('Failed to load electron-squirrel-startup:', err);
}

// In development mode, use electron-reload to watch for changes
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (err) {
    console.warn('Failed to load electron-reload:', err);
  }
}

// Create a window when the app is ready
const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  // Load the index.html of the app.
  // In development mode, load from webpack dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open the DevTools automatically in development mode
    mainWindow.webContents.openDevTools();
    console.log('Running in development mode - loading from webpack dev server');
  } else {
    // In production, load the bundled file
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
  
  // Show any initialization errors in the window
  mainWindow.webContents.on('did-finish-load', () => {
    if (initializationError) {
      dialog.showErrorBox(
        'Initialization Error',
        `Failed to initialize the application: ${initializationError}`
      );
    }
  });
};

// Track initialization errors
let initializationError = null;

// Initialize modules when app is ready
let config = null;
let dbConnection = null;
let createBackup = null;
let restoreFromBackup = null;
let scheduleBackups = null;
let exportToJson = null;
let importFromJson = null;
let scheduleJsonBackups = null;
let exportToExcel = null;
let importFromExcel = null;
let scheduleExcelBackups = null;
let Product = null;
let Category = null;
let Supplier = null;
let Sale = null;
let Setting = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  try {
    // Initialize window
    createWindow();
    
    // Load configuration
    console.log('Loading configuration...');
    config = safeRequire('./database/config');
    if (!config) {
      throw new Error('Failed to load configuration module');
    }
    
    // Load database modules
    console.log('Loading database modules...');
    dbConnection = safeRequire('./database/connection');
    if (!dbConnection) {
      throw new Error('Failed to load database connection module');
    }
    
    // Load backup modules
    const backupModule = safeRequire('./database/backup');
    if (backupModule) {
      createBackup = backupModule.createBackup;
      restoreFromBackup = backupModule.restoreFromBackup;
      scheduleBackups = backupModule.scheduleBackups;
    }
    
    // Load JSON backup modules
    const jsonBackupModule = safeRequire('./database/json-backup');
    if (jsonBackupModule) {
      exportToJson = jsonBackupModule.exportToJson;
      importFromJson = jsonBackupModule.importFromJson;
      scheduleJsonBackups = jsonBackupModule.scheduleJsonBackups;
    }
    
    // Load Excel backup modules
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (excelBackupModule) {
      exportToExcel = excelBackupModule.exportToExcel;
      importFromExcel = excelBackupModule.importFromExcel;
      scheduleExcelBackups = excelBackupModule.runScheduledExcelBackup;
    }
    
    // Load model modules
    const models = safeRequire('./models');
    if (models) {
      Product = models.Product;
      Category = models.Category;
      Supplier = models.Supplier;
      Sale = models.Sale;
      Setting = models.Setting;
    }
    
    // Initialize database
    console.log('Initializing database...');
    const result = await dbConnection.initDatabase({ seedIfNew: true });
    
    if (result.success) {
      console.log('Database initialized successfully');
      
      // Schedule automatic backups if enabled
      if (scheduleBackups) {
        scheduleBackups();
      }
      
      // Schedule automatic JSON backups if enabled
      if (scheduleJsonBackups) {
        scheduleJsonBackups();
      }
      
      // Schedule automatic Excel backups if enabled
      if (config.backup.excelBackupEnabled) {
        console.log('Setting up scheduled Excel backups');
        const excelBackupScheduler = safeRequire('./database/excel-backup-scheduler');
        if (excelBackupScheduler && excelBackupScheduler.scheduleExcelBackups) {
          excelBackupScheduler.scheduleExcelBackups();
          console.log('Excel backup scheduler started');
        } else {
          console.error('Failed to load Excel backup scheduler module');
        }
      }
    } else {
      console.error('Database initialization failed:', result.error);
      dialog.showErrorBox(
        'Database Error',
        'Failed to initialize the database. The application may not function correctly.'
      );
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    initializationError = error.message;
    // Continue to create the window, but show the error
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Database functionality
// All required modules are loaded at initialization time, don't import again

// IPC handlers for database operations

// Product handlers
ipcMain.handle('products:getAll', async () => {
  try {
    return await Product.getAllWithDetails();
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
});

ipcMain.handle('products:getById', async (_, id) => {
  try {
    return await Product.getById(id);
  } catch (error) {
    console.error(`Error getting product ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('products:create', async (_, data) => {
  try {
    return await Product.create(data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
});

ipcMain.handle('products:update', async (_, id, data) => {
  try {
    return await Product.update(id, data);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('products:delete', async (_, id) => {
  try {
    return await Product.delete(id);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('products:getByBarcode', async (_, barcode) => {
  try {
    return await Product.getByBarcode(barcode);
  } catch (error) {
    console.error(`Error getting product by barcode ${barcode}:`, error);
    throw error;
  }
});

ipcMain.handle('products:getLowStock', async () => {
  try {
    return await Product.getLowStock();
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
});

ipcMain.handle('products:updateStock', async (_, id, quantity, adjustmentType, reason, reference) => {
  try {
    return await Product.updateStock(id, quantity, adjustmentType, reason, reference);
  } catch (error) {
    console.error(`Error updating stock for product ${id}:`, error);
    throw error;
  }
});

// Category handlers
ipcMain.handle('categories:getAll', async () => {
  try {
    return await Category.getAllWithProductCount();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
});

ipcMain.handle('categories:getById', async (_, id) => {
  try {
    return await Category.getById(id);
  } catch (error) {
    console.error(`Error getting category ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('categories:create', async (_, data) => {
  try {
    return await Category.create(data);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
});

ipcMain.handle('categories:update', async (_, id, data) => {
  try {
    return await Category.update(id, data);
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('categories:delete', async (_, id) => {
  try {
    return await Category.delete(id);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
});

// Supplier handlers
ipcMain.handle('suppliers:getAll', async () => {
  try {
    return await Supplier.getAllWithProductCount();
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:getById', async (_, id) => {
  try {
    return await Supplier.getById(id);
  } catch (error) {
    console.error(`Error getting supplier ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('suppliers:create', async (_, data) => {
  try {
    return await Supplier.create(data);
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:update', async (_, id, data) => {
  try {
    return await Supplier.update(id, data);
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    throw error;
  }
});

ipcMain.handle('suppliers:delete', async (_, id) => {
  try {
    return await Supplier.delete(id);
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    throw error;
  }
});

// Sale handlers
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

// Profit metrics handlers
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
    return await Sale.getCategoryProfits();
  } catch (error) {
    console.error('Error getting category profits:', error);
    throw error;
  }
});

ipcMain.handle('profits:getProfitValueTrend', async () => {
  try {
    return await Sale.getProfitValueTrend();
  } catch (error) {
    console.error('Error getting profit trend data:', error);
    throw error;
  }
});

// Settings handlers
ipcMain.handle('settings:getAll', async () => {
  try {
    return await Setting.getAllAsObject();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:getByKey', async (_, key) => {
  try {
    return await Setting.getByKey(key);
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    throw error;
  }
});

ipcMain.handle('settings:update', async (_, key, value) => {
  try {
    return await Setting.updateByKey(key, value);
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
});

ipcMain.handle('settings:create', async (_, key, value, type, description) => {
  try {
    return await Setting.createSetting(key, value, type, description);
  } catch (error) {
    console.error(`Error creating setting ${key}:`, error);
    throw error;
  }
});

ipcMain.handle('settings:saveSafely', async (_, key, value, type, description) => {
  try {
    return await Setting.saveSettingSafely(key, value, type, description);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
});

// Database management handlers
ipcMain.handle('database:createBackup', async () => {
  try {
    return await createBackup();
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
});

ipcMain.handle('database:restoreFromBackup', async (_, backupPath) => {
  try {
    return await restoreFromBackup(backupPath);
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw error;
  }
});

// JSON export handler
ipcMain.handle('database:exportToJson', async (_, customPath = null) => {
  try {
    return await exportToJson(customPath);
  } catch (error) {
    console.error('Error exporting data to JSON:', error);
    throw error;
  }
});

// Database reset handler
ipcMain.handle('database:resetDatabase', async () => {
  try {
    console.log('Starting database reset process...');
    // Create a backup before resetting
    if (createBackup && config && config.backup && config.backup.path) {
      await createBackup(path.join(config.backup.path, 'pre_reset'));
    }
    
    // Import the force seed utility
    const forceSeedModule = safeRequire('./database/force-seed');
    const forceSeedDatabase = forceSeedModule ? forceSeedModule.forceSeedDatabase : null;
    
    if (!forceSeedDatabase) {
      throw new Error('Force seed module could not be loaded');
    }
    
    // Reset the database
    console.log('Initiating database reset...');
    const result = await forceSeedDatabase({ skipSeeding: true });
    console.log('Database reset completed with result:', result);
    
    // Close and reestablish the database connection to ensure clean state
    try {
      console.log('Reinitializing database connection after reset...');
      const db = await dbConnection.getConnection();
      await db.raw('SELECT 1');
      console.log('Database connection successfully reinitialized and verified');
    } catch (connectionError) {
      console.error('Error reinitializing database connection:', connectionError);
      // If connection reinitialization fails, try to reload the module
      try {
        console.log('Attempting to reload database module...');
        delete require.cache[require.resolve('./database/connection')];
        dbConnection = safeRequire('./database/connection');
        const db = await dbConnection.getConnection();
        await db.raw('SELECT 1');
        console.log('Database module reloaded successfully');
      } catch (reloadError) {
        console.error('Failed to reload database module:', reloadError);
      }
    }
    
    return { 
      success: result, 
      message: result ? 'Database reset successfully' : 'Failed to reset database' 
    };
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
});

// Select JSON file for import
ipcMain.handle('database:selectJsonFile', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });

    if (result.canceled) return null;
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting JSON file:', error);
    throw error;
  }
});

// Select directory for JSON export
ipcMain.handle('database:selectJsonExportDir', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled) return null;
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting JSON export directory:', error);
    throw error;
  }
});

// Update JSON export directory
ipcMain.handle('database:updateJsonExportDir', async (_, dirPath) => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    config.updateConfig({ 'backup.jsonPath': dirPath });
    return dirPath;
  } catch (error) {
    console.error('Error updating JSON export directory:', error);
    throw error;
  }
});

// Get JSON export directory
ipcMain.handle('database:getJsonExportDir', async () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    return config.backup.jsonPath;
  } catch (error) {
    console.error('Error getting JSON export directory:', error);
    throw error;
  }
});

// Get JSON backup settings
ipcMain.handle('database:getJsonBackupSettings', () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    return {
      enabled: config.backup.jsonBackupEnabled,
      frequency: config.backup.jsonBackupFrequency,
      time: config.backup.jsonBackupTime,
      maxBackups: config.backup.maxJsonBackups,
      path: config.backup.jsonPath
    };
  } catch (error) {
    console.error('Error getting JSON backup settings:', error);
    throw error;
  }
});

// Update JSON backup settings
ipcMain.handle('database:updateJsonBackupSettings', async (_, settings) => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    
    // Convert settings to config format
    const configUpdates = {};
    if (settings.enabled !== undefined) configUpdates['backup.jsonBackupEnabled'] = settings.enabled;
    if (settings.frequency) configUpdates['backup.jsonBackupFrequency'] = settings.frequency;
    if (settings.time) configUpdates['backup.jsonBackupTime'] = settings.time;
    if (settings.maxBackups) configUpdates['backup.maxJsonBackups'] = settings.maxBackups;
    if (settings.path) configUpdates['backup.jsonPath'] = settings.path;
    
    // Update configuration
    config.updateConfig(configUpdates);
    
    // Restart JSON backup scheduling
    if (scheduleJsonBackups) {
      scheduleJsonBackups();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating JSON backup settings:', error);
    throw error;
  }
});

ipcMain.handle('database:getBackupList', async () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    const backupDir = config.backup.path;
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        date: fs.statSync(path.join(backupDir, file)).mtime,
        size: fs.statSync(path.join(backupDir, file)).size
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first
    
    return files;
  } catch (error) {
    console.error('Error getting backup list:', error);
    throw error;
  }
});

// JSON import handler
ipcMain.handle('database:importFromJson', async (_, jsonFilePath) => {
  try {
    console.log('Starting JSON import from:', jsonFilePath);
    // Create a backup before importing
    if (createBackup && config && config.backup && config.backup.path) {
      await createBackup(path.join(config.backup.path, 'pre_import'));
    }
    
    // Import the data
    if (!importFromJson) {
      throw new Error('Import module could not be loaded');
    }
    
    const result = await importFromJson(jsonFilePath);
    console.log('JSON import completed with result:', result);
    
    // Close and reestablish the database connection to ensure clean state
    try {
      console.log('Reinitializing database connection after import...');
      const db = await dbConnection.getConnection();
      await db.raw('SELECT 1');
      console.log('Database connection successfully reinitialized and verified after import');
    } catch (connectionError) {
      console.error('Error reinitializing database connection after import:', connectionError);
      // If connection reinitialization fails, try to reload the module
      try {
        console.log('Attempting to reload database module after import...');
        delete require.cache[require.resolve('./database/connection')];
        dbConnection = safeRequire('./database/connection');
        const db = await dbConnection.getConnection();
        await db.raw('SELECT 1');
        console.log('Database module reloaded successfully after import');
      } catch (reloadError) {
        console.error('Failed to reload database module after import:', reloadError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error importing data from JSON:', error);
    throw error;
  }
});

// Set up graceful shutdown
app.on('before-quit', async (event) => {
  console.log('Application is quitting...');
  // Prevent the default behavior to allow async operations
  event.preventDefault();
  
  // Close database connections
  await dbConnection.closeConnection();
  
  // Now actually quit
  app.exit(0);
});

// Dashboard metrics handlers
ipcMain.handle('dashboard:getStats', async () => {
  try {
    // Get all key dashboard metrics in one query for efficiency
    if (!Product || !Sale) {
      throw new Error('Model modules not loaded');
    }
    
    const [
      totalProducts,
      lowStockItems,
      todaySales,
      monthlyMetrics,
      inventoryValue
    ] = await Promise.all([
      Product.getTotalCount(),
      Product.getLowStockCount(),
      Sale.getTodaySalesTotal(),
      Sale.getMonthlyRevenueAndProfit(),
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
    throw error;
  }
});

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
    return await Sale.getMonthlyRevenueAndProfit();
  } catch (error) {
    console.error('Error getting monthly revenue and profit:', error);
    throw error;
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

ipcMain.handle('dashboard:getTopSellingProducts', async (_, limit = 5) => {
  try {
    return await Sale.getTopSellingProducts(limit);
  } catch (error) {
    console.error('Error getting top selling products:', error);
    return []; // Return empty array instead of throwing
  }
});

ipcMain.handle('dashboard:getRevenueAndProfitBySupplier', async () => {
  try {
    return await Sale.getRevenueAndProfitBySupplier();
  } catch (error) {
    console.error('Error getting revenue and profit by supplier:', error);
    return []; // Return empty array instead of throwing
  }
});

ipcMain.handle('dashboard:getRevenueByPaymentMethod', async () => {
  try {
    return await Sale.getRevenueByPaymentMethod();
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

ipcMain.handle('dashboard:getMonthlyProfitMetrics', async () => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    
    // Get database connection from Sale model
    const db = await Sale.getDb();
    
    // Check if sales table exists first
    const hasSalesTable = await db.schema.hasTable('sales');
    const hasSaleItemsTable = await db.schema.hasTable('sale_items');
    
    if (!hasSalesTable || !hasSaleItemsTable) {
      console.log('sales or sale_items table does not exist, returning default metrics');
      return {
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0
      };
    }
    
    // Get all sales for current month
    const sales = await db('sales')
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .where('is_returned', false)
      .select('id', 'total_amount');
    
    if (sales.length === 0) {
      return {
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0
      };
    }
    
    // Calculate monthly revenue
    const monthlyRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    
    // Get sale IDs
    const saleIds = sales.map(sale => sale.id);
    
    // Get all sale items with product details to calculate cost
    const saleItemsWithCost = await db('sale_items')
      .whereIn('sale_items.sale_id', saleIds)
      .select(
        'sale_items.quantity',
        'sale_items.unit_price',
        'sale_items.total_price',
        'sale_items.historical_cost_price'
      );
    
    // Calculate total cost
    let totalCost = 0;
    saleItemsWithCost.forEach(item => {
      totalCost += parseFloat(item.historical_cost_price) * parseInt(item.quantity);
    });
    
    // Calculate profit and margin
    const monthlyProfit = monthlyRevenue - totalCost;
    const profitMargin = monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;
    
    return {
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyProfit: Math.round(monthlyProfit),
      profitMargin
    };
  } catch (error) {
    console.error('Error getting monthly profit metrics:', error);
    // Return default values instead of throwing
    return {
      monthlyRevenue: 0,
      monthlyProfit: 0,
      profitMargin: 0
    };
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

// Handler for stock variance
ipcMain.handle('dashboard:getStockVariance', async () => {
  try {
    return await Product.getStockVariance();
  } catch (error) {
    console.error('Error getting stock variance:', error);
    return 2.5; // Default fallback
  }
});

// Handler for supplier performance
ipcMain.handle('dashboard:getSupplierPerformance', async () => {
  try {
    return await Supplier.getSupplierPerformance();
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    return { onTimeDelivery: 87, qualityScore: 92 }; // Default fallback
  }
});

// Configuration handlers
ipcMain.handle('config:getPath', () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    return config.envPath;
  } catch (error) {
    console.error('Error getting config path:', error);
    throw error;
  }
});

ipcMain.handle('config:reload', async () => {
  try {
    if (!dbManager) {
      throw new Error('Database manager module not loaded');
    }
    return await dbManager.reloadConfiguration();
  } catch (error) {
    console.error('Error reloading configuration:', error);
    throw error;
  }
});

// Get regular backup settings
ipcMain.handle('database:getBackupSettings', () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    return {
      enabled: config.backup.enabled,
      frequency: config.backup.frequency,
      time: config.backup.time,
      maxBackups: config.backup.maxBackups,
      path: config.backup.path
    };
  } catch (error) {
    console.error('Error getting backup settings:', error);
    throw error;
  }
});

// Update backup settings
ipcMain.handle('database:updateBackupSettings', async (_, settings) => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    
    // Convert settings to config format
    const configUpdates = {};
    if (settings.enabled !== undefined) configUpdates['backup.enabled'] = settings.enabled;
    if (settings.frequency) configUpdates['backup.frequency'] = settings.frequency;
    if (settings.time) configUpdates['backup.time'] = settings.time;
    if (settings.maxBackups) configUpdates['backup.maxBackups'] = settings.maxBackups;
    if (settings.path) configUpdates['backup.path'] = settings.path;
    
    // Update configuration
    config.updateConfig(configUpdates);
    
    // Restart backup scheduling if needed
    if (scheduleBackups) {
      scheduleBackups();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating backup settings:', error);
    throw error;
  }
});

// Language settings handlers
ipcMain.handle('language:get', async () => {
  try {
    const SettingModule = safeRequire('./models/Setting');
    if (!SettingModule) {
      throw new Error('Failed to load Setting module');
    }
    
    return await SettingModule.getLanguage();
  } catch (error) {
    console.error('Error getting language setting:', error);
    return 'en'; // Default to English on error
  }
});

ipcMain.handle('language:set', async (_, language) => {
  try {
    const SettingModule = safeRequire('./models/Setting');
    if (!SettingModule) {
      throw new Error('Failed to load Setting module');
    }
    
    return await SettingModule.setLanguage(language);
  } catch (error) {
    console.error('Error setting language:', error);
    throw error;
  }
});

// Add IPC handlers for Excel import/export
ipcMain.handle('database:exportToExcel', async (_, customPath) => {
  try {
    if (!exportToExcel) {
      const excelBackupModule = safeRequire('./database/excel-backup');
      if (!excelBackupModule || !excelBackupModule.exportToExcel) {
        throw new Error('Excel export module not loaded');
      }
      exportToExcel = excelBackupModule.exportToExcel;
    }
    return await exportToExcel(customPath);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
});

ipcMain.handle('database:importFromExcel', async (_, excelFilePath) => {
  try {
    // Create a backup before import
    if (createBackup && config && config.backup && config.backup.path) {
      await createBackup(path.join(config.backup.path, 'pre_excel_import'));
    }
    
    // Import the Excel file
    if (!importFromExcel) {
      const excelBackupModule = safeRequire('./database/excel-backup');
      if (!excelBackupModule || !excelBackupModule.importFromExcel) {
        throw new Error('Excel import module not loaded');
      }
      importFromExcel = excelBackupModule.importFromExcel;
    }
    return await importFromExcel(excelFilePath);
  } catch (error) {
    console.error('Error importing from Excel:', error);
    throw error;
  }
});

ipcMain.handle('database:selectExcelFile', async () => {
  try {
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (!excelBackupModule) {
      throw new Error('Excel backup module not loaded');
    }
    return await excelBackupModule.selectExcelFile();
  } catch (error) {
    console.error('Error selecting Excel file:', error);
    throw error;
  }
});

ipcMain.handle('database:selectExcelExportDir', async () => {
  try {
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (!excelBackupModule) {
      throw new Error('Excel backup module not loaded');
    }
    return await excelBackupModule.selectExcelExportDir();
  } catch (error) {
    console.error('Error selecting Excel export directory:', error);
    throw error;
  }
});

ipcMain.handle('database:updateExcelExportDir', async (_, dirPath) => {
  try {
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (!excelBackupModule) {
      throw new Error('Excel backup module not loaded');
    }
    return await excelBackupModule.updateExcelExportDir(dirPath);
  } catch (error) {
    console.error('Error updating Excel export directory:', error);
    throw error;
  }
});

ipcMain.handle('database:getExcelExportDir', async () => {
  try {
    if (!config) {
      throw new Error('Configuration module not loaded');
    }
    return config.backup.excelPath;
  } catch (error) {
    console.error('Error getting Excel export directory:', error);
    return path.join(os.homedir(), 'Desktop');
  }
});

ipcMain.handle('database:getExcelBackupSettings', () => {
  try {
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (!excelBackupModule) {
      throw new Error('Excel backup module not loaded');
    }
    return excelBackupModule.getExcelBackupSettings();
  } catch (error) {
    console.error('Error getting Excel backup settings:', error);
    return {
      enabled: config?.backup?.excelBackupEnabled || false,
      frequency: config?.backup?.excelBackupFrequency || 'daily',
      time: config?.backup?.excelBackupTime || '23:00',
      maxBackups: config?.backup?.maxExcelBackups || 5,
      path: config?.backup?.excelPath || path.join(os.homedir(), 'Desktop')
    };
  }
});

ipcMain.handle('database:updateExcelBackupSettings', async (_, settings) => {
  try {
    const excelBackupModule = safeRequire('./database/excel-backup');
    if (!excelBackupModule) {
      throw new Error('Excel backup module not loaded');
    }
    const result = await excelBackupModule.updateExcelBackupSettings(settings);
    
    // Restart Excel backup scheduling if enabled
    if (settings.enabled) {
      const excelBackupScheduler = safeRequire('./database/excel-backup-scheduler');
      if (excelBackupScheduler) {
        excelBackupScheduler.scheduleExcelBackups();
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error updating Excel backup settings:', error);
    throw error;
  }
});