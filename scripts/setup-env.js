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

# Excel Export Configuration
EXCEL_BACKUP_ENABLED=false
EXCEL_BACKUP_FREQUENCY=daily
EXCEL_BACKUP_TIME=23:00
MAX_EXCEL_BACKUPS=5
EXCEL_BACKUP_PATH=${path.join(os.homedir(), 'Desktop')}
`;

  fs.writeFileSync(envExample, defaultConfig, 'utf8');
  console.log(`Created .env.example file at: ${envExample}`);
}

// Create a default .env file if it doesn't exist
function createEnvFile() {
  if (fs.existsSync(envExample)) {
    // Copy from example file if it exists
    fs.copyFileSync(envExample, envTarget);
    console.log(`Created .env file from example: ${envTarget}`);
  } else {
    // Create new example file
    createExampleEnvFile();
    // Use it to create .env file
    fs.copyFileSync(envExample, envTarget);
    console.log(`Created .env file: ${envTarget}`);
  }
}

// Main function
async function main() {
  console.log('Setting up environment configuration...');
  
  // Create .env.example if it doesn't exist
  if (!fs.existsSync(envExample)) {
    createExampleEnvFile();
  }
  
  // Create .env if it doesn't exist
  if (!fs.existsSync(envTarget)) {
    createEnvFile();
  }
  
  console.log('Environment configuration setup complete.');
}

// Run the main function
main().catch(err => {
  console.error('Failed to set up environment configuration:', err);
  process.exit(1);
}); 