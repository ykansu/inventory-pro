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

// Create a new database connection
let db = null;

/**
 * Initialize the database
 * - Ensures the database file exists
 * - Runs pending migrations if needed
 * - Optionally seeds the database if it's new
 */
async function initDatabase(options = { seedIfNew: true }) {
  try {
    console.log('Initializing database...');
    
    // Ensure the database directory exists (D:\repos\inventory-pro\src\database\migrations)
    const dbDir = path.dirname(knexConfig.connection.filename);
    if (!fs.existsSync(dbDir)) {
      console.log(`Creating database directory: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log(`Using database at: ${knexConfig.connection.filename}`);
    
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

module.exports = {
  initDatabase,
  getConnection,
  closeConnection,
};