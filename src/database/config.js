const path = require('path');
const fs = require('fs');
const os = require('os');
const Store = require('electron-store');

// Make sure we can get the app whether we're in the main process or renderer
let app;
try {
  // Try to import from electron directly - this works in the main process
  const electron = require('electron');
  app = electron.app;
} catch (error) {
  // If that fails, either we're in a renderer process or electron isn't available
  try {
    const remote = require('@electron/remote');
    app = remote.app;
  } catch (remoteError) {
    // Neither method worked, we'll use fallbacks
    app = null;
    console.warn('Unable to get electron app instance, using fallback paths');
  }
}

// Store configuration settings
const store = new Store({
  name: 'database-config',
});

// Define data paths that work in both dev and production
const getAppDataPath = () => {
  // In development, use the local database
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname);
  }
  
  // In production, use user data folder
  if (app) {
    try {
      return app.getPath('userData');
    } catch (e) {
      console.warn('Failed to get userData path:', e);
    }
  }
  
  // Fallback to home directory
  return path.join(os.homedir(), '.inventory-pro');
};

// Ensure app data directory exists
const APP_DATA_PATH = getAppDataPath();
if (!fs.existsSync(APP_DATA_PATH)) {
  fs.mkdirSync(APP_DATA_PATH, { recursive: true });
}

// Set up database and backup paths
const DB_PATH = path.join(APP_DATA_PATH, 'inventory-pro.db');
const BACKUP_PATH = path.join(APP_DATA_PATH, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

// Get desktop path for default JSON exports
const desktopPath = path.join(os.homedir(), 'Desktop');

// Database configuration
const config = {
  // Database file path
  dbPath: DB_PATH,
  
  // Get current database path
  getDbPath() {
    return this.dbPath;
  },
  
  // Backup settings
  backup: {
    enabled: store.get('backup.enabled', true),
    frequency: store.get('backup.frequency', 'daily'), // daily, weekly, monthly
    time: store.get('backup.time', '23:00'), // Time for scheduled backups
    maxBackups: store.get('backup.maxBackups', 7), // Number of backups to keep
    path: BACKUP_PATH,
    jsonPath: store.get('backup.jsonPath', desktopPath), // Default to desktop for JSON exports
    
    // JSON backup schedule settings
    jsonBackupEnabled: store.get('backup.jsonBackupEnabled', false),
    jsonBackupFrequency: store.get('backup.jsonBackupFrequency', 'daily'), // daily, weekly, monthly
    jsonBackupTime: store.get('backup.jsonBackupTime', '23:00'), // Time for scheduled JSON backups
    maxJsonBackups: store.get('backup.maxJsonBackups', 5), // Number of JSON backups to keep
  },
  
  // Update backup settings
  setBackupSettings(settings) {
    store.set('backup', { ...this.backup, ...settings });
    this.backup = { ...this.backup, ...settings };
  },
};

module.exports = config;