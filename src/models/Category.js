const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');

// Category model
class Category extends BaseModel {
  constructor() {
    super('categories');
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }
  
  // Get category with product count
  async getAllWithProductCount() {
    const db = await this.getDb();
    return db(this.tableName)
      .select(
        'categories.*',
        db.raw('COUNT(products.id) as product_count')
      )
      .leftJoin('products', 'categories.id', 'products.category_id')
      .groupBy('categories.id');
  }
}

module.exports = Category; 