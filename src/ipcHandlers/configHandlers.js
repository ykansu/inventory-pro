const { ipcMain } = require('electron');

// Note: Assumes config and dbManager are loaded in index.js 
// and passed via dependencies object or available in scope.
function registerConfigHandlers(dependencies) {
  const { config, dbManager } = dependencies;

  ipcMain.handle('config:getPath', () => {
    try {
      if (!config) {
        throw new Error('Configuration module not loaded');
      }
      return config.envPath;
    } catch (error) {
      console.error('Error getting config path:', error);
      throw error;
    }
  });

  ipcMain.handle('config:reload', async () => {
    try {
      if (!dbManager) {
        throw new Error('Database manager module not loaded');
      }
      // Reload config within dbManager (which also handles connection reset)
      return await dbManager.reloadConfiguration(); 
    } catch (error) {
      console.error('Error reloading configuration:', error);
      throw error;
    }
  });

  // Handlers for specific backup settings moved to databaseHandlers.js
  // Remove any remaining specific setting handlers from here if they exist.
}

module.exports = { registerConfigHandlers }; 