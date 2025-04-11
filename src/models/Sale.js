const BaseModel = require('./BaseModel');
const dbManager = require('../database/dbManager');
const { 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear, 
  format, 
  parseISO, 
  setYear, 
  getYear, 
  getMonth, 
  getDay 
} = require('date-fns');

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

// Sale model
class Sale extends BaseModel {
  constructor() {
    super('sales');
  }
  
  // Get the database connection
  async getDb() {
    return dbManager.getConnection();
  }
  
  // Create a sale with items
  async createWithItems(saleData, items) {
    const db = await this.getDb();
    return db.transaction(async trx => {
      try {
        // Get current real date for proper storage
        const now = new Date();
        const nowISOString = now.toISOString(); // Use native method
        
        // Make a copy to avoid modifying the original object
        const formattedSaleData = {
          ...saleData
        };
        
        // Use ISO string format for dates if they exist, ensuring we use the current real year
        if (formattedSaleData.created_at) {
          const realYear = getYear(now);
          let createdAtDate = formattedSaleData.created_at;
          // Ensure it's a Date object before using setYear
          if (!(createdAtDate instanceof Date)) {
            try {
              createdAtDate = parseISO(createdAtDate); // Attempt to parse if string
            } catch (e) {
              console.warn('Could not parse created_at date:', formattedSaleData.created_at);
              createdAtDate = now; // Fallback to now if parsing fails
            }
          }
          // Check for valid date after potential parse
          if (!isNaN(createdAtDate.getTime())) {
            // Ensure setYear returns a Date object before calling toISOString
            formattedSaleData.created_at = setYear(createdAtDate, realYear).toISOString(); 
          } else {
             formattedSaleData.created_at = nowISOString; // Fallback if date is invalid
          }

        } else {
          formattedSaleData.created_at = nowISOString;
        }
        
        if (formattedSaleData.updated_at) {
          const realYear = getYear(now);
           let updatedAtDate = formattedSaleData.updated_at;
          // Ensure it's a Date object before using setYear
          if (!(updatedAtDate instanceof Date)) {
            try {
              updatedAtDate = parseISO(updatedAtDate); // Attempt to parse if string
            } catch (e) {
               console.warn('Could not parse updated_at date:', formattedSaleData.updated_at);
               updatedAtDate = now; // Fallback to now if parsing fails
            }
          }
           // Check for valid date after potential parse
          if (!isNaN(updatedAtDate.getTime())) {
             // Ensure setYear returns a Date object before calling toISOString
            formattedSaleData.updated_at = setYear(updatedAtDate, realYear).toISOString(); 
          } else {
             formattedSaleData.updated_at = nowISOString; // Fallback if date is invalid
          }
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
  
  // Cancel a sale completely
  async cancelSale(id) {
    const db = await this.getDb();
    return db.transaction(async trx => {
      try {
        // Get the sale with items
        const sale = await trx(this.tableName).where({ id }).first();
        if (!sale) {
          throw new Error(`Sale with id ${id} not found`);
        }

        // Check if already returned/canceled
        if (sale.is_returned) {
          throw new Error('This sale has already been returned or canceled');
        }

        // Get the sale items
        const saleItems = await trx('sale_items').where({ sale_id: id }).select('*');
        
        // Get current real date for proper storage
        const now = new Date();
        const nowISOString = now.toISOString(); // Use native method

        // Mark the sale as returned
        await trx(this.tableName)
          .where({ id })
          .update({
            is_returned: true,
            notes: sale.notes ? `${sale.notes} | CANCELED: ${nowISOString}` : `CANCELED: ${nowISOString}`,
            updated_at: nowISOString 
          });

        // Return items to inventory
        for (const item of saleItems) {
          // Increment product stock
          await trx('products')
            .where({ id: item.product_id })
            .increment('stock_quantity', item.quantity);
            
          // Record stock adjustment
          await trx('stock_adjustments').insert({
            product_id: item.product_id,
            quantity_change: item.quantity,
            adjustment_type: 'sale_cancel',
            reference: `CANCEL-${sale.receipt_number}`,
            reason: 'Sale canceled',
            created_at: nowISOString, 
            updated_at: nowISOString
          });
        }
        
        // Get the updated sale
        const updatedSale = await trx(this.tableName).where({ id }).first();
        
        // Return the complete updated sale with items
        return {
          ...updatedSale,
          items: saleItems
        };
      } catch (error) {
        console.error(`Error in cancelSale for id ${id}:`, error);
        throw error;
      }
    });
  }
  
  // Get sales by date range
  async getByDateRange(startDate, endDate) {
    try {
      // Use date-fns for robust parsing and formatting
      let parsedStartDate, parsedEndDate;
      try {
          // Assume input might be YYYY-MM-DD or full ISO string
          parsedStartDate = startDate ? startOfDay(parseISO(startDate)) : null;
      } catch (e) {
          console.warn("Invalid start date provided:", startDate);
          parsedStartDate = null; // Handle invalid start date gracefully
      }
       try {
          parsedEndDate = endDate ? endOfDay(parseISO(endDate)) : null;
       } catch(e) {
           console.warn("Invalid end date provided:", endDate);
           parsedEndDate = null; // Handle invalid end date gracefully
       }

      // Format for SQLite query
      const formattedStartDate = parsedStartDate && !isNaN(parsedStartDate.getTime()) ? parsedStartDate.toISOString() : null;
      const formattedEndDate = parsedEndDate && !isNaN(parsedEndDate.getTime()) ? parsedEndDate.toISOString() : null;

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
      
      // Convert to ISO strings using date-fns
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

      // Use date-fns for start and end of the current month
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);
      
      // Format dates for SQLite query using date-fns
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
      
      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;
      
      // Assume week starts on Sunday (0)
      const weekStartsOn = 0; 
      
      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn });
        endDate = endOfWeek(now, { weekStartsOn });
      } else if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else { // Default to month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
      
      // Format dates for SQLite query using date-fns
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for the period
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
  async getTopSellingProducts(period = 'month', limit = 5, sortBy = 'quantity') {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Ensure limit is a number
      const numericLimit = parseInt(limit, 10) || 5;
      
      // Check if required tables exist
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
      
      if (!hasSalesTable || !hasSaleItemsTable) {
        return [];
      }
      
      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;

      // Assume week starts on Sunday (0)
      const weekStartsOn = 0; 
            
      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn });
        endDate = endOfWeek(now, { weekStartsOn });
      } else if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else { // Default to month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
      
      // Format dates for SQLite query using date-fns
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for the period
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
      
      // Determine how to sort results based on sortBy parameter
      let sortColumn = 'quantity_sold';
      if (sortBy === 'revenue') {
        sortColumn = 'revenue';
      } else if (sortBy === 'profit') {
        query = query.select(
          db2.raw('(SUM(sale_items.total_price) - SUM(sale_items.historical_cost_price * sale_items.quantity)) as profit')
        );
        sortColumn = 'profit';
      }
      
      // Add limit if specified
      if (numericLimit > 0) {
        query = query.orderBy(sortColumn, 'desc').limit(numericLimit);
      } else {
        query = query.orderBy(sortColumn, 'desc');
      }
      
      // Execute the query
      const topProducts = await query;
      
      // Calculate profit and margin for each product
      return topProducts.map(product => {
        const revenue = parseFloat(product.revenue) || 0;
        const cost = parseFloat(product.cost) || 0;
        const profit = product.profit ? parseFloat(product.profit) : (revenue - cost);
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
      
      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;

      // Assume week starts on Sunday (0)
      const weekStartsOn = 0; 
            
      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn });
        endDate = endOfWeek(now, { weekStartsOn });
      } else if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else { // Default to month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
      
      // Format dates for SQLite query using date-fns
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for the period
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
      
      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;

      // Assume week starts on Sunday (0)
      const weekStartsOn = 0; 
            
      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn });
        endDate = endOfWeek(now, { weekStartsOn });
      } else if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else { // Default to month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
      
      // Format dates for SQLite query using date-fns
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      // Get all sales for the period
      const paymentData = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .select(
          'payment_method as method',
          db.raw('SUM(total_amount) as revenue'),
          db.raw('SUM(card_amount) as card_amount'),
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
        card_amount: parseFloat(item.card_amount) || 0,
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
          // Calculate month start and end dates using date-fns
          const targetMonthDate = subMonths(now, i);
          const monthStart = startOfMonth(targetMonthDate);
          const monthEnd = endOfMonth(targetMonthDate);
          
          // Format dates for SQLite using date-fns
          let formattedStartDate, formattedEndDate;
          try {
            formattedStartDate = monthStart.toISOString();
            formattedEndDate = monthEnd.toISOString();
          } catch (error) {
            console.error("Error converting dates to ISO format:", error);
            continue; // Skip this month if formatting fails
          }
          
          // Get month name (e.g., "Jan") using date-fns format
          const monthName = format(monthStart, 'MMM'); 
          
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
  
  // Get sales by date range with pagination and filters
  async getPaginatedSales(startDate, endDate, page = 1, pageSize = 10, paymentMethod = '', searchQuery = '') {
    try {
      const db = await this.getDb();
      const offset = (page - 1) * pageSize;
      
      // Build base query with date range filtering
      let query = db(this.tableName)
        .where(function() {
          if (startDate && endDate) {
            this.whereBetween('created_at', [
              startOfDay(new Date(startDate)).toISOString(),
              endOfDay(new Date(endDate)).toISOString()
            ]);
          }
        })
        .orderBy('created_at', 'desc'); // Always sort newest first
      
      // Apply payment method filter if provided
      if (paymentMethod) {
        query = query.where('payment_method', paymentMethod);
      }
      
      // Apply search query on receipt number if provided
      if (searchQuery && searchQuery.trim() !== '') {
        query = query.where('receipt_number', 'like', `%${searchQuery}%`);
      }
      
      // Clone the query for the count
      const countQuery = query.clone().count('* as total');
      
      // Execute the count query
      const [countResult] = await countQuery;
      const totalCount = parseInt(countResult.total, 10);
      
      // Apply pagination to the main query
      query = query.limit(pageSize).offset(offset);
      
      // Execute the paginated query
      const sales = await query;
      
      // Calculate total pages
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // For each sale, fetch the items count (optimize performance compared to joining)
      for (let sale of sales) {
        const [itemCountResult] = await db('sale_items')
          .where({ sale_id: sale.id })
          .count('* as count');
        
        sale.item_count = parseInt(itemCountResult.count, 10);
      }
      
      return {
        success: true,
        sales,
        totalCount,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('Error getting paginated sales:', error);
      throw error;
    }
  }
}

module.exports = Sale; 