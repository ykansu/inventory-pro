/**
 * Script to copy the .env file to the distribution directory
 * This script is run after electron-builder packages the app
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootDir = path.resolve(__dirname, '..');
const envSource = path.join(rootDir, '.env');
const distDir = path.join(rootDir, 'dist');

// Create a default .env file if it doesn't exist
function createDefaultEnvFile() {
  const defaultConfig = `# Inventory Pro Configuration
# This file can be manually edited to change application settings

# Database Configuration
DB_PATH=C:/inventoryPro/inventory-pro.db

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_FREQUENCY=daily
BACKUP_TIME=23:00
MAX_BACKUPS=7
BACKUP_PATH=C:/inventoryPro/backups

# JSON Export Configuration
JSON_BACKUP_ENABLED=false
JSON_BACKUP_FREQUENCY=daily
JSON_BACKUP_TIME=23:00
MAX_JSON_BACKUPS=5
JSON_BACKUP_PATH=${path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop')}
`;

  fs.writeFileSync(envSource, defaultConfig, 'utf8');
  console.log(`Created default configuration file at: ${envSource}`);
}

// Main function
async function copyEnvToDist() {
  console.log('Running post-package script to copy .env file to distribution...');

  try {
    // Check if .env exists, create if not
    if (!fs.existsSync(envSource)) {
      console.log('No .env file found, creating default configuration...');
      createDefaultEnvFile();
    }

    // Wait for the dist directory to be fully created
    let retries = 5;
    while (!fs.existsSync(distDir) && retries > 0) {
      console.log(`Waiting for dist directory to be created... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }

    if (!fs.existsSync(distDir)) {
      throw new Error('Distribution directory does not exist. Build may have failed.');
    }

    // Find the unpacked directory in dist (could vary based on electron-builder config)
    const winUnpacked = path.join(distDir, 'win-unpacked');
    const winInstaller = fs.readdirSync(distDir)
      .find(file => file.endsWith('.exe') && !file.includes('Setup'));

    // Copy to unpacked directory if it exists
    if (fs.existsSync(winUnpacked)) {
      fs.copyFileSync(envSource, path.join(winUnpacked, '.env'));
      console.log(`Copied .env to ${winUnpacked}`);
    }

    // Copy alongside installer if it exists
    if (winInstaller) {
      const installerDir = path.join(distDir, path.dirname(winInstaller));
      fs.copyFileSync(envSource, path.join(installerDir, '.env'));
      console.log(`Copied .env alongside installer at ${installerDir}`);
    }

    console.log('Successfully copied .env file to distribution directories');
  } catch (error) {
    console.error('Error copying .env file:', error);
    process.exit(1);
  }
}

// Run the copy function
copyEnvToDist(); 