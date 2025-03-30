const db = require('../database/connection');

// Base model with common CRUD operations
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
  }
  
  // Get all records
  async getAll() {
    return this.db(this.tableName).select('*');
  }
  
  // Get record by ID
  async getById(id) {
    return this.db(this.tableName).where({ id }).first();
  }
  
  // Create a new record
  async create(data) {
    const [id] = await this.db(this.tableName).insert(data);
    return this.getById(id);
  }
  
  // Update a record
  async update(id, data) {
    await this.db(this.tableName).where({ id }).update(data);
    return this.getById(id);
  }
  
  // Delete a record
  async delete(id) {
    return this.db(this.tableName).where({ id }).del();
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
      // Get all products with joins
      return await this.db(this.tableName)
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
    return this.db(this.tableName).where({ barcode }).first();
  }
  
  // Get products with low stock
  async getLowStock() {
    return this.db(this.tableName)
      .whereRaw('stock_quantity <= min_stock_threshold')
      .select('*');
  }
  
  // Update stock quantity
  async updateStock(id, quantity, adjustmentType, reason, reference) {
    // Start a transaction
    return this.db.transaction(async trx => {
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
}

// Category model
class Category extends BaseModel {
  constructor() {
    super('categories');
  }
  
  // Get category with product count
  async getAllWithProductCount() {
    return this.db(this.tableName)
      .select(
        'categories.*',
        this.db.raw('COUNT(products.id) as product_count')
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
    return this.db(this.tableName)
      .select(
        'suppliers.*',
        this.db.raw('COUNT(products.id) as product_count')
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
    return this.db.transaction(async trx => {
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
        
        // Prepare the items with sale_id
        const saleItems = items.map(item => ({
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
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
      const sale = await this.db(this.tableName).where({ id }).first();
      
      if (!sale) {
        return null;
      }
      
      const items = await this.db('sale_items')
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

      console.log('Formatted start date:', formattedStartDate);
      console.log('Formatted end date:', formattedEndDate);
      
      // Query sales directly with date filtering in SQLite
      const query = this.db(this.tableName)
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
      const salesWithItemCounts = await this.db(this.tableName)
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
      
      // Get all sales for current month
      const sales = await this.db(this.tableName)
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
      
      // Get all sale items with product details to calculate cost
      const saleItemsWithCost = await this.db('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .whereIn('sale_items.sale_id', saleIds)
        .select(
          'sale_items.quantity',
          'sale_items.unit_price',
          'sale_items.total_price',
          'products.cost_price'
        );
      
      // Calculate total cost and profit
      let totalCost = 0;
      
      saleItemsWithCost.forEach(item => {
        totalCost += parseFloat(item.cost_price) * parseInt(item.quantity);
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
      throw error;
    }
  }
  
  // Get profit by category for the current month
  async getCategoryProfits() {
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
      
      // Get all sales for current month
      const salesIds = await this.db(this.tableName)
        .where('created_at', '>=', formattedStartDate)
        .where('created_at', '<=', formattedEndDate)
        .where('is_returned', false)
        .pluck('id');
      
      if (salesIds.length === 0) {
        return [];
      }
      
      // Get all sale items with category and cost information
      const categoryProfits = await this.db('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .leftJoin('categories', 'products.category_id', 'categories.id')
        .whereIn('sale_items.sale_id', salesIds)
        .select(
          'categories.id as category_id',
          'categories.name as name',
          this.db.raw('SUM(sale_items.total_price) as revenue'),
          this.db.raw('SUM(products.cost_price * sale_items.quantity) as cost')
        )
        .groupBy('categories.id', 'categories.name');
      
      // Calculate profit and margin for each category
      const categoriesWithProfit = categoryProfits.map(category => {
        const revenue = parseFloat(category.revenue) || 0;
        const cost = parseFloat(category.cost) || 0;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
        return {
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
      console.error('Error in getCategoryProfits:', error);
      throw error;
    }
  }
  
  // Get profit value trend for the last 6 months
  async getProfitValueTrend() {
    try {
      // Get current date
      const now = new Date();
      
      // Generate the last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: month.toLocaleString('default', { month: 'short' }),
          year: month.getFullYear(),
          monthNum: month.getMonth(), // 0-indexed
          startDate: new Date(month.getFullYear(), month.getMonth(), 1),
          endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
        });
      }
      
      // Initialize result array
      const trendData = [];
      
      // Process each month
      for (const monthData of months) {
        // Format dates for SQLite
        const formattedStartDate = monthData.startDate.toISOString();
        const formattedEndDate = monthData.endDate.toISOString();
        
        // Get all sales for this month
        const sales = await this.db(this.tableName)
          .where('created_at', '>=', formattedStartDate)
          .where('created_at', '<=', formattedEndDate)
          .where('is_returned', false)
          .select('id', 'total_amount');
        
        if (sales.length === 0) {
          trendData.push({
            month: monthData.month,
            value: 0
          });
          continue;
        }
        
        // Get sale IDs
        const saleIds = sales.map(sale => sale.id);
        
        // Calculate monthly revenue
        const monthlyRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
        
        // Get all sale items with product details to calculate cost
        const saleItemsWithCost = await this.db('sale_items')
          .join('products', 'sale_items.product_id', 'products.id')
          .whereIn('sale_items.sale_id', saleIds)
          .select(
            'sale_items.quantity',
            'products.cost_price'
          );
        
        // Calculate total cost and profit
        let totalCost = 0;
        
        saleItemsWithCost.forEach(item => {
          totalCost += parseFloat(item.cost_price) * parseInt(item.quantity);
        });
        
        const monthlyProfit = monthlyRevenue - totalCost;
        
        trendData.push({
          month: monthData.month,
          value: Math.round(monthlyProfit)
        });
      }
      
      return trendData;
    } catch (error) {
      console.error('Error in getProfitValueTrend:', error);
      throw error;
    }
  }
  
  // Process a return/refund
  async processReturn(id, returnData, itemsToReturn) {
    return this.db.transaction(async trx => {
      try {
        // Update the sale as returned
        await trx(this.tableName)
          .where({ id })
          .update({
            is_returned: true,
            notes: returnData.notes,
            updated_at: new Date()
          });
        
        // Update product stock for each returned item
        for (const item of itemsToReturn) {
          await trx('products')
            .where({ id: item.product_id })
            .increment('stock_quantity', item.quantity);
            
          // Record stock adjustment
          await trx('stock_adjustments').insert({
            product_id: item.product_id,
            quantity_change: item.quantity,
            adjustment_type: 'return',
            reason: returnData.reason,
            reference: `Return-${id}`,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        // Get the updated sale
        const sale = await trx(this.tableName).where({ id }).first();
        
        // Get the sale items
        const items = await trx('sale_items').where({ sale_id: id }).select('*');
        
        // Return the complete sale with items
        return {
          ...sale,
          items
        };
      } catch (error) {
        console.error(`Error in processReturn for sale ${id}:`, error);
        throw error;
      }
    });
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
    let setting = await this.db(this.tableName).where({ key }).first();
    
    // If not found, try case-insensitive lookup
    if (!setting && typeof key === 'string') {
      setting = await this.db(this.tableName)
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
    
    await this.db(this.tableName).insert({
      key,
      value: storedValue,
      type,
      description,
      created_at: new Date(),
      updated_at: new Date()
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
    
    await this.db(this.tableName)
      .where({ key })
      .update({
        value: storedValue,
        updated_at: new Date()
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