const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const Excel = require('exceljs');
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

// Clean up old Excel backups if exceeding the maximum
async function cleanupOldExcelBackups() {
  try {
    const backupDir = config.backup.excelPath;
    const maxBackups = config.backup.maxExcelBackups;
    
    if (!fs.existsSync(backupDir)) {
      return;
    }
    
    // Get all Excel backup files
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('inventory_export_') && file.endsWith('.xlsx'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by time, newest first
    
    // Delete older backups if exceeding the maximum
    if (files.length > maxBackups) {
      for (let i = maxBackups; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
        console.log(`Deleted old Excel backup: ${files[i].path}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old Excel backups:', error);
  }
}

// Export database to Excel file
async function exportToExcel(customPath = null) {
  try {
    // Get directory path where to save the file
    const exportDir = customPath || config.backup.excelPath;
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Get all data
    const tables = await getAllTables();
    
    const timestamp = formatDate(new Date());
    const exportFile = path.join(exportDir, `inventory_export_${timestamp}.xlsx`);
    
    // Create a new Excel workbook
    const workbook = new Excel.Workbook();
    
    // Add metadata worksheet
    const metadataSheet = workbook.addWorksheet('Metadata');
    metadataSheet.columns = [
      { header: 'Property', key: 'property', width: 30 },
      { header: 'Value', key: 'value', width: 50 }
    ];
    
    metadataSheet.addRows([
      { property: 'Export Date', value: new Date().toISOString() },
      { property: 'App Version', value: process.env.npm_package_version || 'unknown' },
      { property: 'Tables', value: tables.map(t => t.name).join(', ') }
    ]);
    
    // Add a worksheet for each table
    tables.forEach(table => {
      if (table.data.length === 0) return; // Skip empty tables
      
      const worksheet = workbook.addWorksheet(table.name);
      
      // Create columns based on the first row's properties
      if (table.data.length > 0) {
        const columns = Object.keys(table.data[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        worksheet.columns = columns;
      }
      
      // Add rows
      worksheet.addRows(table.data);
      
      // Auto filter
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columns.length }
      };
    });
    
    // Write to file
    await workbook.xlsx.writeFile(exportFile);
    
    // Clean up old backups if we exceed the maximum
    await cleanupOldExcelBackups();
    
    console.log(`Data exported successfully to Excel: ${exportFile}`);
    return exportFile;
  } catch (error) {
    console.error('Excel export failed:', error);
    throw error;
  }
}

// Select Excel file for import
async function selectExcelFile() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Excel File to Import',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting Excel file:', error);
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

// Import data from Excel file
async function importFromExcel(excelFile) {
  try {
    // Create a backup before importing
    await createPreImportBackup();
    
    // Load Excel file
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(excelFile);
    
    // Get database connection
    const db = await dbConnection.getConnection();
    
    console.log('Starting Excel import process');
    
    // Begin transaction
    return await db.transaction(async trx => {
      try {
        // Disable foreign key constraints during import
        await trx.raw('PRAGMA foreign_keys = OFF;');
        console.log('Foreign key constraints disabled');
        
        // Delete existing data in reverse dependency order
        console.log('Clearing existing data...');
        await trx.raw('DELETE FROM sale_items');
        console.log('  - Cleared sale_items table');
        
        await trx.raw('DELETE FROM sales');
        console.log('  - Cleared sales table');
        
        await trx.raw('DELETE FROM stock_adjustments');
        console.log('  - Cleared stock_adjustments table');
        
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
        
        // Reset SQLite sequence counters
        await trx.raw("DELETE FROM sqlite_sequence WHERE name IN ('categories', 'suppliers', 'products', 'sales', 'sale_items', 'stock_adjustments')");
        console.log('Sequence counters reset');
        
        // Process each sheet based on table name
        // Import categories
        const categoriesSheet = workbook.getWorksheet('categories');
        if (categoriesSheet) {
          console.log('Importing categories...');
          const rows = [];
          categoriesSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = categoriesSheet.getRow(1).getCell(colNum).value;
                if (header !== 'id') { // Skip the id column
                  rowData[header] = cell.value;
                } else {
                  rowData._oldId = cell.value; // Store old ID for mapping
                }
              });
              rows.push(rowData);
            }
          });
          
          // Insert categories and map IDs
          for (const item of rows) {
            const oldId = item._oldId;
            delete item._oldId;
            
            const [newId] = await trx('categories').insert(item);
            idMappings.categories[oldId] = newId;
          }
          console.log(`Imported ${rows.length} categories`);
        }
        
        // Import suppliers
        const suppliersSheet = workbook.getWorksheet('suppliers');
        if (suppliersSheet) {
          console.log('Importing suppliers...');
          const rows = [];
          suppliersSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = suppliersSheet.getRow(1).getCell(colNum).value;
                if (header !== 'id') {
                  rowData[header] = cell.value;
                } else {
                  rowData._oldId = cell.value;
                }
              });
              rows.push(rowData);
            }
          });
          
          // Insert suppliers and map IDs
          for (const item of rows) {
            const oldId = item._oldId;
            delete item._oldId;
            
            const [newId] = await trx('suppliers').insert(item);
            idMappings.suppliers[oldId] = newId;
          }
          console.log(`Imported ${rows.length} suppliers`);
        }
        
        // Import products
        const productsSheet = workbook.getWorksheet('products');
        if (productsSheet) {
          console.log('Importing products...');
          const rows = [];
          productsSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = productsSheet.getRow(1).getCell(colNum).value;
                if (header !== 'id') {
                  rowData[header] = cell.value;
                } else {
                  rowData._oldId = cell.value;
                }
              });
              rows.push(rowData);
            }
          });
          
          // Insert products and map IDs
          for (const item of rows) {
            const oldId = item._oldId;
            delete item._oldId;
            
            // Update foreign key references
            if (item.category_id && idMappings.categories[item.category_id]) {
              item.category_id = idMappings.categories[item.category_id];
            } else if (item.category_id) {
              item.category_id = null;
            }
            
            if (item.supplier_id && idMappings.suppliers[item.supplier_id]) {
              item.supplier_id = idMappings.suppliers[item.supplier_id];
            } else if (item.supplier_id) {
              item.supplier_id = null;
            }
            
            const [newId] = await trx('products').insert(item);
            idMappings.products[oldId] = newId;
          }
          console.log(`Imported ${rows.length} products`);
        }
        
        // Import sales
        const salesSheet = workbook.getWorksheet('sales');
        if (salesSheet) {
          console.log('Importing sales...');
          const rows = [];
          salesSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = salesSheet.getRow(1).getCell(colNum).value;
                if (header !== 'id') {
                  rowData[header] = cell.value;
                } else {
                  rowData._oldId = cell.value;
                }
              });
              rows.push(rowData);
            }
          });
          
          // Insert sales and map IDs
          for (const item of rows) {
            const oldId = item._oldId;
            delete item._oldId;
            
            const [newId] = await trx('sales').insert(item);
            idMappings.sales[oldId] = newId;
          }
          console.log(`Imported ${rows.length} sales`);
        }
        
        // Import sale items
        const saleItemsSheet = workbook.getWorksheet('sale_items');
        if (saleItemsSheet) {
          console.log('Importing sale items...');
          const rows = [];
          saleItemsSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = saleItemsSheet.getRow(1).getCell(colNum).value;
                rowData[header] = cell.value;
              });
              rows.push(rowData);
            }
          });
          
          // Insert sale items with updated references
          for (const item of rows) {
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
          console.log(`Imported ${rows.length} sale items`);
        }
        
        // Import stock adjustments
        const stockAdjustmentsSheet = workbook.getWorksheet('stock_adjustments');
        if (stockAdjustmentsSheet) {
          console.log('Importing stock adjustments...');
          const rows = [];
          stockAdjustmentsSheet.eachRow((row, rowNum) => {
            if (rowNum > 1) { // Skip header row
              const rowData = {};
              row.eachCell((cell, colNum) => {
                const header = stockAdjustmentsSheet.getRow(1).getCell(colNum).value;
                rowData[header] = cell.value;
              });
              rows.push(rowData);
            }
          });
          
          // Insert stock adjustments with updated references
          for (const item of rows) {
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
          console.log(`Imported ${rows.length} stock adjustments`);
        }
        
        // Re-enable foreign key constraints
        await trx.raw('PRAGMA foreign_keys = ON;');
        console.log('Foreign key constraints re-enabled');
        
        console.log('Excel import completed successfully');
        return { success: true };
      } catch (error) {
        console.error('Error during Excel import:', error);
        throw error;
      }
    });
  } catch (error) {
    console.error('Excel import failed:', error);
    throw error;
  }
}

// Select directory for Excel export
async function selectExcelExportDir() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Directory for Excel Exports',
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Error selecting Excel export directory:', error);
    throw error;
  }
}

// Update Excel export directory in config
async function updateExcelExportDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Update config in memory
    config.backup.excelPath = dirPath;
    
    // Update in .env file
    await config.updateConfig({
      'EXCEL_BACKUP_PATH': dirPath
    });
    
    return dirPath;
  } catch (error) {
    console.error('Error updating Excel export directory:', error);
    throw error;
  }
}

// Scheduled Excel backup job
async function runScheduledExcelBackup() {
  try {
    if (!config.backup.excelBackupEnabled) {
      console.log('Scheduled Excel backup is disabled');
      return;
    }
    
    console.log('Running scheduled Excel backup...');
    const backupFile = await exportToExcel();
    console.log(`Scheduled Excel backup completed: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Scheduled Excel backup failed:', error);
    return null;
  }
}

// Get Excel backup settings
function getExcelBackupSettings() {
  return {
    enabled: config.backup.excelBackupEnabled,
    frequency: config.backup.excelBackupFrequency,
    time: config.backup.excelBackupTime,
    maxBackups: config.backup.maxExcelBackups,
    path: config.backup.excelPath
  };
}

// Update Excel backup settings
async function updateExcelBackupSettings(settings) {
  try {
    // Validate settings
    if (typeof settings.enabled !== 'boolean' ||
        !['daily', 'weekly', 'monthly'].includes(settings.frequency) ||
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(settings.time) ||
        typeof settings.maxBackups !== 'number') {
      throw new Error('Invalid Excel backup settings');
    }
    
    // Update config in memory
    config.backup.excelBackupEnabled = settings.enabled;
    config.backup.excelBackupFrequency = settings.frequency;
    config.backup.excelBackupTime = settings.time;
    config.backup.maxExcelBackups = settings.maxBackups;
    
    // Update in .env file
    await config.updateConfig({
      'EXCEL_BACKUP_ENABLED': settings.enabled,
      'EXCEL_BACKUP_FREQUENCY': settings.frequency,
      'EXCEL_BACKUP_TIME': settings.time,
      'MAX_EXCEL_BACKUPS': settings.maxBackups
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating Excel backup settings:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  exportToExcel,
  importFromExcel,
  selectExcelFile,
  selectExcelExportDir,
  updateExcelExportDir,
  getExcelBackupSettings,
  updateExcelBackupSettings,
  runScheduledExcelBackup
}; 