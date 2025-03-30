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
        // Insert the sale
        const [saleId] = await trx(this.tableName).insert(saleData);
        
        // Prepare the items with sale_id
        const saleItems = items.map(item => ({
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          total_price: item.total_price,
          created_at: new Date(),
          updated_at: new Date()
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
            reference: saleData.receipt_number,
            created_at: new Date(),
            updated_at: new Date()
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
    return this.db(this.tableName)
      .whereBetween('created_at', [startDate, endDate])
      .select('*');
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
    const setting = await this.db(this.tableName).where({ key }).first();
    
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