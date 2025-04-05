/**
 * Database Manager
 * 
 * Manages database initialization, migration, and connection.
 * Provides a consistent way to ensure the database is ready for use.
 */

const path = require('path');
const fs = require('fs');
const knex = require('knex');
const knexConfig = require('./knexfile');
const config = require('./config');

// Create a new database connection
let db = null;

// Define essential default settings
const defaultSettings = [
  { key: 'business_name', value: 'Inventory Pro Store', type: 'string', description: 'Name of the business' },
  { key: 'business_address', value: 'Istanbul, Turkey', type: 'string', description: 'Address of the business' },
  { key: 'business_phone', value: '+90 123 456 7890', type: 'string', description: 'Phone number of the business' },
  { key: 'business_email', value: 'contact@inventorypro.com', type: 'string', description: 'Email of the business' },
  { key: 'language', value: 'en', type: 'string', description: 'Application language' }, // Added language default
  { key: 'currency', value: 'TRY', type: 'string', description: 'Currency used in the application' },
  { key: 'tax_rate', value: '18', type: 'number', description: 'Default tax rate percentage' },
  { key: 'receipt_footer', value: 'Thank you for your purchase!', type: 'string', description: 'Message to display at the bottom of receipts' },
  { key: 'date_format', value: 'DD/MM/YYYY', type: 'string', description: 'Format for displaying dates' },
  { key: 'time_format', value: '24', type: 'string', description: 'Format for displaying time (12 or 24)' }
];

/**
 * Initialize the database
 * - Ensures the database file exists
 * - Runs pending migrations if needed
 * - Optionally seeds the database if it's new
 */
async function initDatabase(options = { seedIfNew: true }) {
  try {
    console.log('Initializing database...');
    
    // Ensure the database directory exists
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log(`Using database at: ${config.dbPath}`);
    
    // Create/get database connection
    if (!db) {
      db = knex(knexConfig);
    }
    
    // Run migrations if needed
    console.log('Checking for pending migrations...');
    const [batchNo, migrations] = await db.migrate.latest();
    
    if (migrations.length === 0) {
      console.log('Database schema is up to date.');
    } else {
      console.log(`Batch ${batchNo} migrations completed: ${migrations.length} migrations`);
      console.log('Applied migrations:', migrations.join(', '));
    }
    
    // Ensure default settings exist using INSERT IGNORE logic
    console.log('Ensuring default settings exist...');
    for (const setting of defaultSettings) {
      try {
        // Attempt to insert the default setting
        // If a setting with the same key exists, ignore the insert
        await db('settings')
          .insert({
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description,
            created_at: new Date().toISOString(), // Set creation timestamp only if inserted
            updated_at: new Date().toISOString()  // Set update timestamp only if inserted
          })
          .onConflict('key')
          .ignore(); // Ignore if the key already exists
      } catch (settingError) {
        console.error(`Failed to ensure default setting '${setting.key}':`, settingError);
        // Decide if this should be fatal. For now, log and continue.
      }
    }
    console.log('Default settings checked/applied.');
    
    // Check if we need to seed the database (if it's new and seeding is enabled)
    if (options.seedIfNew) {
      // Check if this is a new database by counting the tables
      const [{ count }] = await db('sqlite_master')
        .count('* as count')
        .where('type', 'table')
        .whereNot('name', 'like', 'sqlite_%')
        .whereNot('name', 'knex_migrations')
        .whereNot('name', 'knex_migrations_lock');
      
      if (count === 0) {
        console.log('New database detected, running seeds...');
        await db.seed.run();
        console.log('Database seeding completed successfully');
      }
    }
    
    // Validate the connection
    await db.raw('SELECT 1');
    console.log('Database initialization completed successfully');
    
    return { success: true, db };
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // If we have a connection, try to destroy it before returning
    if (db) {
      try {
        await db.destroy();
        db = null;
      } catch (destroyError) {
        console.error('Error destroying failed connection:', destroyError);
      }
    }
    
    return { success: false, error };
  }
}

/**
 * Get the database connection
 * If the connection doesn't exist yet, it will be created
 */
async function getConnection() {
  if (!db) {
    const result = await initDatabase();
    if (!result.success) {
      throw new Error('Failed to initialize database connection');
    }
  }
  return db;
}

/**
 * Close the database connection
 */
async function closeConnection() {
  if (db) {
    await db.destroy();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Reload configuration
 * Call this when the environment file is changed
 */
async function reloadConfiguration() {
  // Reload config from .env file
  config.reloadConfig();
  
  // If we have a database connection, close it
  // It will be recreated with the new configuration when needed
  if (db) {
    await closeConnection();
  }
  
  console.log('Database configuration reloaded');
  return { success: true };
}

module.exports = {
  initDatabase,
  getConnection,
  closeConnection,
  reloadConfiguration
};