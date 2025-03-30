const path = require('path');
const fs = require('fs');
const db = require('./connection');
const config = require('./config');

// Initialize the database
async function initDatabase() {
  try {
    // Ensure the database directory exists
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Ensure backup directory exists
    if (!fs.existsSync(config.backup.path)) {
      fs.mkdirSync(config.backup.path, { recursive: true });
    }

    // Run migrations
    await db.migrate.latest();
    console.log('Database migrations completed successfully');

    // Check if we need to run seeds (only if database is new)
    const [{ count }] = await db('sqlite_master').count('* as count').where('type', 'table').whereNot('name', 'like', 'sqlite_%');
    
    // If we only have system tables and migration tables, run seeds
    if (count <= 2) {
      await db.seed.run();
      console.log('Database seeding completed successfully');
    } else {
      // Check if products table exists but has no data
      const hasProductsTable = await db.schema.hasTable('products');
      if (hasProductsTable) {
        const productCount = await db('products').count('* as count').first();
        if (productCount.count === 0) {
          // If products table exists but is empty, run seeds
          await db.seed.run();
          console.log('Database re-seeded due to empty products table');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

module.exports = {
  initDatabase,
};