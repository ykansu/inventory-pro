const dbConnection = require('../database/connection');
const { subMonths, startOfMonth, format, startOfDay, endOfDay } = require('date-fns');


// Helper functions for formatting
const formatDateHelper = (date, options = {}, defaultValue = '') => {
  try {
    // Handle undefined, null, or invalid dates
    if (date === undefined || date === null) {
      return defaultValue;
    }
    
    // Convert string or number to Date object if needed
    let dateObj = date;
    if (!(date instanceof Date)) {
      dateObj = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return defaultValue;
    }
    
    return dateObj.toLocaleString('default', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return defaultValue;
  }
};

// Base model with common CRUD operations
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }
  
  // Get the database connection
  async getDb() {
    return dbConnection.getConnection();
  }
  
  // Get all records
  async getAll() {
    const db = await this.getDb();
    return db(this.tableName).select('*');
  }
  
  // Get record by ID
  async getById(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).first();
  }
  
  // Create a new record
  async create(data) {
    const db = await this.getDb();
    const [id] = await db(this.tableName).insert(data);
    return this.getById(id);
  }
  
  // Update a record
  async update(id, data) {
    const db = await this.getDb();
    await db(this.tableName).where({ id }).update(data);
    return this.getById(id);
  }
  
  // Delete a record
  async delete(id) {
    const db = await this.getDb();
    return db(this.tableName).where({ id }).del();
  }
}

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
          updated_at: new Date()
        });
      
      // Record the stock adjustment
      await trx('stock_adjustments').insert({
        product_id: id,
        quantity_change: quantity,
        adjustment_type: adjustmentType,
        reason,
        reference,
        created_at: new Date(),
        updated_at: new Date()
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
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
      
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

// Category model
class Category extends BaseModel {
  constructor() {
    super('categories');
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

// Supplier model
class Supplier extends BaseModel {
  constructor() {
    super('suppliers');
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

// Sale model
class Sale extends BaseModel {
  constructor() {
    super('sales');
  }
  
  // Create a sale with items
  async createWithItems(saleData, items) {
    const db = await this.getDb();
    return db.transaction(async trx => {
      try {
        // Get current real date for proper storage
        const now = new Date();
        const nowISOString = now.toISOString();
        
        // Make a copy to avoid modifying the original object
        const formattedSaleData = {
          ...saleData
        };
        
        // Use ISO string format for dates if they exist, ensuring we use the current real year
        if (formattedSaleData.created_at) {
          // Extract the current year from the real date
          const realYear = now.getFullYear();
          
          // Convert to ISO string and replace the year with the real year
          let dateISOString = formattedSaleData.created_at.toISOString();
          dateISOString = dateISOString.replace(/^\d{4}/, realYear.toString());
          
          formattedSaleData.created_at = dateISOString;
        } else {
          formattedSaleData.created_at = nowISOString;
        }
        
        if (formattedSaleData.updated_at) {
          // Extract the current year from the real date
          const realYear = now.getFullYear();
          
          // Convert to ISO string and replace the year with the real year
          let dateISOString = formattedSaleData.updated_at.toISOString();
          dateISOString = dateISOString.replace(/^\d{4}/, realYear.toString());
          
          formattedSaleData.updated_at = dateISOString;
        } else {
          formattedSaleData.updated_at = nowISOString;
        }
        
        // Insert the sale
        const [saleId] = await trx(this.tableName).insert(formattedSaleData);
        
        // Get current cost prices for all products
        const productCosts = await trx('products')
          .whereIn('id', items.map(item => item.product_id))
          .select('id', 'cost_price');
        
        // Create a map of product costs for easy lookup
        const costPriceMap = new Map(productCosts.map(p => [p.id, p.cost_price]));
        
        // Prepare the items with sale_id and historical cost price
        const saleItems = items.map(item => ({
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          historical_cost_price: costPriceMap.get(item.product_id) || 0,
          discount_amount: item.discount_amount || 0,
          total_price: item.total_price,
          created_at: nowISOString,
          updated_at: nowISOString
        }));
        
        // Insert the sale items
        await trx('sale_items').insert(saleItems);
        
        // Update product stock for each item
        for (const item of items) {
          await trx('products')
            .where({ id: item.product_id })
            .decrement('stock_quantity', item.quantity);
            
          // Record stock adjustment
          await trx('stock_adjustments').insert({
            product_id: item.product_id,
            quantity_change: -item.quantity,
            adjustment_type: 'sale',
            reference: formattedSaleData.receipt_number,
            created_at: nowISOString,
            updated_at: nowISOString
          });
        }
        
        // Get the created sale
        const sale = await trx(this.tableName).where({ id: saleId }).first();
        
        // Get the created sale items
        const createdItems = await trx('sale_items').where({ sale_id: saleId }).select('*');
        
        // Return the complete sale with items
        return {
          ...sale,
          items: createdItems
        };
      } catch (error) {
        console.error('Error in createWithItems transaction:', error);
        throw error;
      }
    });
  }
  
  // Get sale with items
  async getWithItems(id) {
    try {
      const db = await this.getDb();
      const sale = await db(this.tableName).where({ id }).first();
      
      if (!sale) {
        return null;
      }
      
      const items = await db('sale_items')
        .where({ sale_id: id })
        .select('*');
        
      return {
        ...sale,
        items
      };
    } catch (error) {
      console.error(`Error in getWithItems for id ${id}:`, error);
      throw error;
    }
  }
  
  // Get sales by date range
  async getByDateRange(startDate, endDate) {
    try {
      // Format dates to ensure proper string format for SQLite
      let formattedStartDate = startDate;
      let formattedEndDate = endDate;

      // Add time component if not present for start date
      if (startDate && !formattedStartDate.includes('T')) {
        formattedStartDate = `${formattedStartDate}T00:00:00.000`;
      }
      
      // Add time component for end of day if not present
      if (endDate && !formattedEndDate.includes('T')) {
        formattedEndDate = `${formattedEndDate}T23:59:59.999`;
      }
      formattedStartDate = new Date(formattedStartDate).toISOString();
      formattedEndDate = new Date(formattedEndDate).toISOString();

      // Get database connection
      const db = await this.getDb();
      
      // Query sales directly with date filtering in SQLite
      const query = db(this.tableName)
        .select(`${this.tableName}.*`)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate);
      
      // Execute the query
      const filteredSales = await query;
      
      // If there are no sales, return an empty array
      if (filteredSales.length === 0) {
        return [];
      }
      
      // Enhancement: Include item count for each sale using a more efficient join
      const db2 = await this.getDb();
      const salesWithItemCounts = await db2(this.tableName)
        .select(`${this.tableName}.id`)
        .count('sale_items.id as item_count')
        .leftJoin('sale_items', `${this.tableName}.id`, 'sale_items.sale_id')
        .whereIn(`${this.tableName}.id`, filteredSales.map(sale => sale.id))
        .groupBy(`${this.tableName}.id`);
      
      // Map the item counts to the filtered sales
      const salesMap = new Map(salesWithItemCounts.map(item => [item.id, item.item_count]));
      
      // Add item count to each sale
      filteredSales.forEach(sale => {
        sale.item_count = salesMap.get(sale.id) || 0;
      });
      
      return filteredSales;
    } catch (error) {
      console.error('Error in getByDateRange:', error);
      throw error;
    }
  }
  
  // Get today's sales total
  async getTodaySalesTotal() {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Check if the sales table exists
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      
      if (!hasSalesTable) {
        return 0;
      }
      
      // Use date-fns to get today's date range
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      
      // Convert to ISO strings for the query
      const startDateISO = todayStart.toISOString();
      const endDateISO = todayEnd.toISOString();
      
      // Get sales for today in the database
      const sales = await db(this.tableName)
        .where('created_at', '>=', startDateISO)
        .where('created_at', '<=', endDateISO)
        .where('is_returned', false)
        .select('total_amount');
      
      // Calculate total sales amount
      const todaySalesTotal = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      
      return todaySalesTotal;
    } catch (error) {
      console.error('Error in getTodaySalesTotal:', error);
      return 0; // Return 0 instead of throwing to prevent dashboard crashes
    }
  }
  
  // Get monthly profit metrics
  async getMonthlyProfitMetrics() {
    try {
      // Get the current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Format start and end dates for the current month
      const startDate = new Date(currentYear, now.getMonth(), 1);
      const endDate = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Format dates for SQLite query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get database connection
      const db = await this.getDb();
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('Required tables do not exist, returning default metrics');
        return {
          monthlyRevenue: 0,
          monthlyProfit: 0,
          profitMargin: 0
        };
      }
      
      // Get all sales for current month
      const sales = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .select('id', 'total_amount');
      
      if (sales.length === 0) {
        return {
          monthlyRevenue: 0,
          monthlyProfit: 0,
          profitMargin: 0
        };
      }
      
      // Get sale IDs
      const saleIds = sales.map(sale => sale.id);
      
      // Calculate monthly revenue
      const monthlyRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
      
      // Get all sale items with historical cost information
      const saleItemsWithCost = await db('sale_items')
        .whereIn('sale_id', saleIds)
        .select(
          'quantity',
          'unit_price',
          'total_price',
          'historical_cost_price'
        );
      
      // Calculate total cost and profit using historical cost prices
      let totalCost = 0;
      
      saleItemsWithCost.forEach(item => {
        totalCost += parseFloat(item.historical_cost_price) * parseInt(item.quantity);
      });
      
      const monthlyProfit = monthlyRevenue - totalCost;
      const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
      
      return {
        monthlyRevenue,
        monthlyProfit,
        profitMargin: Math.round(profitMargin * 10) / 10 // Round to 1 decimal place
      };
    } catch (error) {
      console.error('Error in getMonthlyProfitMetrics:', error);
      return {
        monthlyRevenue: 0,
        monthlyProfit: 0,
        profitMargin: 0
      };
    }
  }
  
  // Get profit by category for the current month
  async getProfitByCategory(period = 'month') {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      const hasCategoriesTable = await db.schema.hasTable('categories');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('Required tables do not exist, returning empty category profit data');
        return [];
      }
      
      // Calculate date range based on period
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'week') {
        // Set to beginning of current week (Sunday)
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'year') {
        // Set to beginning of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
      } else {
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      // Format dates for SQLite query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for current month
      const salesIds = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .pluck('id');
      
      if (salesIds.length === 0) {
        return [];
      }
      
      // Get all sale items with category and historical cost information
      const db2 = await this.getDb();
      const categoryProfits = await db2('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .whereIn('sale_items.sale_id', salesIds)
        .select(
          'categories.id as category_id',
          'categories.name as name',
          db2.raw('SUM(sale_items.total_price) as revenue'),
          db2.raw('SUM(sale_items.historical_cost_price * sale_items.quantity) as cost')
        )
        .groupBy('categories.id', 'categories.name');
      
      // Calculate profit and margin for each category
      const categoriesWithProfit = categoryProfits.map(category => {
        const revenue = parseFloat(category.revenue) || 0;
        const cost = parseFloat(category.cost) || 0;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
          id: category.category_id, // Include id for React keys
          name: category.name || 'Uncategorized',
          revenue,
          cost,
          profit,
          margin: Math.round(margin * 10) / 10 // Round to 1 decimal place
        };
      });
      
      // Sort by profit (highest first)
      return categoriesWithProfit.sort((a, b) => b.profit - a.profit);
    } catch (error) {
      console.error('Error in getProfitByCategory:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  // Get top selling products
  async getTopSellingProducts(period = 'month', limit = 5) {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('Required tables do not exist, returning empty top products data');
        return [];
      }
      
      // Calculate date range based on period
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'week') {
        // Set to beginning of current week (Sunday)
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'year') {
        // Set to beginning of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
      } else {
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      // Format dates for SQLite query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for current month
      const salesIds = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .pluck('id');
      
      if (salesIds.length === 0) {
        return [];
      }
      
      // Get product sales aggregated by product
      const db2 = await this.getDb();
      let query = db2('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .whereIn('sale_items.sale_id', salesIds)
        .select(
          'products.id as id',
          'products.name as name',
          'categories.name as category',
          db2.raw('SUM(sale_items.quantity) as quantity_sold'),
          db2.raw('SUM(sale_items.total_price) as revenue'),
          db2.raw('SUM(sale_items.historical_cost_price * sale_items.quantity) as cost')
        )
        .groupBy('products.id', 'products.name', 'categories.name');
      
      // Add limit if specified
      if (limit) {
        query = query.orderBy('quantity_sold', 'desc').limit(limit);
      } else {
        query = query.orderBy('quantity_sold', 'desc');
      }
      
      // Execute the query
      const topProducts = await query;
      
      // Calculate profit and margin for each product
      return topProducts.map(product => {
        const revenue = parseFloat(product.revenue) || 0;
        const cost = parseFloat(product.cost) || 0;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
          id: product.id,
          name: product.name,
          category: product.category || 'Uncategorized',
          quantity: parseInt(product.quantity_sold) || 0,
          revenue,
          cost,
          profit,
          profitMargin: Math.round(margin * 10) / 10 // Round to 1 decimal place
        };
      });
    } catch (error) {
      console.error('Error in getTopSellingProducts:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  // Get revenue and profit by supplier
  async getRevenueAndProfitBySupplier(period = 'month') {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      const hasSuppliersTable = await db.schema.hasTable('suppliers');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('Required tables do not exist, returning empty supplier profit data');
        return [];
      }
      
      // Calculate date range based on period
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'week') {
        // Set to beginning of current week (Sunday)
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'year') {
        // Set to beginning of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
      } else {
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      // Format dates for SQLite query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for current month
      const salesIds = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .pluck('id');
      
      if (salesIds.length === 0) {
        return [];
      }
      
      // Get all sale items with supplier and historical cost information
      const db2 = await this.getDb();
      const supplierData = await db2('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .whereIn('sale_items.sale_id', salesIds)
        .select(
          'suppliers.id as supplier_id',
          'suppliers.company_name as name',
          db2.raw('SUM(sale_items.total_price) as revenue'),
          db2.raw('SUM(sale_items.historical_cost_price * sale_items.quantity) as cost')
        )
        .groupBy('suppliers.id', 'suppliers.company_name');
      
      // Calculate profit and margin for each supplier
      const suppliersWithProfit = supplierData.map(supplier => {
        const revenue = parseFloat(supplier.revenue) || 0;
        const cost = parseFloat(supplier.cost) || 0;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
          name: supplier.name || 'Unknown Supplier',
          revenue,
          cost,
          profit,
          margin: Math.round(margin * 10) / 10 // Round to 1 decimal place
        };
      });
      
      // Sort by revenue (highest first)
      return suppliersWithProfit.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error in getRevenueAndProfitBySupplier:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  // Get revenue by payment method
  async getRevenueByPaymentMethod(period = 'month') {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Check if the sales table exists
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      
      if (!hasSalesTable) {
        console.log('sales table does not exist, returning default payment method data');
        // Return sample data for UI development
        return [
          { method: 'cash', revenue: 0 },
          { method: 'card', revenue: 0 },
          { method: 'bank_transfer', revenue: 0 }
        ];
      }
      
      // Calculate date range based on period
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'week') {
        // Set to beginning of current week (Sunday)
        const day = now.getDay(); // 0 = Sunday
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'year') {
        // Set to beginning of current year
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
      } else {
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      // Format dates for SQLite query
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for current month grouped by payment method
      const paymentData = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .select(
          'payment_method as method',
          db.raw('SUM(total_amount) as revenue'),
          db.raw('COUNT(*) as count')
        )
        .groupBy('payment_method');
      
      if (paymentData.length === 0) {
        return [];
      }
      
      // Format data - ensure method property exists
      const formattedData = paymentData.map(item => ({
        method: item.method || 'unknown',
        revenue: parseFloat(item.revenue) || 0,
        count: parseInt(item.count) || 0
      }));
      
      // Sort by revenue (highest first)
      return formattedData.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error in getRevenueByPaymentMethod:', error);
      // Return empty array instead of throwing
      return [];
    }
  }
  
  // Get profit and revenue trend for past months
  async getProfitAndRevenueTrend(months = 6) {
    try {
      // Get database connection once
      const db = await this.getDb();
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        console.log('Required tables do not exist, returning empty trend data');
        // Return empty month data with zero values
        const now = new Date();
        const monthsData = [];
        
        for (let i = months - 1; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          // Use our safe formatter instead of direct toLocaleString
          const monthName = formatDateHelper(monthDate, { month: 'short' }, `Month-${i}`);
          monthsData.push({
            month: monthName,
            revenue: 0,
            profit: 0
          });
        }
        
        return monthsData;
      }
      
      // Get current date
      const now = new Date();
      
      // Generate data for the past N months
      const monthsData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        try {
          // Calculate month start and end dates
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
          
          // Format dates for SQLite - with validation
          let formattedStartDate, formattedEndDate;
          try {
            formattedStartDate = monthStart.toISOString();
            formattedEndDate = monthEnd.toISOString();
          } catch (error) {
            console.error("Error converting dates to ISO format:", error);
            continue;
          }
          
          // Get month name (e.g., "Jan") using safe formatter
          const monthName = formatDateHelper(monthStart, { month: 'short' }, `Month-${i}`);
          
          // Get all sales for this month
          const sales = await db(this.tableName)
            .where('created_at', '>=', formattedStartDate)
            .where('created_at', '<=', formattedEndDate)
            .where('is_returned', false)
            .select('id', 'total_amount');
          
          // Calculate revenue
          const revenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
          
          // If we have sales, calculate profit
          let profit = 0;
          
          if (sales.length > 0) {
            // Get sale IDs
            const saleIds = sales.map(sale => sale.id);
            
            // Get all sale items with historical cost information
            const db2 = await this.getDb();
            const saleItemsWithCost = await db2('sale_items')
              .whereIn('sale_items.sale_id', saleIds)
              .select(
                'sale_items.quantity',
                'sale_items.historical_cost_price'
              );
            
            // Calculate total cost using historical cost price
            const totalCost = saleItemsWithCost.reduce((sum, item) => {
              const cost = parseFloat(item.historical_cost_price) || 0;
              const quantity = parseInt(item.quantity) || 0;
              return sum + (cost * quantity);
            }, 0);
            
            profit = revenue - totalCost;
          }
          
          // Add month data
          monthsData.push({
            month: monthName,
            revenue: Math.round(revenue),
            profit: Math.round(profit)
          });
        } catch (error) {
          console.error(`Error processing month ${i}:`, error);
          // Continue to next month
          continue;
        }
      }
      
      return monthsData;
    } catch (error) {
      console.error('Error in getProfitAndRevenueTrend:', error);
      // Return empty array instead of throwing
      return [];
    }
  }
  
  // Get a setting by key
  async getByKey(key) {
    // Try case-sensitive lookup first
    const db = await this.getDb();
    let setting = await db(this.tableName).where({ key }).first();
    
    // If not found, try case-insensitive lookup
    if (!setting && typeof key === 'string') {
      setting = await db(this.tableName)
        .whereRaw('LOWER(key) = LOWER(?)', [key])
        .first();
    }
    
    return setting ? JSON.parse(setting.value) : null;
  }
  
  // Set a setting
  async set(key, value) {
    const db = await this.getDb();
    const storedValue = JSON.stringify(value);
    
    // Check if the setting exists
    const exists = await this.getByKey(key);
    
    if (!exists) {
      // Insert new setting
      await db(this.tableName).insert({
        key,
        value: storedValue,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      // Update existing setting
      await db(this.tableName)
        .where({ key })
        .update({
          value: storedValue,
          updated_at: new Date().toISOString()
        });
    }
    
    return value;
  }
}

// Settings model
class Setting extends BaseModel {
  constructor() {
    super('settings');
  }
  
  // Get setting by key
  async getByKey(key) {
    // Try case-sensitive lookup first
    const db = await this.getDb();
    let setting = await db(this.tableName).where({ key }).first();
    
    // If not found, try case-insensitive lookup
    if (!setting && typeof key === 'string') {
      setting = await db(this.tableName)
        .whereRaw('LOWER(key) = LOWER(?)', [key])
        .first();
    }
    
    if (!setting) {
      return null;
    }
    
    // Convert value based on type
    switch (setting.type) {
      case 'number':
        setting.value = Number(setting.value);
        break;
      case 'boolean':
        setting.value = setting.value === 'true';
        break;
      case 'json':
        try {
          setting.value = JSON.parse(setting.value);
        } catch (error) {
          console.error(`Error parsing JSON setting ${key}:`, error);
        }
        break;
    }
    
    return setting;
  }
  
  // Create a new setting
  async createSetting(key, value, type = 'string', description = '') {
    // Convert value based on type
    let storedValue = value;
    
    if (type === 'json' && typeof value !== 'string') {
      storedValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      storedValue = value.toString();
    }
    
    const db = await this.getDb();
    await db(this.tableName).insert({
      key,
      value: storedValue,
      type,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return this.getByKey(key);
  }
  
  // Update setting by key
  async updateByKey(key, value) {
    const setting = await this.getByKey(key);
    
    if (!setting) {
      throw new Error(`Setting with key ${key} not found`);
    }
    
    // Convert value based on type
    let storedValue = value;
    
    if (setting.type === 'json' && typeof value !== 'string') {
      storedValue = JSON.stringify(value);
    } else if (setting.type === 'boolean') {
      storedValue = value.toString();
    }
    
    const db = await this.getDb();
    await db(this.tableName)
      .where({ key })
      .update({
        value: storedValue,
        updated_at: new Date().toISOString()
      });
      
    return this.getByKey(key);
  }
  
  // Save setting safely (create if not exists, update if exists)
  async saveSettingSafely(key, value, type = 'string', description = '') {
    try {
      // Try looking up by the key first
      const setting = await this.getByKey(key);
      
      if (setting) {
        // Setting exists, update it - use the existing key to maintain case
        return await this.updateByKey(setting.key, value);
      } else {
        // Handle known key name normalization
        let normalizedKey = key;
        
        // Map common field names to their normalized form
        const keyMap = {
          'businessname': 'business_name',
          'businessName': 'business_name',
          'business_name': 'business_name',
          'address': 'business_address',
          'businessaddress': 'business_address',
          'businessAddress': 'business_address',
          'business_address': 'business_address',
          'phone': 'business_phone',
          'businessphone': 'business_phone',
          'businessPhone': 'business_phone',
          'business_phone': 'business_phone',
          'email': 'business_email',
          'businessemail': 'business_email',
          'businessEmail': 'business_email',
          'business_email': 'business_email',
          'taxid': 'tax_id',
          'taxId': 'tax_id',
          'tax_id': 'tax_id',
          'enabletax': 'enable_tax',
          'enableTax': 'enable_tax',
          'enable_tax': 'enable_tax',
          'taxrate': 'tax_rate',
          'taxRate': 'tax_rate',
          'tax_rate': 'tax_rate',
          'taxname': 'tax_name',
          'taxName': 'tax_name',
          'tax_name': 'tax_name',
          'receiptheader': 'receipt_header',
          'receiptHeader': 'receipt_header',
          'receipt_header': 'receipt_header',
          'receiptfooter': 'receipt_footer',
          'receiptFooter': 'receipt_footer',
          'receipt_footer': 'receipt_footer',
          'showlogo': 'show_logo',
          'showLogo': 'show_logo',
          'show_logo': 'show_logo',
          'showtaxdetails': 'show_tax_details',
          'showTaxDetails': 'show_tax_details',
          'show_tax_details': 'show_tax_details',
          'dateformat': 'date_format',
          'dateFormat': 'date_format',
          'date_format': 'date_format',
          'enablenotifications': 'enable_notifications',
          'enableNotifications': 'enable_notifications',
          'enable_notifications': 'enable_notifications'
        };
        
        if (keyMap[key.toLowerCase()]) {
          normalizedKey = keyMap[key.toLowerCase()];
        }
        
        // Setting doesn't exist, create it with normalized key
        return await this.createSetting(normalizedKey, value, type, description);
      }
    } catch (error) {
      console.error(`Error in saveSettingSafely for key ${key}:`, error);
      throw error;
    }
  }
  
  // Get all settings as an object
  async getAllAsObject() {
    const settings = await this.getAll();
    
    return settings.reduce((obj, setting) => {
      // Convert value based on type
      let value = setting.value;
      
      switch (setting.type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (error) {
            console.error(`Error parsing JSON setting ${setting.key}:`, error);
          }
          break;
      }
      
      obj[setting.key] = value;
      return obj;
    }, {});
  }
}

// Export all models
module.exports = {
  Product: new Product(),
  Category: new Category(),
  Supplier: new Supplier(),
  Sale: new Sale(),
  Setting: new Setting(),
};