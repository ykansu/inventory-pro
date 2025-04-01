const connection = require('../database/connection');

/**
 * Get the current language setting from the database
 * @returns {Promise<string>} The current language code (e.g., 'en', 'tr')
 */
async function getLanguage() {
  try {
    const db = await connection.getConnection();
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
async function setLanguage(language) {
  try {
    const db = await connection.getConnection();
    
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

module.exports = {
  getLanguage,
  setLanguage
}; 