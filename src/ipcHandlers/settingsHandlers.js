const { ipcMain } = require('electron');
const { Setting } = require('../models');

function registerSettingsHandlers() {
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

  ipcMain.handle('settings:create', async (_, key, value, type = 'string', description = '') => {
    try {
      return await Setting.saveSettingSafely(key, value, type, description);
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
}

module.exports = { registerSettingsHandlers }; 