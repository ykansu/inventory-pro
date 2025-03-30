const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const knex = require('knex');

// Function to debug database connection and queries
async function debugDatabase() {
  try {
    console.log('Starting database debug...');
    
    // Get user data path
    const userDataPath = app.getPath('userData');
    console.log('User data path:', userDataPath);
    
    // Check if database file exists
    const dbPath = path.join(userDataPath, 'inventory-pro.db');
    console.log('Database path:', dbPath);
    console.log('Database file exists:', fs.existsSync(dbPath));
    
    if (!fs.existsSync(dbPath)) {
      console.error('Database file does not exist!');
      return;
    }
    
    // Create a direct connection to the database
    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath
      },
      useNullAsDefault: true
    });
    
    console.log('Database connection created');
    
    // Check if tables exist
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%';");
    console.log('Tables in database:', tables);
    
    // Check products table
    const hasProductsTable = await db.schema.hasTable('products');
    console.log('Products table exists:', hasProductsTable);
    
    if (hasProductsTable) {
      // Count products
      const productCount = await db('products').count('* as count').first();
      console.log('Product count:', productCount);
      
      // Get all products
      const products = await db('products').select('*');
      console.log(`Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log('First product:', products[0]);
      }
    }
    
    // Close the database connection
    await db.destroy();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Error debugging database:', error);
    return false;
  }
}

module.exports = { debugDatabase };
