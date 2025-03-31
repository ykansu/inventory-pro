const path = require('path');
const fs = require('fs');
const os = require('os');
const Store = require('electron-store');

// Store configuration settings
const store = new Store({
  name: 'database-config',
});

// Fixed database path as requested
const DB_PATH = path.join('D:', 'repos', 'inventory-pro', 'src', 'database', 'inventory-pro.db');
const BACKUP_PATH = path.join('D:', 'repos', 'inventory-pro', 'src', 'database', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

// Get desktop path for default JSON exports
const desktopPath = path.join(os.homedir(), 'Desktop');

// Database configuration
const config = {
  // Database file path (fixed)
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