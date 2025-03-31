const fs = require('fs');
const path = require('path');
const { app, dialog } = require('electron');
const config = require('./config');
const db = require('./connection');

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
  return [
    { name: 'categories', data: await db('categories').select('*') },
    { name: 'suppliers', data: await db('suppliers').select('*') },
    { name: 'products', data: await db('products').select('*') },
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
    const exportDir = customPath || config.backup.jsonPath || path.join(app.getPath('desktop'));
    
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
        appVersion: app.getVersion(),
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
    
    // Begin transaction
    await db.transaction(async trx => {
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
        await trx.raw("DELETE FROM sqlite_sequence WHERE name IN ('categories', 'suppliers', 'products', 'sales', 'sale_items', 'stock_adjustments')");
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
        
        if (importData.data.sale_items && importData.data.sale_items.length) {
          console.log(`Importing ${importData.data.sale_items.length} sale items`);
          for (const item of importData.data.sale_items) {
            const { id, ...data } = item;
            
            // Update foreign key references
            if (data.sale_id && idMappings.sales[data.sale_id]) {
              data.sale_id = idMappings.sales[data.sale_id];
            } else {
              // Skip if sale doesn't exist
              continue;
            }
            
            if (data.product_id && idMappings.products[data.product_id]) {
              data.product_id = idMappings.products[data.product_id];
            } else {
              // Skip if product doesn't exist
              continue;
            }
            
            await trx('sale_items').insert(data);
          }
        }
        
        // Handle stock adjustments separately (they have product references)
        if (importData.data.stock_adjustments && importData.data.stock_adjustments.length) {
          console.log(`Importing ${importData.data.stock_adjustments.length} stock adjustments`);
          for (const item of importData.data.stock_adjustments) {
            const { id, ...data } = item;
            
            // Update product references
            if (data.product_id && idMappings.products[data.product_id]) {
              data.product_id = idMappings.products[data.product_id];
              await trx('stock_adjustments').insert(data);
            }
          }
        }
        
        // Optionally import settings
        if (importData.data.settings && importData.data.settings.length) {
          console.log(`Importing ${importData.data.settings.length} settings`);
          for (const item of importData.data.settings) {
            const existingSetting = await trx('settings')
              .where({ key: item.key })
              .first();
            
            if (existingSetting) {
              await trx('settings')
                .where({ key: item.key })
                .update({ value: item.value });
            } else {
              await trx('settings').insert(item);
            }
          }
        }
        
        // Re-enable foreign key constraints
        await trx.raw('PRAGMA foreign_keys = ON;');
        console.log('Foreign key constraints re-enabled');
      } catch (error) {
        console.error('Error during import transaction:', error);
        // Try to re-enable foreign keys even if import failed
        try {
          await trx.raw('PRAGMA foreign_keys = ON;');
        } catch (e) {
          // Ignore error when trying to re-enable foreign keys
        }
        throw error;
      }
    });
    
    console.log(`Data imported successfully from: ${jsonFile}`);
    return true;
  } catch (error) {
    console.error('Data import failed:', error);
    throw error;
  }
}

module.exports = {
  exportToJson,
  importFromJson
}; 