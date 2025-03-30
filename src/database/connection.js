const knex = require('knex');
const knexConfig = require('./knexfile');

// Create database connection
const db = knex(knexConfig);

// Export the database connection
module.exports = db;