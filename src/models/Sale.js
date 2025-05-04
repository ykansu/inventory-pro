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
  getDay,
  addDays,
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
      const db = await this.getDb();
  
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
  
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
  
      // Prepare cost subquery
      const costSubquery = db('sale_items')
        .select('sale_id')
        .sum({
          total_cost: db.raw('COALESCE(historical_cost_price * quantity, 0)')
        })
        .groupBy('sale_id')
        .as('costs');
  
      const result = await db
        .from(`${this.tableName} as sales`)
        .leftJoin(costSubquery, 'sales.id', 'costs.sale_id')
        .where('sales.created_at', '>=', formattedStartDate)
        .andWhere('sales.created_at', '<=', formattedEndDate)
        .andWhere('sales.is_returned', false)
        .select(
          db.raw('SUM(COALESCE(sales.total_amount, 0)) AS total_revenue'),
          db.raw('SUM(COALESCE(costs.total_cost, 0)) AS total_cost')
        )
        .first();
  
      const monthlyRevenue = parseFloat(result.total_revenue || 0);
      const monthlyCost = parseFloat(result.total_cost || 0);
      const monthlyProfit = monthlyRevenue - monthlyCost;
      const profitMargin = monthlyRevenue > 0
        ? (monthlyProfit / monthlyRevenue) * 100
        : 0;
  
      return {
        monthlyRevenue: (monthlyRevenue),
        monthlyProfit: (monthlyProfit),
        profitMargin:((profitMargin * 10) / 10).toFixed(1) // 1 decimal place
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
  async getTopSellingProducts(period = 'month', limit = 5, sortBy = 'quantity', customStartDate = null, customEndDate = null) {
    try {
      // Get database connection
      const db = await this.getDb();
      
      // Ensure limit is a number
      const numericLimit = parseInt(limit, 10) || 5;

      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;

      // Assume week starts on Sunday (0)
      const weekStartsOn = 0; 
            
      // If custom dates are provided and period is 'custom', use those
      if (period === 'custom' && customStartDate && customEndDate) {
        try {
          startDate = startOfDay(new Date(customStartDate));
          endDate = endOfDay(new Date(customEndDate));
          
          // Check if dates are valid
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid date range for custom period, falling back to current month');
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
          }
        } catch (err) {
          console.error('Error parsing custom date range:', err);
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        }
      } else if (period === 'week') {
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
  async getRevenueAndProfitBySupplier(period = 'month', customStartDate = null, customEndDate = null) {
    try {
      const db = await this.getDb();
      
      // Calculate date range based on period using date-fns
      const now = new Date();
      let startDate, endDate;
      const weekStartsOn = 0; // Assume week starts on Sunday (0)
            
      if (period === 'custom' && customStartDate && customEndDate) {
        try {
          // Use custom date range if provided
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
          }
        } catch (err) {
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        }
      } else if (period === 'week') {
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
      
      // Single query joining all tables and filtering by date range
      const supplierData = await db('sales')
        .join('sale_items', 'sales.id', 'sale_items.sale_id')
        .join('products', 'sale_items.product_id', 'products.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .where('sales.created_at', '>=', formattedStartDate)
        .where('sales.created_at', '<=', formattedEndDate)
        .where('sales.is_returned', false)
        .select(
          'suppliers.id as supplier_id',
          'suppliers.company_name as name',
          db.raw('SUM(sale_items.total_price) as revenue'),
          db.raw('SUM(sale_items.historical_cost_price * sale_items.quantity) as cost')
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
  async getRevenueByPaymentMethod(startDate, endDate) {
    try {
      const db = await this.getDb();
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required');
      }
      const formattedStartDate = new Date(startDate).toISOString();
      const formattedEndDate = new Date(endDate).toISOString();
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
        return [
          { method: 'cash', revenue: 0, card_amount: 0, count: 0 },
          { method: 'card', revenue: 0, card_amount: 0, count: 0 },
        ];
      }
      const formattedData = paymentData.map(item => ({
        method: item.method || 'unknown',
        revenue: parseFloat(item.revenue) || 0,
        card_amount: parseFloat(item.card_amount) || 0,
        count: parseInt(item.count) || 0
      }));
      return formattedData.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error in getRevenueByPaymentMethod:', error);
      return [];
    }
  }

  // Get profit and revenue trend
  async getProfitAndRevenueTrend(months = 6) {
    try {
      const db = await this.getDb();
  
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      const hasSaleItemsTable = await db.schema.hasTable('sale_items');
  
      if (!hasSalesTable || !hasSaleItemsTable) {
        const now = new Date();
        return Array.from({ length: months }, (_, i) => {
          const monthDate = subMonths(now, months - i - 1);
          return {
            month: format(monthDate, 'MMM'),
            revenue: 0,
            profit: 0,
          };
        });
      }
  
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, months - 1));
      const formattedStartDate = startDate.toISOString();
  
      // Subquery to get cost per sale
      const costSubquery = db('sale_items')
        .select('sale_id')
        .sum({
          total_cost: db.raw('COALESCE(historical_cost_price * quantity, 0)')
        })
        .groupBy('sale_id')
        .as('costs');

  
      // Main query: sales joined with aggregated costs
      const rows = await db
        .from(`${this.tableName} as sales`)
        .leftJoin(costSubquery, 'sales.id', 'costs.sale_id')
        .where('sales.created_at', '>=', formattedStartDate)
        .andWhere('sales.is_returned', false)
        .select(
          db.raw(`strftime('%Y-%m', sales.created_at, 'localtime') as month_key`),
          db.raw(`sum(COALESCE(sales.total_amount, 0)) as total_revenue`),
          db.raw(`sum(COALESCE(costs.total_cost, 0)) as total_cost`)
        )
        .groupBy('month_key');
  
      // Map and format data
      const dataByMonthKey = {};
      rows.forEach(row => {
        const monthDate = new Date(row.month_key + '-01');
        const monthName = format(monthDate, 'MMM');
        const revenue = parseFloat(row.total_revenue || 0);
        const cost = parseFloat(row.total_cost || 0);
        dataByMonthKey[row.month_key] = {
          month: monthName,
          revenue: Math.round(revenue),
          profit: Math.round(revenue - cost),
        };
      });
  
      // Ensure all months are present
      const result = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        result.push(
          dataByMonthKey[monthKey] || {
            month: format(monthDate, 'MMM'),
            revenue: 0,
            profit: 0,
          }
        );
      }
  
      return result;
  
    } catch (error) {
      console.error('Error in getProfitAndRevenueTrend:', error);
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

  /**
   * Get average sale count and average revenue by day of the week for a given period.
   * @param {string} period - 'week', 'month', or 'year'
   * @returns {Promise<Array<{day: string, averageSaleCount: number, averageRevenue: number}>>}
   */
  async getAverageSalesByDayOfWeek(period = 'month') {
    try {
      const db = await this.getDb();
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      if (!hasSalesTable) {
        // Return zeros for all days if table does not exist
        return [
          { day: 'Monday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Tuesday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Wednesday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Thursday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Friday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Saturday', averageSaleCount: 0, averageRevenue: 0 },
          { day: 'Sunday', averageSaleCount: 0, averageRevenue: 0 },
        ];
      }

      // Calculate date range
      const now = new Date();
      let startDate, endDate;
      const weekStartsOn = 1; // Monday
      
      if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn });
        endDate = endOfWeek(now, { weekStartsOn });
      } else if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      // First, get the count of each day in the period
      const dayCounts = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Initialize day counts
      for (let i = 0; i < 7; i++) {
        dayCounts[i] = 0;
      }

      // Count actual occurrences of each day in the period
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
        dayCounts[dayOfWeek]++;
        currentDate = addDays(currentDate, 1);
      }

      // Query sales grouped by day of week
      const sales = await db(this.tableName)
        .where('created_at', '>=', startDate.toISOString())
        .where('created_at', '<=', endDate.toISOString())
        .where('is_returned', false)
        .select(
          db.raw("strftime('%w', datetime(created_at, 'localtime')) as dayOfWeek"),
          db.raw('COUNT(*) as saleCount'),
          db.raw('SUM(total_amount) as totalRevenue')
        )
        .groupBy('dayOfWeek');

      // Prepare result array
      const result = Array(7).fill(0).map((_, i) => ({
        day: dayNames[i],
        averageSaleCount: 0,
        averageRevenue: 0,
      }));

      // Calculate averages based on actual day occurrences
      for (const row of sales) {
        const idx = parseInt(row.dayOfWeek, 10);
        const dayOccurrences = dayCounts[idx] || 1; // Avoid division by zero
        
        if (row.saleCount) {
          result[idx].averageSaleCount = dayOccurrences > 0 
            ? Math.round((row.saleCount / dayOccurrences) * 100) / 100 
            : 0;
        }
        
        if (row.totalRevenue) {
          result[idx].averageRevenue = dayOccurrences > 0
            ? Math.round((row.totalRevenue / dayOccurrences) * 100) / 100
            : 0;
        }
      }

      // Reorder so Monday is first
      return [result[1], result[2], result[3], result[4], result[5], result[6], result[0]];
    } catch (error) {
      console.error('Error in getAverageSalesByDayOfWeek:', error);
      return [
        { day: 'Monday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Tuesday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Wednesday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Thursday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Friday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Saturday', averageSaleCount: 0, averageRevenue: 0 },
        { day: 'Sunday', averageSaleCount: 0, averageRevenue: 0 },
      ];
    }
  }

  /**
   * Get average sale count and average revenue by month of the given year.
   * @param {number} year - The year (e.g. 2024)
   * @returns {Promise<Array<{month: number, averageSaleCount: number, averageRevenue: number}>>}
   */
  async getAverageSalesByMonthOfYear(year) {
    try {
      const db = await this.getDb();
      const hasSalesTable = await db.schema.hasTable(this.tableName);
      if (!hasSalesTable) {
        // Return zeros for all months if table does not exist
        return Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          averageSaleCount: 0,
          averageRevenue: 0,
        }));
      }
      // Calculate date range for the year
      const startDate = new Date(year, 0, 1);
      const endDate = endOfYear(new Date(year, 0, 1));
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      // Query sales grouped by month using localtime
      const sales = await db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .select(
          db.raw("CAST(strftime('%m', datetime(created_at, 'localtime')) AS INTEGER) as month"),
          db.raw('COUNT(*) as saleCount'),
          db.raw('SUM(total_amount) as totalRevenue')
        )
        .groupBy('month');
      // Map sales data to months
      const result = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        averageSaleCount: 0,
        averageRevenue: 0,
      }));
      for (const row of sales) {
        const idx = (row.month || 1) - 1;
        result[idx].averageSaleCount = row.saleCount ? Math.round(row.saleCount * 100) / 100 : 0;
        result[idx].averageRevenue = row.totalRevenue ? Math.round(row.totalRevenue * 100) / 100 : 0;
      }
      return result;
    } catch (error) {
      console.error('Error in getAverageSalesByMonthOfYear:', error);
      return Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        averageSaleCount: 0,
        averageRevenue: 0,
      }));
    }
  }
}

module.exports = Sale; 