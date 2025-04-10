import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ProductService, 
  CategoryService, 
  SupplierService, 
  SaleService, 
  SettingService, 
  DatabaseManagementService,
  DashboardService
} from '../services/DatabaseService';

// Create the context
const DatabaseContext = createContext(null);

// Database provider component
export const DatabaseProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({});

  // Load application settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const appSettings = await SettingService.getAllSettings();
        
        // If no settings were loaded, initialize with defaults
        if (!appSettings || Object.keys(appSettings).length === 0) {
          console.warn('No settings found, initializing defaults');
          await initializeDefaultSettings();
          // Reload settings after initialization
          const defaults = await SettingService.getAllSettings();
          setSettings(defaults);
        } else {
          setSettings(appSettings);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load application settings. Please check the database connection.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);
  
  // Initialize default settings
  const initializeDefaultSettings = async () => {
    const defaults = {
      'business_name': 'Inventory Pro Store',
      'business_address': 'Istanbul, Turkey',
      'business_phone': '+90 123 456 7890',
      'business_email': 'contact@inventorypro.com',
      'currency': 'usd',
      'tax_rate': 18,
      'receipt_footer': 'Thank you for your purchase!',
      'date_format': 'mm/dd/yyyy',
      'time_format': '24',
      'enable_notifications': false,
      'language': 'en'
    };

    console.log('Initializing default settings...');
    
    try {
      for (const [key, value] of Object.entries(defaults)) {
        const type = typeof value === 'number' ? 'number' : 
                    typeof value === 'boolean' ? 'boolean' : 'string';
        
        await SettingService.saveSettingSafely(
          key, 
          value, 
          type, 
          `Default ${key} setting`
        );
      }
      
      console.log('Default settings initialized successfully.');
      return defaults;
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
      throw error;
    }
  };

  // Manually reset and reload settings
  const resetAndReloadSettings = async () => {
    try {
      setIsLoading(true);
      await initializeDefaultSettings();
      const refreshedSettings = await SettingService.getAllSettings();
      console.log('Settings reset and reloaded:', refreshedSettings);
      setSettings(refreshedSettings);
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a setting
  const updateSetting = async (key, value) => {
    try {
      await SettingService.updateSetting(key, value);
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: value
      }));
      return true;
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
      return false;
    }
  };
  
  // Create or update a setting safely
  const saveSettingSafely = async (key, value, type = 'string', description = '') => {
    try {
      // Normalize the key to snake_case for database consistency
      let normalizedKey = key;
      
      // Map common field names to their normalized form - should match model's mapping
      const keyMap = {
        // Business settings
        'businessname': 'business_name',
        'businessName': 'business_name',
        'address': 'business_address',
        'phone': 'business_phone',
        'email': 'business_email',
        'taxId': 'tax_id',
        
        // Receipt settings
        'receiptHeader': 'receipt_header',
        'showLogo': 'show_logo',
        
        // General settings
        'dateFormat': 'date_format',
        'enableNotifications': 'enable_notifications'
      };
      
      if (keyMap[key]) {
        normalizedKey = keyMap[key];
      }
      
      const result = await SettingService.saveSettingSafely(key, value, type, description);
      
      // Immediate update to context state to ensure UI is responsive
      setSettings(prevSettings => {
        const updatedSettings = {
          ...prevSettings,
          [normalizedKey]: value,
          [key]: value  // Store with both keys to handle both formats
        };
        return updatedSettings;
      });
      
      try {
        // Reload all settings to ensure consistency
        const refreshedSettings = await SettingService.getAllSettings();
        
        // Make sure to keep refreshedSettings synchronized with the normalizedKey for UI consistency
        if (refreshedSettings && !refreshedSettings[normalizedKey] && refreshedSettings[key]) {
          refreshedSettings[normalizedKey] = refreshedSettings[key];
        }
        
        setSettings(refreshedSettings);
      } catch (reloadError) {
        console.error('Failed to reload settings after save:', reloadError);
      }
      
      return true;
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err);
      return false;
    }
  };

  // Context value
  const value = {
    isLoading,
    error,
    settings,
    updateSetting,
    saveSettingSafely,
    initializeDefaultSettings,
    resetAndReloadSettings,
    // Expose all services
    products: ProductService,
    categories: CategoryService,
    suppliers: SupplierService,
    sales: SaleService,
    settings: SettingService,
    database: DatabaseManagementService,
    dashboard: DashboardService
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Custom hook to use the database context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === null) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
