import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingService } from '../services/DatabaseService';
import { useDatabase } from './DatabaseContext';

// Create the context
const SettingsContext = createContext(null);

// Settings provider component
export const SettingsProvider = ({ children }) => {
  const { isLoading: dbLoading } = useDatabase();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all settings when the database is ready
  useEffect(() => {
    const loadAllSettings = async () => {
      if (dbLoading) return;
      
      try {
        setIsLoading(true);
        const allSettings = await SettingService.getAllSettings();
        
        if (!allSettings || Object.keys(allSettings).length === 0) {
          console.warn('No settings found in SettingsContext');
          setSettings({});
        } else {
          setSettings(allSettings);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load settings in SettingsContext:', err);
        setError('Failed to load application settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllSettings();
  }, [dbLoading]);

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
  const saveSetting = async (key, value, type = 'string', description = '') => {
    try {
      await SettingService.saveSettingSafely(key, value, type, description);
      
      // Reload all settings to ensure consistency
      const refreshedSettings = await SettingService.getAllSettings();
      setSettings(refreshedSettings);
      
      return true;
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err);
      return false;
    }
  };

  // Reset settings to defaults and reload
  const resetSettings = async () => {
    try {
      // Using the existing resetAndReloadSettings from DatabaseService
      await SettingService.resetSettings();
      
      // Reload settings
      const refreshedSettings = await SettingService.getAllSettings();
      setSettings(refreshedSettings);
      
      return true;
    } catch (err) {
      console.error('Failed to reset settings:', err);
      return false;
    }
  };

  // Get a specific setting with default fallback
  const getSetting = (key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  // Context value
  const value = {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting,
    saveSetting,
    resetSettings,
    // Common settings getters
    getBusinessName: () => getSetting('business_name', 'Inventory Pro Store'),
    getBusinessAddress: () => getSetting('business_address', ''),
    getBusinessPhone: () => getSetting('business_phone', ''),
    getBusinessEmail: () => getSetting('business_email', ''),
    getCurrency: () => getSetting('currency', 'usd').toLowerCase(),
    getDateFormat: () => getSetting('date_format', 'mm/dd/yyyy'),
    getReceiptHeader: () => getSetting('receipt_header', ''),
    getReceiptFooter: () => getSetting('receipt_footer', 'Thank you for your purchase!'),
    getLanguage: () => getSetting('language', 'en'),
    getNotificationsEnabled: () => getSetting('enable_notifications', false),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === null) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 