const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

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
const { Product, Category, Supplier, Sale, Setting } = require('./models');
const db = require('./database/connection');

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    // Initialize database
    await initDatabase();
    
    // Schedule automatic backups
    scheduleBackups();
    
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

// Database reset handler
ipcMain.handle('database:resetDatabase', async () => {
  try {
    // Create a backup before resetting
    await createBackup();
    
    // Import the force seed utility
    const { forceSeedDatabase } = require('./database/force-seed');
    
    // Reset the database
    const result = await forceSeedDatabase();
    
    return { 
      success: result, 
      message: result ? 'Database reset successfully' : 'Failed to reset database' 
    };
  } catch (error) {
    console.error('Error resetting database:', error);
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