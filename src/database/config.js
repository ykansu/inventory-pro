const path = require('path');
const fs = require('fs');
let app;

// Try to require electron, but handle the case when running from CLI
try {
  const electron = require('electron');
  app = electron.app || (electron.remote && electron.remote.app);
} catch (error) {
  console.log('Running outside of Electron context');
  app = null;
}

const Store = require('electron-store');

// Store configuration settings
const store = new Store({
  name: 'database-config',
});

// Get user data path (platform-specific)
let userDataPath;
if (app && app.getPath) {
  userDataPath = app.getPath('userData');
} else {
  // When running outside of Electron (e.g., migrations from CLI)
  userDataPath = path.join(__dirname, '..', '..', 'data');
  
  // Ensure the data directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
}

// Database configuration
const config = {
  // Database file path
  dbPath: store.get('dbPath', path.join(userDataPath, 'inventory-pro.db')),
  
  // Set custom database path
  setDbPath(newPath) {
    store.set('dbPath', newPath);
    this.dbPath = newPath;
  },
  
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
    path: store.get('backup.path', path.join(userDataPath, 'backups')),
  },
  
  // Update backup settings
  setBackupSettings(settings) {
    store.set('backup', { ...this.backup, ...settings });
    this.backup = { ...this.backup, ...settings };
  },
};

module.exports = config;