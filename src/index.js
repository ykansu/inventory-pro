const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');

// Import IPC handler registration functions
const { registerProductHandlers } = require('./ipcHandlers/productHandlers');
const { registerCategoryHandlers } = require('./ipcHandlers/categoryHandlers');
const { registerSupplierHandlers } = require('./ipcHandlers/supplierHandlers');
const { registerSaleHandlers } = require('./ipcHandlers/saleHandlers');
const { registerSettingsHandlers } = require('./ipcHandlers/settingsHandlers');
const { registerDatabaseHandlers } = require('./ipcHandlers/databaseHandlers');
const { registerDashboardHandlers } = require('./ipcHandlers/dashboardHandlers');
const { registerConfigHandlers } = require('./ipcHandlers/configHandlers');
const { registerLanguageHandlers } = require('./ipcHandlers/languageHandlers');

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
    safeRequire('electron-reload')(__dirname, { 
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('electron-reload not found or failed to load', error);
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
let dbManager = null;
let createBackup = null;
let restoreFromBackup = null;
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
    dbManager = safeRequire('./database/dbManager');
    if (!dbManager) {
      throw new Error('Failed to load database connection module');
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
    const { success, error } = await dbManager.initDatabase();
    
    if (success) {
      console.log('Database initialized successfully');
      
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

      // Register all IPC handlers after modules are loaded
      console.log('Registering IPC handlers...');
      const handlerDependencies = {
        config,
        dbManager,
        models, // Pass loaded models
        Product, Category, Supplier, Sale, Setting, // Explicit models if preferred
        exportToJson, importFromJson,
        exportToExcel, importFromExcel
      };

      registerProductHandlers(handlerDependencies);
      registerCategoryHandlers(handlerDependencies);
      registerSupplierHandlers(handlerDependencies);
      registerSaleHandlers(handlerDependencies);
      registerSettingsHandlers(handlerDependencies);
      registerDatabaseHandlers(handlerDependencies);
      registerDashboardHandlers(handlerDependencies);
      registerConfigHandlers(handlerDependencies);
      registerLanguageHandlers(handlerDependencies);
      console.log('IPC handlers registered.');

    } else {
      console.error('Database initialization failed:', error);
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

// Set up graceful shutdown
app.on('before-quit', async (event) => {
  console.log('Application is quitting...');
  // Prevent the default behavior to allow async operations
  event.preventDefault();
  
  // Close database connections
  await dbManager.closeConnection();
  
  // Now actually quit
  app.exit(0);
});