import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useDatabase } from '../context/DatabaseContext';

/**
 * Custom hook to simplify using translations in components
 * @param {string[]} namespaces - Array of namespaces to load
 * @returns {object} - Object containing translation functions and language utilities
 */
export const useTranslation = (namespaces = ['common']) => {
  const { t, i18n } = useI18nTranslation(namespaces);
  
  // Try to use database context, but don't fail if it's not available
  let databaseContext = {};
  try {
    databaseContext = useDatabase() || {};
  } catch (error) {
    // Suppress error when used outside DatabaseProvider
    console.debug('useDatabase not available - some translation features may be limited');
  }
  
  const { updateSetting, saveSettingSafely } = databaseContext;

  /**
   * Change the application language
   * @param {string} language - Language code to change to
   */
  const changeLanguage = async (language) => {
    // Change the language in i18n
    i18n.changeLanguage(language);
    
    // Save to database using direct API when available
    if (window.database && window.database.setLanguage) {
      try {
        await window.database.setLanguage(language);
      } catch (error) {
        console.error('Failed to save language setting using direct API:', error);
        
        // Fall back to database context if available
        if (saveSettingSafely) {
          try {
            await saveSettingSafely('language', language, 'string', 'Application language');
          } catch (backupError) {
            console.error('Failed to save language setting to database:', backupError);
          }
        }
      }
    } else if (saveSettingSafely) {
      // Use database context if direct API not available
      try {
        await saveSettingSafely('language', language, 'string', 'Application language');
      } catch (error) {
        console.error('Failed to save language setting to database:', error);
      }
    }
  };

  /**
   * Get the list of available languages
   * @returns {string[]} - Array of available language codes
   */
  const getAvailableLanguages = () => {
    return ['en', 'tr']; // Add more languages as they become available
  };

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage,
    getAvailableLanguages
  };
};

export default useTranslation;
