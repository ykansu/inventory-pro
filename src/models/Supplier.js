const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');

// Supplier model
class Supplier extends BaseModel {
  constructor() {
    super('suppliers');
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }
  
  // Get supplier with product count
  async getAllWithProductCount() {
    const db = await this.getDb();
    return db(this.tableName)
      .select(
        'suppliers.*',
        db.raw('COUNT(products.id) as product_count')
      )
      .leftJoin('products', 'suppliers.id', 'products.supplier_id')
      .groupBy('suppliers.id');
  }
}

module.exports = Supplier; 