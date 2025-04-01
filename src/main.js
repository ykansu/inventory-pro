const dbManager = require('./database/dbManager');
const config = require('./database/config');
const fs = require('fs');

// Add config file watching for environment changes
function watchConfigFile() {
  const envPath = config.envPath;
  
  if (fs.existsSync(envPath)) {
    fs.watch(envPath, async (eventType) => {
      if (eventType === 'change') {
        console.log('Configuration file changed, reloading...');
        
        // Reload configuration
        await dbManager.reloadConfiguration();
        
        // Optionally notify the renderer process 
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('config-changed');
        }
      }
    });
    console.log(`Watching configuration file at: ${envPath}`);
  }
}

// ... existing code ...

// In your app.on('ready', async () => {}) handler
// Add after database initialization:
await dbManager.initDatabase();
watchConfigFile();

// ... existing code ... 