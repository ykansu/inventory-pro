const dbManager = require('../database/dbManager');
const BaseModel = require('./BaseModel');

// Settings model
class Setting extends BaseModel {
  constructor() {
    super('settings');
  }

  /**
   * Get the current language setting from the database
   * @returns {Promise<string>} The current language code (e.g., 'en', 'tr')
   */
  static async getLanguage() {
    try {
      const db = await dbManager.getConnection(); // Use dbManager directly for static method
      const setting = await db('settings')
        .where('key', 'language')
        .first();
      
      return setting ? setting.value : 'en';
    } catch (error) {
      console.error('Error getting language setting:', error);
      return 'en'; // Default to English on error
    }
  }

  /**
   * Set the language in the database
   * @param {string} language - Language code to set (e.g., 'en', 'tr')
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  static async setLanguage(language) {
    try {
      const db = await dbManager.getConnection(); // Use dbManager directly for static method
      
      // Check if language setting exists
      const exists = await db('settings')
        .where('key', 'language')
        .first();
      
      if (exists) {
        // Update existing setting
        await db('settings')
          .where('key', 'language')
          .update({
            value: language,
            updated_at: new Date().toISOString()
          });
      } else {
        // Create new setting
        await db('settings').insert({
          key: 'language',
          value: language,
          type: 'string',
          description: 'Application language',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
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
    // Handle known key name normalization first
    let normalizedKey = key;
    const keyMap = {
      'businessname': 'business_name', 'businessName': 'business_name', 'business_name': 'business_name',
      'address': 'business_address', 'businessaddress': 'business_address', 'businessAddress': 'business_address', 'business_address': 'business_address',
      'phone': 'business_phone', 'businessphone': 'business_phone', 'businessPhone': 'business_phone', 'business_phone': 'business_phone',
      'email': 'business_email', 'businessemail': 'business_email', 'businessEmail': 'business_email', 'business_email': 'business_email',
      'taxid': 'tax_id', 'taxId': 'tax_id', 'tax_id': 'tax_id',
      'enabletax': 'enable_tax', 'enableTax': 'enable_tax', 'enable_tax': 'enable_tax',
      'taxrate': 'tax_rate', 'taxRate': 'tax_rate', 'tax_rate': 'tax_rate',
      'taxname': 'tax_name', 'taxName': 'tax_name', 'tax_name': 'tax_name',
      'receiptheader': 'receipt_header', 'receiptHeader': 'receipt_header', 'receipt_header': 'receipt_header',
      'receiptfooter': 'receipt_footer', 'receiptFooter': 'receipt_footer', 'receipt_footer': 'receipt_footer',
      'showlogo': 'show_logo', 'showLogo': 'show_logo', 'show_logo': 'show_logo',
      'showtaxdetails': 'show_tax_details', 'showTaxDetails': 'show_tax_details', 'show_tax_details': 'show_tax_details',
      'dateformat': 'date_format', 'dateFormat': 'date_format', 'date_format': 'date_format',
      'enablenotifications': 'enable_notifications', 'enableNotifications': 'enable_notifications', 'enable_notifications': 'enable_notifications'
    };
    if (keyMap[key.toLowerCase()]) {
      normalizedKey = keyMap[key.toLowerCase()];
    }

    // Convert value based on type
    let storedValue = value;
    if (type === 'json' && typeof value !== 'string') {
      storedValue = JSON.stringify(value);
    } else if (type === 'boolean') {
      storedValue = value.toString();
    }

    const db = await this.getDb();
    const now = new Date().toISOString();

    // Use Knex's UPSERT capability (INSERT ON CONFLICT UPDATE)
    try {
      console.log(`[saveSettingSafely] Attempting UPSERT for key: '${normalizedKey}', value: '${storedValue}', type: '${type}'`);
      await db(this.tableName)
        .insert({
          key: normalizedKey,
          value: storedValue,
          type,
          description: description || `Default ${normalizedKey} setting`,
          created_at: now,
          updated_at: now
        })
        .onConflict('key') // Specify the conflict target column (PRIMARY KEY)
        .merge({ // Specify columns to update on conflict
          value: storedValue,
          // Optionally update description if provided?
          // description: description, 
          updated_at: now
        });

      console.log(`Setting '${normalizedKey}' saved successfully (inserted or updated).`);
      return this.getByKey(normalizedKey); // Return the saved setting
    } catch (error) {
      console.error(`Error saving setting ${normalizedKey}:`, error);
      throw error; // Rethrow unexpected errors
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

module.exports = Setting; 