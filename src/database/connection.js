/**
 * Database Connection Module
 * 
 * Provides a shared database connection for the application.
 * This is a thin wrapper around the dbManager functionality.
 */

const dbManager = require('./dbManager');

// This module exports a promise that resolves to the database connection
module.exports = {
  /**
   * Get the database connection
   * If no connection exists, it will initialize one
   */
  async getConnection() {
    return dbManager.getConnection();
  },
  
  /**
   * Close the database connection
   */
  async closeConnection() {
    return dbManager.closeConnection();
  },
  
  /**
   * Reinitialize the database connection
   * This will close the existing connection and create a new one
   */
  async reinitializeConnection() {
    await dbManager.closeConnection();
    return dbManager.getConnection();
  },
  
  /**
   * Initialize the database
   * This will run migrations and seed if needed
   */
  async initDatabase(options) {
    return dbManager.initDatabase(options);
  }
};