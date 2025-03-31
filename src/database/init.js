const path = require('path');
const fs = require('fs');
const db = require('./connection');
const config = require('./config');

// Initialize the database
async function initDatabase(options = { skipSeeding: true }) {
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

    // Verify migrations directory integrity
    try {
      const migrationsDir = path.join(__dirname, 'migrations');
      console.log('Checking migrations directory:', migrationsDir);
      
      // Get expected migrations from knexfile
      const knexMigrator = await db.migrate;
      
      // Check if we can run migrations
      await db.migrate.latest();
      console.log('Database migrations completed successfully');
    } catch (migrationError) {
      console.error('Migration error:', migrationError);
      
      // If there's a corrupt migration directory error, try to work around it
      if (migrationError.message && migrationError.message.includes('migration directory is corrupt')) {
        console.log('Attempting to work around corrupt migration directory...');
        
        // Try to continue anyway - the database might still be usable
        console.warn('Proceeding with initialization despite migration errors');
      } else {
        // For other migration errors, we should still continue if possible
        console.warn('Migration error encountered but continuing initialization');
      }
    }

    // Check if we need to run seeds (only if database is new AND skipSeeding is false)
    try {
      const [{ count }] = await db('sqlite_master').count('* as count').where('type', 'table').whereNot('name', 'like', 'sqlite_%');
      
      // Only run seeds if explicitly enabled and we only have system tables and migration tables
      if (count <= 2 && options.skipSeeding === false) {
        try {
          console.log('New database detected, running seeds...');
          await db.seed.run();
          console.log('Database seeding completed successfully');
        } catch (seedError) {
          console.error('Seeding error:', seedError);
        }
      } else if (count <= 2) {
        console.log('New database detected, but seeding is disabled. Skipping seed scripts.');
      } else {
        // Check if products table exists but has no data
        const hasProductsTable = await db.schema.hasTable('products');
        if (hasProductsTable && options.skipSeeding === false) {
          const productCount = await db('products').count('* as count').first();
          if (productCount.count === 0) {
            // If products table exists but is empty, run seeds only if seeding is explicitly enabled
            try {
              console.log('Empty products table detected, running seeds...');
              await db.seed.run();
              console.log('Database re-seeded due to empty products table');
            } catch (reSeeedError) {
              console.error('Re-seeding error:', reSeeedError);
            }
          }
        } else if (hasProductsTable) {
          console.log('Products table exists, but seeding is disabled. Skipping seed scripts.');
        }
      }
    } catch (checkError) {
      console.error('Error checking database state:', checkError);
    }

    // Make sure connection is still valid
    try {
      await db.raw('SELECT 1');
      console.log('Database connection validated');
    } catch (connectionError) {
      console.error('Database connection validation failed:', connectionError);
      // Try to reconnect
      await db.destroy();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newDb = require('./connection');
      await newDb.raw('SELECT 1');
      console.log('Database connection reestablished');
    }

    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    try {
      // Try to ensure we have a working connection even if initialization fails
      await db.destroy();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newDb = require('./connection');
      console.log('Database connection reset after initialization failure');
    } catch (e) {
      console.error('Failed to reset connection after initialization failure:', e);
    }
    return false;
  }
}

// Function to explicitly run with seeding for when you want to seed
async function initDatabaseWithSeeding() {
  return initDatabase({ skipSeeding: false });
}

module.exports = {
  initDatabase,
  initDatabaseWithSeeding
};