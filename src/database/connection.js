const knex = require('knex');
const knexConfig = require('./knexfile');

// Create database connection
const db = knex(knexConfig);

// Add connection pool error handling
db.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Add periodic ping to keep connections alive
setInterval(() => {
  db.raw('SELECT 1')
    .then(() => {
      // Connection is good
      if (process.env.NODE_ENV !== 'production') {
        console.log('Database connection is healthy');
      }
    })
    .catch(err => {
      console.error('Error pinging database:', err);
    });
}, 60000); // Check every minute

// Graceful shutdown function
const closeConnection = async () => {
  try {
    console.log('Closing database connections...');
    await db.destroy();
    console.log('Database connections closed');
  } catch (err) {
    console.error('Error closing database connections:', err);
  }
};

// Export the database connection and helper functions
module.exports = db;
module.exports.closeConnection = closeConnection;