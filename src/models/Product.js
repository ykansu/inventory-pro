const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');
const { 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  format, 
  subYears 
} = require('date-fns');

// Product model
class Product extends BaseModel {
  constructor() {
    super('products');
  }
  
  // Get products with category and supplier information (excluding deleted by default)
  async getAllWithDetails(options = {}) {
    try {
      const db = await this.getDb();
      // Get all products with joins
      let query = db(this.tableName)
        .select(
          'products.*',
          'categories.name as category_name',
          'suppliers.company_name as supplier_name'
        )
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id');
      
      // Apply soft delete filter unless explicitly requested to include deleted
      if (!options.includeDeleted) {
        query = query.where('products.is_deleted', false);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting products with details:', error);
      throw error;
    }
  }
  
  // Get all products including deleted ones
  async getAllWithDetailsIncludingDeleted() {
    return this.getAllWithDetails({ includeDeleted: true });
  }
  
  // Get only deleted products
  async getDeletedProducts() {
    try {
      const db = await this.getDb();
      return await db(this.tableName)
        .select(
          'products.*',
          'categories.name as category_name',
          'suppliers.company_name as supplier_name'
        )
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .where('products.is_deleted', true);
    } catch (error) {
      console.error('Error getting deleted products:', error);
      throw error;
    }
  }
  
  // Get product by barcode (excluding deleted)
  async getByBarcode(barcode) {
    const db = await this.getDb();
    return db(this.tableName).where({ barcode }).where('is_deleted', false).first();
  }
  
  // Get product by barcode including deleted
  async getByBarcodeIncludingDeleted(barcode) {
    const db = await this.getDb();
    return db(this.tableName).where({ barcode }).first();
  }
  
  // Get products with low stock (excluding deleted)
  async getLowStock() {
    const db = await this.getDb();
    return db(this.tableName)
      .whereRaw('stock_quantity <= min_stock_threshold')
      .where('is_deleted', false)
      .select('*');
  }
  
  // Update stock quantity
  async updateStock(id, quantity, adjustmentType, reason, reference) {
    const db = await this.getDb();
    // Start a transaction
    return db.transaction(async trx => {
      // Get current product (excluding deleted)
      const product = await trx(this.tableName).where({ id }).where('is_deleted', false).first();
      
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      // Calculate new stock quantity
      const newQuantity = product.stock_quantity + quantity;
      
      // Update product stock
      await trx(this.tableName)
        .where({ id })
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        });
      
      // Record the stock adjustment
      await trx('stock_adjustments').insert({
        product_id: id,
        quantity_change: quantity,
        adjustment_type: adjustmentType,
        reason,
        reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      return this.getById(id);
    });
  }
  
  // Soft delete a product
  async softDelete(id) {
    const db = await this.getDb();
    const result = await db(this.tableName)
      .where({ id })
      .where('is_deleted', false) // Ensure we're not deleting an already deleted product
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    return result;
  }
  
  // Restore a deleted product
  async restore(id) {
    const db = await this.getDb();
    const result = await db(this.tableName)
      .where({ id })
      .where('is_deleted', true) // Ensure we're only restoring a deleted product
      .update({ 
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString()
      });
    
    return result;
  }
  
  // Hard delete a product (for maintenance)
  async hardDelete(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).del();
  }
  
  // Get total count of products (excluding deleted)
  async getTotalCount() {
    const db = await this.getDb();
    const result = await db(this.tableName)
      .where('is_deleted', false)
      .count('id as count')
      .first();
    return result ? result.count : 0;
  }
  
  // Get count of low stock products (excluding deleted)
  async getLowStockCount() {
    const db = await this.getDb();
    const result = await db(this.tableName)
      .whereRaw('stock_quantity <= min_stock_threshold')
      .where('is_deleted', false)
      .count('id as count')
      .first();
    return result ? result.count : 0;
  }
  
  // Get total inventory value
  async getTotalInventoryValue() {
    try {
      return await this.getCurrentInventoryValue();
    } catch (error) {
      console.error('Error in getTotalInventoryValue:', error);
      throw error;
    }
  }
  
  // Get inventory value by category (excluding deleted products)
  async getInventoryValueByCategory() {
    try {
      const db = await this.getDb();
      const results = await db(this.tableName)
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .select(
          'categories.id as category_id',
          'categories.name as name',
          db.raw('SUM(products.stock_quantity * products.cost_price) as value'),
          db.raw('COUNT(products.id) as product_count')
        )
        .where('products.stock_quantity', '>', 0)
        .where('products.is_deleted', false)
        .groupBy('categories.id', 'categories.name');
      
      return results.map(category => ({
        id: category.category_id,
        name: category.name || 'Uncategorized',
        value: parseFloat(category.value) || 0,
        productCount: parseInt(category.product_count) || 0
      })).sort((a, b) => b.value - a.value); // Sort by value (highest first)
    } catch (error) {
      console.error('Error in getInventoryValueByCategory:', error);
      return [];
    }
  }
  
  // Get inventory value by supplier (excluding deleted products)
  async getInventoryValueBySupplier() {
    try {
      const db = await this.getDb();
      const results = await db(this.tableName)
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .select(
          'suppliers.id as supplier_id',
          'suppliers.company_name as name',
          db.raw('SUM(products.stock_quantity * products.cost_price) as value'),
          db.raw('COUNT(products.id) as product_count')
        )
        .where('products.stock_quantity', '>', 0)
        .where('products.is_deleted', false)
        .groupBy('suppliers.id', 'suppliers.company_name');
      
      return results.map(supplier => ({
        id: supplier.supplier_id,
        name: supplier.name || 'Unknown Supplier',
        value: parseFloat(supplier.value) || 0,
        productCount: parseInt(supplier.product_count) || 0
      })).sort((a, b) => b.value - a.value); // Sort by value (highest first)
    } catch (error) {
      console.error('Error in getInventoryValueBySupplier:', error);
      return [];
    }
  }
  
  // Get current inventory value (excluding deleted products)
  async getCurrentInventoryValue() {
    try {
      const db = await this.getDb();
      const result = await db(this.tableName)
        .where('is_deleted', false)
        .select(db.raw('SUM(stock_quantity * cost_price) as value'))
        .first();
      return result && result.value ? parseFloat(result.value) : 0;
    } catch (error) {
      console.error('Error in getCurrentInventoryValue:', error);
      return 0;
    }
  }
  
  // Calculate inventory turnover rate
  async getInventoryTurnoverRate() {
    try {
      const db = await this.getDb();
      
      // Get current inventory value
      const currentInventoryValue = await this.getCurrentInventoryValue();
      
      // If inventory value is zero, return zero to avoid division by zero
      if (currentInventoryValue === 0) {
        return 0;
      }
      
      // Check if required tables exist using a single query
      const tableCheck = await db.raw(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('sales', 'sale_items')
        GROUP BY name
      `);
      
      if (tableCheck.length < 2) {
        console.log('sales or sale_items table does not exist, returning default turnover rate');
        return 0; // A reasonable default turnover rate for retail
      }
      
      // Get the date for one year ago
      const now = new Date();
      const oneYearAgo = subYears(now, 1);
      const oneYearAgoStr = oneYearAgo.toISOString();
      
      // Use historical_cost_price from sale_items table which was added in migration 20250402_add_price_history.js
      // This is more efficient than joining with products table
      const cogsResult = await db('sale_items')
        .join('sales', 'sale_items.sale_id', 'sales.id')
        .where('sales.created_at', '>=', oneYearAgoStr)
        .where('sales.is_returned', false)
        .select(db.raw('SUM(sale_items.quantity * sale_items.historical_cost_price) as total_cogs'));
      
      // Extract COGS value from result
      const cogs = cogsResult[0]?.total_cogs ? parseFloat(cogsResult[0].total_cogs) : 0;
      // Calculate turnover rate (COGS / Average Inventory Value)
      const turnoverRate = cogs / currentInventoryValue;
      return turnoverRate;
    } catch (error) {
      console.error('Error in getInventoryTurnoverRate:', error);
      return 4.0; // Default fallback - standard retail turnover rate
    }
  
  }
  
  // Get inventory trend data for the past months
  async getInventoryTrend(months = 6) {
    try {
      const db = await this.getDb();
            
      // Calculate the start date by subtracting the specified number of months
      const startDate = subMonths(new Date(), months);
        
      // Ensure we get the start of the month for consistent data
      const startOfMonthDate = startOfMonth(startDate);
      
      // Convert to ISO string for database query
      const startDateStr = startOfMonthDate.toISOString();
        
      // Get current inventory values for each month
      const trendData = await db('products')
        .select(
          db.raw("strftime('%Y-%m', date('now'), 'localtime') as month"),
          db.raw('SUM(stock_quantity * cost_price) as value')
        )
        .where('stock_quantity', '>', 0)
        .where('is_deleted', false)
        .groupBy(db.raw("strftime('%Y-%m', date('now'), 'localtime')"));

      // Get historical inventory values from stock adjustments
      const historicalData = await db('stock_adjustments')
        .join('products', 'stock_adjustments.product_id', 'products.id')
        .select(
          db.raw("strftime('%Y-%m', stock_adjustments.created_at, 'localtime') as month"),
          db.raw('SUM(stock_adjustments.quantity_change * products.cost_price) as value')
        )
        .where('stock_adjustments.created_at', '>=', startDateStr)
        .where('products.is_deleted', false)
        .groupBy(db.raw("strftime('%Y-%m', stock_adjustments.created_at, 'localtime')"))
        .orderBy(db.raw("strftime('%Y-%m', stock_adjustments.created_at, 'localtime')"), 'desc')
        .limit(months);
      
      // Combine current and historical data
      const allData = [...trendData, ...historicalData];
      
      // Fill in missing months with zero values
      const result = [];
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const monthStr = date.toISOString().substring(0, 7);
        
        // Find if we have data for this month
        const existingData = allData.find(item => item.month === monthStr);
        
        result.push({
          month: monthStr,
          value: existingData ? parseFloat(existingData.value) || 0 : 0
        });
      }
      
      return result.reverse();
    } catch (error) {
      console.error("Error in getInventoryTrend:", error);
      // Return empty array on error
      return [];
    }
  }
}

module.exports = Product; 