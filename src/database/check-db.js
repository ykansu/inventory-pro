const db = require('./connection');

async function checkDatabase() {
  try {
    console.log('Checking database structure...');
    
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
      console.log('Products:', products);
    }
    
    // Close the database connection
    await db.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
