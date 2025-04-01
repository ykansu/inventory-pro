/**
 * Script to set up the .env file before packaging
 * This script is run before electron-builder packages the app
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const rootDir = path.resolve(__dirname, '..');
const envTarget = path.join(rootDir, '.env');
const envExample = path.join(rootDir, '.env.example');

// Create a default .env.example file if it doesn't exist
function createExampleEnvFile() {
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
JSON_BACKUP_PATH=${path.join(os.homedir(), 'Desktop')}
`;

  fs.writeFileSync(envExample, defaultConfig, 'utf8');
  console.log(`Created .env.example file at: ${envExample}`);
}

// Main function
function setupEnv() {
  console.log('Setting up environment configuration file...');

  try {
    // Create example env file if it doesn't exist
    if (!fs.existsSync(envExample)) {
      createExampleEnvFile();
    }

    // If .env doesn't exist, copy from example
    if (!fs.existsSync(envTarget)) {
      fs.copyFileSync(envExample, envTarget);
      console.log('Created .env file from .env.example');
    } else {
      console.log('.env file already exists, no changes made');
    }
  } catch (error) {
    console.error('Error setting up environment file:', error);
    process.exit(1);
  }
}

// Run the setup
setupEnv(); 