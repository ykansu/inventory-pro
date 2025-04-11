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
const { registerExpenseHandlers } = require('./ipcHandlers/expenseHandlers');

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
    show: false, // Hide window initially
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
  });
  mainWindow.maximize();
  mainWindow.show();

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

  // Add close event handler to ask about Excel backup
  mainWindow.on('close', async (event) => {
    // Check if Excel backup on exit is enabled
    if (process.env.ENABLE_EXCEL_BACKUP_ON_EXIT?.toLowerCase() !== 'true') {
      // If not enabled, allow normal closing without prompt
      return;
    }
    
    // Prevent the window from closing
    event.preventDefault();
    
    // Get the current language from settings/config
    let language = 'en'; // Default language
    try {
      // Try to get language from Setting model if available
      if (Setting && Setting.getLanguage) {
        language = await Setting.getLanguage();
      } else {
        // Fallback: try to get from database directly
        const db = await dbManager.getConnection();
        const languageSetting = await db('settings').where('key', 'language').first();
        if (languageSetting) {
          language = languageSetting.value;
        }
      }
    } catch (error) {
      console.error('Failed to get language setting:', error);
      // Continue with default language
    }
    
    // Get translations from files
    let translations = {};
    
    try {
      // For main process, we need to require the translation files directly
      const commonTranslations = language === 'en' 
        ? require('./translations/en/common.json')
        : require('./translations/tr/common.json');
      
      translations = commonTranslations;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Use hardcoded English strings as fallback
      translations = {
        closeDialog: {
          title: "Close Application",
          exportPrompt: "Do you want to export an Excel backup before closing?",
          yes: "Yes",
          no: "No",
          cancel: "Cancel",
          backupComplete: "Backup Complete",
          backupPath: "Excel backup exported to:",
          backupFailed: "Backup Failed",
          backupError: "Failed to export Excel backup:"
        }
      };
    }
    
    // Ask if user wants to export Excel backup before closing
    const { response } = await dialog.showMessageBox({
      type: 'question',
      buttons: [
        translations.closeDialog?.yes || 'Yes', 
        translations.closeDialog?.no || 'No', 
        translations.closeDialog?.cancel || 'Cancel'
      ],
      defaultId: 1,
      title: translations.closeDialog?.title || 'Close Application',
      message: translations.closeDialog?.exportPrompt || 'Do you want to export an Excel backup before closing?'
    });
    
    if (response === 0) { // Yes
      try {
        // Use the exportToExcel from the parent scope
        if (typeof exportToExcel === 'function') {
          const exportPath = await exportToExcel();
          await dialog.showMessageBox({
            type: 'info',
            title: translations.closeDialog?.backupComplete || 'Backup Complete',
            message: `${translations.closeDialog?.backupPath || 'Excel backup exported to:'}\n${exportPath}`
          });
          // Close the app after backup
          mainWindow.destroy();
        } else {
          throw new Error('Excel export function not available');
        }
      } catch (error) {
        console.error('Excel export error:', error);
        await dialog.showMessageBox({
          type: 'error',
          title: translations.closeDialog?.backupFailed || 'Backup Failed',
          message: `${translations.closeDialog?.backupError || 'Failed to export Excel backup:'} ${error.message}`
        });
        // Still close the app since backup failed
        mainWindow.destroy();
      }
    } else if (response === 1) { // No
      // Close the app without backup
      mainWindow.destroy();
    }
    // For 'Cancel', do nothing (window stays open)
  });
  
  return mainWindow;
};

// Track initialization errors
let initializationError = null;

// Keep a reference to the main window
let mainWindow = null;

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
    mainWindow = createWindow();
    
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
      registerExpenseHandlers();
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