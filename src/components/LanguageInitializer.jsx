import React, { useEffect, useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useTranslation } from '../hooks/useTranslation';

/**
 * This component initializes the application language from the database settings
 * It should be rendered early in the component tree, after DatabaseProvider
 */
const LanguageInitializer = ({ children }) => {
  const { i18n } = useTranslation();
  const [initialized, setInitialized] = useState(false);
  
  // Try to use database context, but don't fail if it's not available
  let databaseContext = {};
  try {
    databaseContext = useDatabase() || {};
  } catch (error) {
    console.debug('useDatabase not available in LanguageInitializer');
  }
  
  const { settings, isLoading } = databaseContext;
  
  // Initialize language from database settings
  useEffect(() => {
    const loadLanguage = async () => {
      if (initialized) return;
      
      try {
        // Try to load from direct API first
        if (window.database && window.database.getLanguage) {
          const dbLanguage = await window.database.getLanguage();
          if (dbLanguage && i18n.language !== dbLanguage) {
            console.log(`Initializing language from database API: ${dbLanguage}`);
            i18n.changeLanguage(dbLanguage);
            setInitialized(true);
            return;
          }
        }
        
        // Fall back to context settings
        if (!isLoading && settings && settings.language) {
          console.log(`Initializing language from context settings: ${settings.language}`);
          i18n.changeLanguage(settings.language);
          setInitialized(true);
          return;
        }
        
        // If all else fails, keep the default language from i18n.js
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setInitialized(true); // Avoid retrying on error
      }
    };
    
    loadLanguage();
  }, [isLoading, settings, i18n, initialized]);
  
  // This component doesn't render anything on its own
  return <>{children}</>;
};

export default LanguageInitializer; 