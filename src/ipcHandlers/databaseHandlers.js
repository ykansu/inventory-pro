const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Dynamically load modules needed by these handlers
function safeRequire(modulePath) {
  try {
    // Use path.resolve to ensure the path is correct relative to this file
    return require(path.resolve(__dirname, '..', modulePath));
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    return null;
  }
}

// Note: Some dependencies like config, dbManager, models are loaded in index.js
// and assumed to be available in the scope where registerDatabaseHandlers is called.
// A more robust solution might pass them as arguments.
function registerDatabaseHandlers(dependencies) {
  const { 
    config,
    dbManager,
    createBackup,
    restoreFromBackup,
    exportToJson,
    importFromJson,
    exportToExcel,
    importFromExcel,
    Setting // Assuming Setting model is passed if needed directly
  } = dependencies;

  // JSON Import/Export handlers
  ipcMain.handle('database:exportToJson', async (_, customPath = null) => {
    try {
      if (!exportToJson) throw new Error('JSON export function not loaded');
      return await exportToJson(customPath);
    } catch (error) {
      console.error('Error exporting data to JSON:', error);
      throw error;
    }
  });

  ipcMain.handle('database:importFromJson', async (_, jsonFilePath) => {
    try {
      console.log('Starting JSON import from:', jsonFilePath);
      if (!importFromJson) {
        throw new Error('Import module could not be loaded');
      }
      
      const result = await importFromJson(jsonFilePath);
      console.log('JSON import completed with result:', result);
      
      // Reload connection might be needed depending on import implementation
      await dbManager.reinitializeConnection(); 
      
      return result;
    } catch (error) {
      console.error('Error importing data from JSON:', error);
      throw error;
    }
  });

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

  ipcMain.handle('database:updateJsonExportDir', async (_, dirPath) => {
    try {
      if (!config) throw new Error('Configuration module not loaded');
      config.updateConfig({ 'backup.jsonPath': dirPath });
      return dirPath;
    } catch (error) {
      console.error('Error updating JSON export directory:', error);
      throw error;
    }
  });

  ipcMain.handle('database:getJsonExportDir', async () => {
    try {
      if (!config) throw new Error('Configuration module not loaded');
      return config.backup.jsonPath;
    } catch (error) {
      console.error('Error getting JSON export directory:', error);
      throw error;
    }
  });

  ipcMain.handle('database:getJsonBackupSettings', () => {
    try {
      if (!config) throw new Error('Configuration module not loaded');
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

  ipcMain.handle('database:updateJsonBackupSettings', async (_, settings) => {
    try {
      if (!config) throw new Error('Configuration module not loaded');
      
      const configUpdates = {};
      if (settings.enabled !== undefined) configUpdates['backup.jsonBackupEnabled'] = settings.enabled;
      if (settings.frequency) configUpdates['backup.jsonBackupFrequency'] = settings.frequency;
      if (settings.time) configUpdates['backup.jsonBackupTime'] = settings.time;
      if (settings.maxBackups) configUpdates['backup.maxJsonBackups'] = settings.maxBackups;
      if (settings.path) configUpdates['backup.jsonPath'] = settings.path;
      
      config.updateConfig(configUpdates);
      
      // Restart JSON backup scheduling (need scheduleJsonBackups function)
      const jsonBackupModule = safeRequire('database/json-backup');
      if (jsonBackupModule && jsonBackupModule.scheduleJsonBackups) {
        jsonBackupModule.scheduleJsonBackups(); 
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating JSON backup settings:', error);
      throw error;
    }
  });

  // Excel Import/Export handlers
  ipcMain.handle('database:exportToExcel', async (_, customPath) => {
    try {
      if (!exportToExcel) throw new Error('Excel export function not loaded');
      return await exportToExcel(customPath);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  });

  ipcMain.handle('database:importFromExcel', async (_, excelFilePath) => {
    try {
      if (!importFromExcel) throw new Error('Excel import function not loaded');
      const result = await importFromExcel(excelFilePath);

      // Reload connection might be needed
      await dbManager.closeConnection(); // Close the old connection
      console.log('Database connection closed after Excel import. It will be re-established on next use.');

      return result;
    } catch (error) {
      console.error('Error importing from Excel:', error);
      throw error;
    }
  });

  ipcMain.handle('database:selectExcelFile', async () => {
    try {
      const excelBackupModule = safeRequire('database/excel-backup');
      if (!excelBackupModule) throw new Error('Excel backup module not loaded');
      return await excelBackupModule.selectExcelFile();
    } catch (error) {
      console.error('Error selecting Excel file:', error);
      throw error;
    }
  });

  ipcMain.handle('database:selectExcelExportDir', async () => {
    try {
      const excelBackupModule = safeRequire('database/excel-backup');
      if (!excelBackupModule) throw new Error('Excel backup module not loaded');
      return await excelBackupModule.selectExcelExportDir();
    } catch (error) {
      console.error('Error selecting Excel export directory:', error);
      throw error;
    }
  });

  ipcMain.handle('database:updateExcelExportDir', async (_, dirPath) => {
    try {
      const excelBackupModule = safeRequire('database/excel-backup');
      if (!excelBackupModule) throw new Error('Excel backup module not loaded');
      return await excelBackupModule.updateExcelExportDir(dirPath);
    } catch (error) {
      console.error('Error updating Excel export directory:', error);
      throw error;
    }
  });

  ipcMain.handle('database:getExcelExportDir', async () => {
    try {
      if (!config) throw new Error('Configuration module not loaded');
      return config.backup.excelPath;
    } catch (error) {
      console.error('Error getting Excel export directory:', error);
      return path.join(os.homedir(), 'Desktop');
    }
  });

  ipcMain.handle('database:getExcelBackupSettings', () => {
    try {
      const excelBackupModule = safeRequire('database/excel-backup');
      if (!excelBackupModule) throw new Error('Excel backup module not loaded');
      return excelBackupModule.getExcelBackupSettings();
    } catch (error) {
      console.error('Error getting Excel backup settings:', error);
      // Provide defaults if config or module fails
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
      const excelBackupModule = safeRequire('database/excel-backup');
      if (!excelBackupModule) throw new Error('Excel backup module not loaded');
      const result = await excelBackupModule.updateExcelBackupSettings(settings);
      
      // Restart Excel backup scheduling
      const excelBackupScheduler = safeRequire('database/excel-backup-scheduler');
      if (excelBackupScheduler && excelBackupScheduler.scheduleExcelBackups) {
         excelBackupScheduler.scheduleExcelBackups();
      }
      
      return result;
    } catch (error) {
      console.error('Error updating Excel backup settings:', error);
      throw error;
    }
  });

  // Database reset handler
  ipcMain.handle('database:resetDatabase', async () => {
    try {
      console.log('Starting database reset process...');

      console.log('Getting database connection for reset...');
      const db = await dbManager.getConnection();

      // Rollback all migrations to drop tables
      console.log('Rolling back migrations...');
      await db.migrate.rollback({}, true); // Second arg `all: true` rolls back everything
      console.log('Migrations rolled back successfully.');

      // Apply latest migrations to recreate schema
      console.log('Applying latest migrations...');
      await db.migrate.latest();
      console.log('Latest migrations applied successfully.');

      // Reinitialize connection to ensure clean state (optional but good practice)
      await dbManager.closeConnection(); // Close the old connection
      console.log('Database connection closed. It will be re-established on next use.');

      return {
        success: true,
        message: 'Database reset successfully.'
      };
    } catch (error) {
      console.error('Error resetting database:', error);
      // Since pre-reset backup is removed, just report the failure
      return {
        success: false,
        message: 'Database reset failed.'
      };
    }
  });
}

module.exports = { registerDatabaseHandlers };