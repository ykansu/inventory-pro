const path = require('path');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');

// Load environment variables
function loadEnvConfig() {
  // Look for .env file in the app root directory
  let envPath = path.resolve(process.cwd(), '.env');
  
  // In production, check for env file in the app directory
  if (process.env.NODE_ENV === 'production') {
    const appPath = path.dirname(process.execPath);
    const prodEnvPath = path.join(appPath, '.env');
    
    if (fs.existsSync(prodEnvPath)) {
      envPath = prodEnvPath;
    }
  }
  
  // If env file exists, load it
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    // Create default env file if it doesn't exist
    createDefaultEnvFile(envPath);
    dotenv.config({ path: envPath });
  }
  
  return envPath;
}

// Create default .env file with sensible defaults
function createDefaultEnvFile(envPath) {
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

  try {
    // Ensure directory exists
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(envPath, defaultConfig, 'utf8');
    console.log(`Created default configuration file at: ${envPath}`);
  } catch (error) {
    console.error('Failed to create default configuration file:', error);
  }
}

// Load environment configuration
const envPath = loadEnvConfig();

// Helper to get boolean from env string
const getBooleanEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Helper to get number from env string
const getNumberEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

// Database configuration
const config = {
  // Environment file path (for reference)
  envPath,
  
  // Database file path
  dbPath: process.env.DB_PATH || 'C:/inventoryPro/inventory-pro.db',
  
  // Get current database path
  getDbPath() {
    return this.dbPath;
  },
  
  // Backup settings
  backup: {
    enabled: getBooleanEnv('BACKUP_ENABLED', true),
    frequency: process.env.BACKUP_FREQUENCY || 'daily', // daily, weekly, monthly
    time: process.env.BACKUP_TIME || '23:00', // Time for scheduled backups
    maxBackups: getNumberEnv('MAX_BACKUPS', 7), // Number of backups to keep
    path: process.env.BACKUP_PATH || 'C:/inventoryPro/backups',
    jsonPath: process.env.JSON_BACKUP_PATH || path.join(os.homedir(), 'Desktop'), // Default to desktop for JSON exports
    
    // JSON backup schedule settings
    jsonBackupEnabled: getBooleanEnv('JSON_BACKUP_ENABLED', false),
    jsonBackupFrequency: process.env.JSON_BACKUP_FREQUENCY || 'daily', // daily, weekly, monthly
    jsonBackupTime: process.env.JSON_BACKUP_TIME || '23:00', // Time for scheduled JSON backups
    maxJsonBackups: getNumberEnv('MAX_JSON_BACKUPS', 5), // Number of JSON backups to keep
    
    // Excel backup schedule settings
    excelPath: process.env.EXCEL_BACKUP_PATH || path.join(os.homedir(), 'Desktop'), // Default to desktop for Excel exports
    excelBackupEnabled: getBooleanEnv('EXCEL_BACKUP_ENABLED', false),
    excelBackupFrequency: process.env.EXCEL_BACKUP_FREQUENCY || 'daily', // daily, weekly, monthly
    excelBackupTime: process.env.EXCEL_BACKUP_TIME || '23:00', // Time for scheduled Excel backups
    maxExcelBackups: getNumberEnv('MAX_EXCEL_BACKUPS', 5), // Number of Excel backups to keep
  },
  
  // Update configuration in the .env file
  updateConfig(updatedConfig) {
    try {
      let envContent = fs.readFileSync(this.envPath, 'utf8');
      
      // Update each configuration value in the env file
      Object.entries(updatedConfig).forEach(([key, value]) => {
        // Convert key to ENV_VAR format
        const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        
        // Check if the key exists in the file
        const regex = new RegExp(`^${envKey}=.*$`, 'm');
        
        if (regex.test(envContent)) {
          // Update existing key
          envContent = envContent.replace(regex, `${envKey}=${value}`);
        } else {
          // Add new key
          envContent += `\n${envKey}=${value}`;
        }
        
        // Also update in memory
        process.env[envKey] = String(value);
        
        // Update backup settings in memory if they match
        if (key.startsWith('backup')) {
          const backupKey = key.replace('backup.', '');
          if (this.backup[backupKey] !== undefined) {
            this.backup[backupKey] = value;
          }
        }
      });
      
      // Write the updated content back to file
      fs.writeFileSync(this.envPath, envContent, 'utf8');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update configuration:', error);
      return { success: false, error };
    }
  },
  
  // Reload configuration from .env file
  reloadConfig() {
    dotenv.config({ path: this.envPath, override: true });
    
    // Update in-memory configuration
    this.dbPath = process.env.DB_PATH || 'C:/inventoryPro/inventory-pro.db';
    
    this.backup = {
      enabled: getBooleanEnv('BACKUP_ENABLED', true),
      frequency: process.env.BACKUP_FREQUENCY || 'daily',
      time: process.env.BACKUP_TIME || '23:00',
      maxBackups: getNumberEnv('MAX_BACKUPS', 7),
      path: process.env.BACKUP_PATH || 'C:/inventoryPro/backups',
      jsonPath: process.env.JSON_BACKUP_PATH || path.join(os.homedir(), 'Desktop'),
      jsonBackupEnabled: getBooleanEnv('JSON_BACKUP_ENABLED', false),
      jsonBackupFrequency: process.env.JSON_BACKUP_FREQUENCY || 'daily',
      jsonBackupTime: process.env.JSON_BACKUP_TIME || '23:00',
      maxJsonBackups: getNumberEnv('MAX_JSON_BACKUPS', 5),
      excelPath: process.env.EXCEL_BACKUP_PATH || path.join(os.homedir(), 'Desktop'),
      excelBackupEnabled: getBooleanEnv('EXCEL_BACKUP_ENABLED', false),
      excelBackupFrequency: process.env.EXCEL_BACKUP_FREQUENCY || 'daily',
      excelBackupTime: process.env.EXCEL_BACKUP_TIME || '23:00',
      maxExcelBackups: getNumberEnv('MAX_EXCEL_BACKUPS', 5),
    };
    
    return this;
  }
};

// Ensure directories exist
[
  path.dirname(config.dbPath),
  config.backup.path,
  config.backup.jsonPath,
  config.backup.excelPath
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
});

module.exports = config;