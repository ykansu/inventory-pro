import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ProductService, 
  CategoryService, 
  SupplierService, 
  SaleService, 
  SettingService, 
  DatabaseManagementService 
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
        setSettings(appSettings);
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

  // Context value
  const value = {
    isLoading,
    error,
    settings,
    updateSetting,
    // Expose all services
    products: ProductService,
    categories: CategoryService,
    suppliers: SupplierService,
    sales: SaleService,
    settings: SettingService,
    database: DatabaseManagementService
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
