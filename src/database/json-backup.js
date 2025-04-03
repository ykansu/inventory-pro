const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const config = require('./config');
const dbConnection = require('./connection');

// Format date for backup filename
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

// Get all data tables
async function getAllTables() {
  const db = await dbConnection.getConnection();
  return [
    { name: 'categories', data: await db('categories').select('*') },
    { name: 'suppliers', data: await db('suppliers').select('*') },
    { name: 'products', data: await db('products').select('*') },
    { name: 'product_price_history', data: await db('product_price_history').select('*') },
    { name: 'sales', data: await db('sales').select('*') },
    { name: 'sale_items', data: await db('sale_items').select('*') },
    { name: 'stock_adjustments', data: await db('stock_adjustments').select('*') },
    { name: 'settings', data: await db('settings').select('*') }
  ];
}

// Export database to JSON file
async function exportToJson(customPath = null) {
  try {
    // Get directory path where to save the file
    const exportDir = customPath || config.backup.jsonPath;
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Get all data
    const tables = await getAllTables();
    
    const timestamp = formatDate(new Date());
    const exportFile = path.join(exportDir, `inventory_export_${timestamp}.json`);
    
    // Format data for export
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        appVersion: process.env.npm_package_version || 'unknown',
        tables: tables.map(t => t.name)
      },
      data: {}
    };
    
    // Add each table's data
    tables.forEach(table => {
      exportData.data[table.name] = table.data;
    });
    
    // Write to file
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log(`Data exported successfully to: ${exportFile}`);
    return exportFile;
  } catch (error) {
    console.error('Data export failed:', error);
    throw error;
  }
}

// Import data from JSON file
async function importFromJson(jsonFile) {
  try {
    // Read JSON file
    const fileContent = fs.readFileSync(jsonFile, 'utf8');
    const importData = JSON.parse(fileContent);
    
    // Validate data format
    if (!importData.data || !importData.metadata) {
      throw new Error('Invalid JSON data format');
    }
    
    console.log('Starting JSON import process');
    
    // Get database connection
    const db = await dbConnection.getConnection();
    
    // Begin transaction
    return await db.transaction(async trx => {
      try {
        // Disable foreign key constraints during import
        await trx.raw('PRAGMA foreign_keys = OFF;');
        console.log('Foreign key constraints disabled');
        
        // Delete existing data in reverse dependency order using truncate
        // Truncate is faster and resets auto-increment counters
        console.log('Clearing existing data...');
        await trx.raw('DELETE FROM sale_items');
        console.log('  - Cleared sale_items table');
        
        await trx.raw('DELETE FROM sales');
        console.log('  - Cleared sales table');
        
        await trx.raw('DELETE FROM stock_adjustments');
        console.log('  - Cleared stock_adjustments table');
        
        await trx.raw('DELETE FROM product_price_history');
        console.log('  - Cleared product_price_history table');
        
        await trx.raw('DELETE FROM products');
        console.log('  - Cleared products table');
        
        await trx.raw('DELETE FROM suppliers');
        console.log('  - Cleared suppliers table');
        
        await trx.raw('DELETE FROM categories');
        console.log('  - Cleared categories table');
        
        console.log('All tables cleared successfully');
        
        // Keep settings to avoid breaking application configuration
        
        // Create mapping for old IDs to new IDs
        const idMappings = {
          categories: {},
          suppliers: {},
          products: {},
          sales: {}
        };
        
        // Reset SQLite sequence counters to ensure proper ID assignment
        await trx.raw("DELETE FROM sqlite_sequence WHERE name IN ('categories', 'suppliers', 'products', 'sales', 'sale_items', 'stock_adjustments', 'product_price_history')");
        console.log('Sequence counters reset');
        
        // Insert data in dependency order
        console.log('Importing data...');
        if (importData.data.categories && importData.data.categories.length) {
          console.log(`Importing ${importData.data.categories.length} categories`);
          for (const item of importData.data.categories) {
            const oldId = item.id;
            // Remove id to let the database assign new IDs
            const { id, ...data } = item;
            
            // Insert and get the new ID
            const [newId] = await trx('categories').insert(data);
            idMappings.categories[oldId] = newId;
          }
        }
        
        if (importData.data.suppliers && importData.data.suppliers.length) {
          console.log(`Importing ${importData.data.suppliers.length} suppliers`);
          for (const item of importData.data.suppliers) {
            const oldId = item.id;
            const { id, ...data } = item;
            
            const [newId] = await trx('suppliers').insert(data);
            idMappings.suppliers[oldId] = newId;
          }
        }
        
        if (importData.data.products && importData.data.products.length) {
          console.log(`Importing ${importData.data.products.length} products`);
          for (const item of importData.data.products) {
            const oldId = item.id;
            const { id, ...data } = item;
            
            // Update foreign key references
            if (data.category_id && idMappings.categories[data.category_id]) {
              data.category_id = idMappings.categories[data.category_id];
            } else if (data.category_id) {
              // If category doesn't exist in the mapping, set to null
              data.category_id = null;
            }
            
            if (data.supplier_id && idMappings.suppliers[data.supplier_id]) {
              data.supplier_id = idMappings.suppliers[data.supplier_id];
            } else if (data.supplier_id) {
              // If supplier doesn't exist in the mapping, set to null
              data.supplier_id = null;
            }
            
            // Handle empty barcode
            if (data.barcode === '' || data.barcode === null || data.barcode === undefined) {
              data.barcode = null;
            }
            
            const [newId] = await trx('products').insert(data);
            idMappings.products[oldId] = newId;
          }
        }
        
        if (importData.data.sales && importData.data.sales.length) {
          console.log(`Importing ${importData.data.sales.length} sales`);
          for (const item of importData.data.sales) {
            const oldId = item.id;
            const { id, ...data } = item;
            
            const [newId] = await trx('sales').insert(data);
            idMappings.sales[oldId] = newId;
          }
        }
        
        if (importData.data.product_price_history && importData.data.product_price_history.length) {
          console.log(`Importing ${importData.data.product_price_history.length} price history records`);
          for (const item of importData.data.product_price_history) {
            const { id, ...data } = item;
            
            // Update the product_id foreign key reference
            if (data.product_id && idMappings.products[data.product_id]) {
              data.product_id = idMappings.products[data.product_id];
            } else if (data.product_id) {
              // If product doesn't exist in the mapping, skip this record
              console.log(`Skipping price history record - product ID ${data.product_id} not found`);
              continue;
            }
            
            await trx('product_price_history').insert(data);
          }
        }
        
        if (importData.data.sale_items && importData.data.sale_items.length) {
          console.log(`Importing ${importData.data.sale_items.length} sale items`);
          for (const item of importData.data.sale_items) {
            const { id, ...data } = item;
            
            // Update foreign key references
            if (data.sale_id && idMappings.sales[data.sale_id]) {
              data.sale_id = idMappings.sales[data.sale_id];
            } else if (data.sale_id) {
              // Skip this sale item if the referenced sale doesn't exist
              console.log(`Skipping sale item: missing sale reference for ${data.sale_id}`);
              continue;
            }
            
            if (data.product_id && idMappings.products[data.product_id]) {
              data.product_id = idMappings.products[data.product_id];
            } else if (data.product_id) {
              // Skip this sale item if the referenced product doesn't exist
              console.log(`Skipping sale item: missing product reference for ${data.product_id}`);
              continue;
            }
            
            await trx('sale_items').insert(data);
          }
        }
        
        if (importData.data.stock_adjustments && importData.data.stock_adjustments.length) {
          console.log(`Importing ${importData.data.stock_adjustments.length} stock adjustments`);
          for (const item of importData.data.stock_adjustments) {
            const { id, ...data } = item;
            
            // Update foreign key references
            if (data.product_id && idMappings.products[data.product_id]) {
              data.product_id = idMappings.products[data.product_id];
            } else if (data.product_id) {
              // Skip this adjustment if the referenced product doesn't exist
              console.log(`Skipping stock adjustment: missing product reference for ${data.product_id}`);
              continue;
            }
            
            await trx('stock_adjustments').insert(data);
          }
        }
        
        // Do not import settings to avoid overwriting critical app configuration
        // unless specifically requested
        
        // Re-enable foreign key constraints
        await trx.raw('PRAGMA foreign_keys = ON;');
        console.log('Foreign key constraints re-enabled');
        
        console.log('Data import completed successfully');
        return { success: true, message: 'Import completed successfully' };
      } catch (error) {
        console.error('Error during import transaction:', error);
        throw error;
      }
    });
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// Create a backup before importing
async function createPreImportBackup() {
  try {
    // Create a backup directory for pre-import backups
    const backupDir = path.join(config.backup.path, 'pre_import');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = formatDate(new Date());
    const backupFile = path.join(backupDir, `backup_${timestamp}.db`);
    
    // Create a database backup
    fs.copyFileSync(config.dbPath, backupFile);
    console.log(`Pre-import backup created at: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Pre-import backup failed:', error);
    throw error;
  }
}

// Schedule automatic JSON backups
async function scheduleJsonBackups() {
  try {
    // Check if automatic JSON backups are enabled
    if (!config.backup.jsonBackupEnabled) {
      console.log('Automatic JSON backups are disabled');
      return;
    }
    
    // Validate backup time format
    if (!config.backup.jsonBackupTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.backup.jsonBackupTime)) {
      console.log('Invalid backup time format. Using default 23:00');
      config.updateConfig({ 'backup.jsonBackupTime': '23:00' });
    }
    
    console.log('Setting up scheduled JSON backups');
    
    // Parse backup time
    const [hours, minutes] = config.backup.jsonBackupTime.split(':').map(Number);
    
    // Calculate when to run the next backup
    const now = new Date();
    const backupTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
    
    // Adjust date based on frequency
    let nextBackupDate = new Date(backupTime);
    
    // If the backup time has already passed today
    if (now > backupTime) {
      switch (config.backup.jsonBackupFrequency) {
        case 'daily':
          nextBackupDate.setDate(nextBackupDate.getDate() + 1);
          break;
        case 'weekly':
          nextBackupDate.setDate(nextBackupDate.getDate() + (7 - now.getDay() + backupTime.getDay()) % 7 || 7);
          break;
        case 'monthly':
          nextBackupDate.setMonth(nextBackupDate.getMonth() + 1);
          nextBackupDate.setDate(1); // First day of next month
          break;
        default:
          nextBackupDate.setDate(nextBackupDate.getDate() + 1); // Default to daily
      }
    }
    
    // Calculate delay until next backup
    const delay = nextBackupDate.getTime() - now.getTime();
    
    console.log(`Next JSON backup scheduled for: ${nextBackupDate.toLocaleString()}`);
    
    // Schedule the backup
    setTimeout(async () => {
      console.log('Running scheduled JSON backup...');
      try {
        // Only run if still enabled (setting might have changed)
        if (config.backup.jsonBackupEnabled) {
          const backupFile = await exportToJson();
          console.log(`Scheduled JSON backup created successfully: ${backupFile}`);
          
          // Clean up old JSON backups if we exceed the maximum
          cleanupOldJsonBackups();
        } else {
          console.log('Scheduled JSON backup skipped - feature disabled');
        }
        
        // Schedule the next backup based on frequency
        setTimeout(() => {
          scheduleJsonBackups();
        }, 1000); // Small delay before rescheduling
      } catch (error) {
        console.error('Scheduled JSON backup failed:', error);
        // Try again in an hour
        setTimeout(() => {
          scheduleJsonBackups();
        }, 60 * 60 * 1000);
      }
    }, delay);
  } catch (error) {
    console.error('Error setting up JSON backup schedule:', error);
    // Try again in an hour
    setTimeout(() => {
      scheduleJsonBackups();
    }, 60 * 60 * 1000);
  }
}

// Clean up old JSON backups
function cleanupOldJsonBackups() {
  try {
    const exportDir = config.backup.jsonPath;
    const maxBackups = config.backup.maxJsonBackups || 5;
    
    // Get all JSON backup files
    const files = fs.readdirSync(exportDir)
      .filter(file => file.startsWith('inventory_export_') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(exportDir, file),
        time: fs.statSync(path.join(exportDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    // Remove excess backups
    if (files.length > maxBackups) {
      const filesToRemove = files.slice(maxBackups);
      filesToRemove.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Removed old JSON backup: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('Error cleaning up old JSON backups:', error);
  }
}

module.exports = {
  exportToJson,
  importFromJson,
  createPreImportBackup,
  scheduleJsonBackups
}; 