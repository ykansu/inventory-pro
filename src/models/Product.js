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
  
  // Get products with category and supplier information
  async getAllWithDetails() {
    try {
      const db = await this.getDb();
      // Get all products with joins
      return await db(this.tableName)
        .select(
          'products.*',
          'categories.name as category_name',
          'suppliers.company_name as supplier_name'
        )
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id');
    } catch (error) {
      console.error('Error getting products with details:', error);
      throw error;
    }
  }
  
  // Get product by barcode
  async getByBarcode(barcode) {
    const db = await this.getDb();
    return db(this.tableName).where({ barcode }).first();
  }
  
  // Get products with low stock
  async getLowStock() {
    const db = await this.getDb();
    return db(this.tableName)
      .whereRaw('stock_quantity <= min_stock_threshold')
      .select('*');
  }
  
  // Update stock quantity
  async updateStock(id, quantity, adjustmentType, reason, reference) {
    const db = await this.getDb();
    // Start a transaction
    return db.transaction(async trx => {
      // Get current product
      const product = await trx(this.tableName).where({ id }).first();
      
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
  
  // Get total count of products
  async getTotalCount() {
    const db = await this.getDb();
    const result = await db(this.tableName).count('id as count').first();
    return result ? result.count : 0;
  }
  
  // Get count of low stock products
  async getLowStockCount() {
    const db = await this.getDb();
    const result = await db(this.tableName)
      .whereRaw('stock_quantity <= min_stock_threshold')
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
  
  // Get inventory value by category
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
  
  // Get inventory value by supplier
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
  
  // Get current inventory value
  async getCurrentInventoryValue() {
    try {
      const db = await this.getDb();
      const result = await db(this.tableName)
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
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable('sales');
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('sales or sale_items table does not exist, returning default turnover rate');
        return 4.0; // A reasonable default turnover rate for retail
      }
      
      // Get all sales for the past year to calculate cost of goods sold (COGS)
      const now = new Date();
      const oneYearAgo = subYears(now, 1).toISOString();
      
      // Get all sale items for the past year
      const saleItems = await db('sale_items')
        .join('sales', 'sale_items.sale_id', 'sales.id')
        .join('products', 'sale_items.product_id', 'products.id')
        .where('sales.created_at', '>=', oneYearAgo)
        .where('sales.is_returned', false)
        .select(
          'sale_items.quantity',
          'products.cost_price'
        );
      
      // Calculate COGS
      let cogs = 0;
      saleItems.forEach(item => {
        cogs += item.quantity * item.cost_price;
      });
      
      // Calculate turnover rate (COGS / Average Inventory Value)
      // For simplicity, we're using current inventory value as the average
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
          db.raw("strftime('%Y-%m', date('now')) as month"),
          db.raw('SUM(stock_quantity * cost_price) as value')
        )
        .where('stock_quantity', '>', 0)
        .groupBy(db.raw("strftime('%Y-%m', date('now'))"));

      // Get historical inventory values from stock adjustments
      const historicalData = await db('stock_adjustments')
        .join('products', 'stock_adjustments.product_id', 'products.id')
        .select(
          db.raw("strftime('%Y-%m', stock_adjustments.created_at) as month"),
          db.raw('SUM(stock_adjustments.quantity_change * products.cost_price) as value')
        )
        .where('stock_adjustments.created_at', '>=', startDateStr)
        .groupBy(db.raw("strftime('%Y-%m', stock_adjustments.created_at)"))
        .orderBy(db.raw("strftime('%Y-%m', stock_adjustments.created_at)"), 'desc')
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