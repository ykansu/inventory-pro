const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const config = require('./database/config');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// In development mode, use electron-reload to watch for changes
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

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
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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
const { initDatabase } = require('./database/init');
const { createBackup, restoreFromBackup, scheduleBackups } = require('./database/backup');
const { exportToJson, importFromJson, scheduleJsonBackups } = require('./database/json-backup');
const { fixMigrations } = require('./database/fix-migration');
const { Product, Category, Supplier, Sale, Setting } = require('./models');
const db = require('./database/connection');

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    // Fix any migration issues first
    console.log('Running migration fix utility...');
    try {
      await fixMigrations();
    } catch (fixError) {
      console.error('Error running migration fix:', fixError);
      // Continue even if fix fails
    }
    
    // Initialize database
    await initDatabase({ skipSeeding: true });
    
    // Schedule automatic backups
    scheduleBackups();
    
    // Schedule automatic JSON backups if enabled
    scheduleJsonBackups();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
});

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

// Profit metrics handlers
ipcMain.handle('profits:getMonthlyMetrics', async () => {
  try {
    return await Sale.getMonthlyProfitMetrics();
  } catch (error) {
    console.error('Error getting monthly profit metrics:', error);
    throw error;
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
    await createBackup(path.join(config.backup.path, 'pre_reset'));
    
    // Import the force seed utility
    const { forceSeedDatabase } = require('./database/force-seed');
    
    // Reset the database
    console.log('Initiating database reset...');
    const result = await forceSeedDatabase({ skipSeeding: true });
    console.log('Database reset completed with result:', result);
    
    // Close and reestablish the database connection to ensure clean state
    try {
      console.log('Reinitializing database connection after reset...');
      await db.closeConnection();
      
      // Wait briefly to ensure connection is fully closed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recreate the connection
      await db.reinitializeConnection();
      
      // Verify connection is working
      await db.raw('SELECT 1');
      console.log('Database connection successfully reinitialized and verified');
    } catch (connectionError) {
      console.error('Error reinitializing database connection:', connectionError);
      // If connection reinitialization fails, try to reload the module
      try {
        console.log('Attempting to reload database module...');
        delete require.cache[require.resolve('./database/connection')];
        const freshDb = require('./database/connection');
        await freshDb.raw('SELECT 1');
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
    const config = require('./database/config');
    config.setBackupSettings({ jsonPath: dirPath });
    return dirPath;
  } catch (error) {
    console.error('Error updating JSON export directory:', error);
    throw error;
  }
});

// Get JSON export directory
ipcMain.handle('database:getJsonExportDir', async () => {
  try {
    const config = require('./database/config');
    return config.backup.jsonPath;
  } catch (error) {
    console.error('Error getting JSON export directory:', error);
    throw error;
  }
});

// Get JSON backup scheduler settings
ipcMain.handle('database:getJsonBackupSettings', async () => {
  try {
    const config = require('./database/config');
    return {
      enabled: config.backup.jsonBackupEnabled,
      frequency: config.backup.jsonBackupFrequency,
      time: config.backup.jsonBackupTime,
      maxBackups: config.backup.maxJsonBackups
    };
  } catch (error) {
    console.error('Error getting JSON backup settings:', error);
    throw error;
  }
});

// Update JSON backup scheduler settings
ipcMain.handle('database:updateJsonBackupSettings', async (_, settings) => {
  try {
    const config = require('./database/config');
    
    // Update settings
    config.setBackupSettings({
      jsonBackupEnabled: settings.enabled,
      jsonBackupFrequency: settings.frequency,
      jsonBackupTime: settings.time,
      maxJsonBackups: settings.maxBackups
    });
    
    // Restart scheduler
    const { scheduleJsonBackups } = require('./database/json-backup');
    scheduleJsonBackups();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating JSON backup settings:', error);
    throw error;
  }
});

ipcMain.handle('database:getBackupList', async () => {
  try {
    const config = require('./database/config');
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
    await createBackup(path.join(config.backup.path, 'pre_import'));
    
    // Import the data
    const result = await importFromJson(jsonFilePath);
    console.log('JSON import completed with result:', result);
    
    // Close and reestablish the database connection to ensure clean state
    try {
      console.log('Reinitializing database connection after import...');
      await db.closeConnection();
      
      // Wait briefly to ensure connection is fully closed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recreate the connection
      await db.reinitializeConnection();
      
      // Verify connection is working
      await db.raw('SELECT 1');
      console.log('Database connection successfully reinitialized and verified after import');
    } catch (connectionError) {
      console.error('Error reinitializing database connection after import:', connectionError);
      // If connection reinitialization fails, try to reload the module
      try {
        console.log('Attempting to reload database module after import...');
        delete require.cache[require.resolve('./database/connection')];
        const freshDb = require('./database/connection');
        await freshDb.raw('SELECT 1');
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
  await db.closeConnection();
  
  // Now actually quit
  app.exit(0);
});

// Dashboard metrics handlers
ipcMain.handle('dashboard:getStats', async () => {
  try {
    // Get all key dashboard metrics in one query for efficiency
    const { Product, Sale } = require('./models');
    
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
    const { Product } = require('./models');
    return await Product.getTotalCount();
  } catch (error) {
    console.error('Error getting total product count:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getLowStockItemCount', async () => {
  try {
    const { Product } = require('./models');
    return await Product.getLowStockCount();
  } catch (error) {
    console.error('Error getting low stock item count:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getTodaySalesTotal', async () => {
  try {
    const { Sale } = require('./models');
    return await Sale.getTodaySalesTotal();
  } catch (error) {
    console.error('Error getting today\'s sales total:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getMonthlyRevenueAndProfit', async () => {
  try {
    const { Sale } = require('./models');
    return await Sale.getMonthlyRevenueAndProfit();
  } catch (error) {
    console.error('Error getting monthly revenue and profit:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getInventoryValue', async () => {
  try {
    const { Product } = require('./models');
    return await Product.getTotalInventoryValue();
  } catch (error) {
    console.error('Error getting inventory value:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getTopSellingProducts', async (_, limit = 5) => {
  try {
    const { Sale } = require('./models');
    return await Sale.getTopSellingProducts(limit);
  } catch (error) {
    console.error('Error getting top selling products:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getRevenueAndProfitBySupplier', async () => {
  try {
    const { Sale } = require('./models');
    return await Sale.getRevenueAndProfitBySupplier();
  } catch (error) {
    console.error('Error getting revenue and profit by supplier:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getRevenueByPaymentMethod', async () => {
  try {
    const { Sale } = require('./models');
    return await Sale.getRevenueByPaymentMethod();
  } catch (error) {
    console.error('Error getting revenue by payment method:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getProfitByCategory', async () => {
  try {
    const { Sale } = require('./models');
    return await Sale.getProfitByCategory();
  } catch (error) {
    console.error('Error getting profit by category:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getInventoryTrend', async (_, months = 6) => {
  try {
    const { Product } = require('./models');
    return await Product.getInventoryTrend(months);
  } catch (error) {
    console.error('Error getting inventory trend:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getProfitAndRevenueTrend', async (_, months = 6) => {
  try {
    const { Sale } = require('./models');
    return await Sale.getProfitAndRevenueTrend(months);
  } catch (error) {
    console.error('Error getting profit and revenue trend:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getMonthlyProfitMetrics', async () => {
  try {
    const { Sale } = require('./models');
    const currentMonth = new Date();
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get all sales for the current month
    const sales = await Sale.db('sales')
      .where('created_at', '>=', startDate.toISOString())
      .where('created_at', '<=', endDate.toISOString())
      .where('is_returned', false)
      .select('id', 'total_amount');
    
    if (sales.length === 0) {
      return {
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0
      };
    }
    
    // Calculate revenue
    const monthlyRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    
    // Get sale IDs
    const saleIds = sales.map(sale => sale.id);
    
    // Get all sale items with product details to calculate cost
    const saleItemsWithCost = await Sale.db('sale_items')
      .join('products', 'sale_items.product_id', 'products.id')
      .whereIn('sale_items.sale_id', saleIds)
      .select(
        'sale_items.quantity',
        'products.cost_price'
      );
    
    // Calculate total cost
    let totalCost = 0;
    saleItemsWithCost.forEach(item => {
      totalCost += parseFloat(item.cost_price) * parseInt(item.quantity);
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
    throw error;
  }
});