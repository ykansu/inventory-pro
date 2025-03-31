const knex = require('knex');
const knexConfig = require('./knexfile');

// Create database connection
let db = knex(knexConfig);

// Add connection pool error handling
db.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Close the current database connection
const closeConnection = async () => {
  try {
    console.log('Closing database connection...');
    if (db) {
      await db.destroy();
      console.log('Database connection closed successfully');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

// Reinitialize the database connection
const reinitializeConnection = async () => {
  try {
    console.log('Reinitializing database connection...');
    
    // Create a new connection with the same config
    const newDb = knex(knexConfig);
    
    // Test the connection
    await newDb.raw('SELECT 1');
    
    // Replace the old db reference
    Object.keys(db).forEach(key => {
      delete db[key];
    });
    
    Object.assign(db, newDb);
    
    // Make sure the main module export also points to the new connection
    module.exports = db;
    module.exports.closeConnection = closeConnection;
    module.exports.reinitializeConnection = reinitializeConnection;
    
    console.log('Database connection reinitialized successfully');
    return db;
  } catch (error) {
    console.error('Error reinitializing database connection:', error);
    throw error;
  }
};

// Export the database connection and helper functions
module.exports = db;
module.exports.closeConnection = closeConnection;
module.exports.reinitializeConnection = reinitializeConnection;