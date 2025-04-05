const { ipcMain } = require('electron');
const { Setting } = require('../models'); // Assuming Setting model handles language

// Dynamically load modules with error handling
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    return null;
  }
}

function registerLanguageHandlers() {
  ipcMain.handle('language:get', async () => {
    try {
      // If Setting class handles this directly
      if (Setting && Setting.getLanguage) {
         return await Setting.getLanguage();
      }
      // Fallback/alternative if Setting module is loaded differently
      const SettingModule = safeRequire('../models/Setting');
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
       // If Setting class handles this directly
       if (Setting && Setting.setLanguage) {
         return await Setting.setLanguage(language);
      }
      // Fallback/alternative
      const SettingModule = safeRequire('../models/Setting');
      if (!SettingModule) {
        throw new Error('Failed to load Setting module');
      }
      return await SettingModule.setLanguage(language);
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  });
}

module.exports = { registerLanguageHandlers }; 