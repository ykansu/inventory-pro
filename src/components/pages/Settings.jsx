import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useDatabase } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import styles from './Settings.module.css';
import Button from '../common/Button';
import FormGroup from '../common/FormGroup';
import TabNavigation from '../common/TabNavigation';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { t, language, changeLanguage, getAvailableLanguages } = useTranslation(['settings', 'common']);
  const availableLanguages = getAvailableLanguages();
  const { 
    database,
    isLoading: dbLoading
  } = useDatabase();
  
  const {
    settings,
    isLoading: settingsLoading,
    getSetting,
    updateSetting,
    saveSetting,
    resetSettings
  } = useSettings();
  
  const isLoading = dbLoading || settingsLoading;
  
  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    language: language,
    currency: 'usd',
    dateFormat: 'mm/dd/yyyy',
    enableNotifications: false,
    creditCardVendorFee: 0.68
  });
  
  const [businessSettings, setBusinessSettings] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    taxId: ''
  });
  
  const [receiptSettings, setReceiptSettings] = useState({
    header: '',
    footer: '',
    showLogo: false
  });

  // Load settings on mount
  useEffect(() => {
    if (!isLoading) {
      updateLocalStatesFromSettings();
    }
  }, [isLoading, settings, language]);
  
  // Function to update all local state from settings object
  const updateLocalStatesFromSettings = () => {
    // General settings - ensure proper case normalization for currency
    const currency = getSetting('currency', 'usd').toLowerCase();
    
    setGeneralSettings({
      language: language,
      currency: currency,
      dateFormat: getSetting('date_format', 'mm/dd/yyyy'),
      enableNotifications: getSetting('enable_notifications', false),
      creditCardVendorFee: getSetting('credit_card_vendor_fee', 0.68),
    });
    
    // Business settings
    setBusinessSettings({
      businessName: getSetting('business_name', 'Inventory Pro Store'),
      address: getSetting('business_address', ''),
      phone: getSetting('business_phone', ''),
      email: getSetting('business_email', ''),
      taxId: getSetting('tax_id', '')
    });
    
    // Receipt settings
    setReceiptSettings({
      header: getSetting('receipt_header', ''),
      footer: getSetting('receipt_footer', 'Thank you for your purchase!'),
      showLogo: getSetting('show_logo', false)
    });
  };

  // Tab configuration
  const tabs = [
    { id: 'general', label: t('settings:sections.general') },
    { id: 'business', label: t('settings:sections.businessInformation') },
    { id: 'receipt', label: t('settings:sections.receiptCustomization') },
    { id: 'database', label: t('settings:sections.databaseManagement') }
  ];

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    
    // Update local state
    setGeneralSettings(prev => ({ ...prev, language: newLanguage }));
    
    // Save language setting and change the UI language
    handleSaveSetting('language', newLanguage).then(success => {
      if (success) {
        // Only change the language if saved successfully to DB
        changeLanguage(newLanguage);
        updateLocalStatesFromSettings();
        toast.success(t('settings:general.languageChangeSuccess'));
      } else {
        toast.error(t('settings:general.languageChangeError'));
      }
    });
  };
  
  // Generic change handlers
  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Special handling for currency to ensure consistency
    if (name === 'currency') {
      handleSaveSetting('currency', value.toLowerCase());
    }
    
    setGeneralSettings(prev => ({ ...prev, [name]: newValue }));
  };
  
  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleReceiptChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setReceiptSettings(prev => ({ ...prev, [name]: newValue }));
  };
  
  // Save settings
  const handleSaveSetting = async (key, value) => {
    try {
      // Determine the type based on the value
      let type = 'string';
      let processedValue = value;
      
      // Handle numeric values
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        type = 'number';
        // Convert string numbers to actual numbers
        if (typeof value === 'string' && !isNaN(parseFloat(value))) {
          processedValue = parseFloat(value);
        }
      } 
      // Handle boolean values
      else if (typeof value === 'boolean') {
        type = 'boolean';
      } 
      // Handle object values (for JSON)
      else if (typeof value === 'object') {
        type = 'json';
      }
      
      // Create a description based on the key
      const description = `${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')} setting`;
      
      await saveSetting(key, processedValue, type, description);
      return true;
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      return false;
    }
  };
  
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    let success = true;
    
    // Map to correct database field names
    const mappedSettings = {
      language: generalSettings.language, 
      currency: generalSettings.currency.toLowerCase(),
      date_format: generalSettings.dateFormat,
      enable_notifications: generalSettings.enableNotifications,
      credit_card_vendor_fee: generalSettings.creditCardVendorFee
    };
    
    // Save all general settings except language (already saved when changed)
    for (const [key, value] of Object.entries(mappedSettings)) {
      if (key !== 'language') { 
        const result = await handleSaveSetting(key, value);
        if (!result) success = false;
      }
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings();
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('common:saveSuccess'));
    } else {
      toast.error(t('common:saveError'));
    }
  };
  
  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    let success = true;
    
    // Map to correct database field names
    const mappedSettings = {
      business_name: businessSettings.businessName,
      business_address: businessSettings.address,
      business_phone: businessSettings.phone,
      business_email: businessSettings.email,
      tax_id: businessSettings.taxId
    };
    
    // Save all business settings
    for (const [key, value] of Object.entries(mappedSettings)) {
      const result = await handleSaveSetting(key, value);
      if (!result) success = false;
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings();
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('common:saveSuccess'));
    } else {
      toast.error(t('common:saveError'));
    }
  };
  
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    let success = true;
    
    // Map to correct database field names
    const mappedSettings = {
      receipt_header: receiptSettings.header,
      receipt_footer: receiptSettings.footer,
      show_logo: receiptSettings.showLogo
    };
    
    // Save all receipt settings
    for (const [key, value] of Object.entries(mappedSettings)) {
      const result = await handleSaveSetting(key, value);
      if (!result) success = false;
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings();
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('common:saveSuccess'));
    } else {
      toast.error(t('common:saveError'));
    }
  };
  
  const handleResetDatabase = async () => {
    if (window.confirm(t('settings:database.reset.confirmMessage'))) {
      try {
        // Check if database instance is available
        if (!database) {
          throw new Error('Database not initialized');
        }
        
        // Call the reset method on the database
        const result = await window.database.resetDatabase();
        
        if (result.success) {
          toast.success(t('settings:database.reset.success'));
          
          // Force a full application reload to ensure all data is refreshed
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Database reset error:', error);
        toast.error(t('settings:database.reset.error'));
      }
    }
  };
  
  const handleExportToJson = async () => {
    try {
      // Just use the default JSON export path from the environment config
      const result = await window.database.exportToJson();
      
      if (result) {
        toast.success(t('settings:database.exportToJson.success'));
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error(t('settings:database.exportToJson.error'));
    }
  };
  
  const handleImportFromJson = async () => {
    if (window.confirm(t('settings:database.importFromJson.confirmMessage'))) {
      try {
        // First select the JSON file to import
        const jsonFilePath = await window.database.selectJsonFile();
        
        if (!jsonFilePath) {
          // User cancelled the file selection
          return;
        }
        
        // Now import the data with the selected file path
        const result = await window.database.importFromJson(jsonFilePath);
        
        if (result.success) {
          toast.success(t('settings:database.importFromJson.success'));
          
          // Force a full application reload to ensure all data is refreshed
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(result.error || 'Import failed');
        }
      } catch (error) {
        console.error('JSON import error:', error);
        toast.error(`${t('settings:database.importFromJson.error')}: ${error.message}`);
      }
    }
  };
  
  const handleExportToExcel = async () => {
    try {
      // Just use the default Excel export path from the environment config
      const result = await window.database.exportToExcel();
      
      if (result) {
        toast.success(t('settings:database.exportToExcel.success'));
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error(t('settings:database.exportToExcel.error'));
    }
  };
  
  const handleImportFromExcel = async () => {
    if (window.confirm(t('settings:database.importFromExcel.confirmMessage'))) {
      try {
        // First select the Excel file to import
        const excelFilePath = await window.database.selectExcelFile();
        
        if (!excelFilePath) {
          // User cancelled the file selection
          return;
        }
        
        // Now import the data with the selected file path
        const result = await window.database.importFromExcel(excelFilePath);
        
        if (result.success) {
          toast.success(t('settings:database.importFromExcel.success'));
          
          // Force a full application reload to ensure all data is refreshed
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(result.error || 'Import failed');
        }
      } catch (error) {
        console.error('Excel import error:', error);
        toast.error(`${t('settings:database.importFromExcel.error')}: ${error.message}`);
      }
    }
  };
  
  const handleResetSettings = async () => {
    if (window.confirm(t('settings:database.resetSettings.confirmMessage'))) {
      try {
        await resetSettings();
        updateLocalStatesFromSettings();
        toast.success(t('settings:database.resetSettings.success'));
      } catch (error) {
        console.error('Settings reset error:', error);
        toast.error(t('settings:database.resetSettings.error'));
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <TabNavigation 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        
        <div className={styles.content}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <>
              <h3>{t('settings:sections.general')}</h3>
              <form className={styles.form} onSubmit={handleGeneralSubmit}>
                <FormGroup 
                  label={t('settings:general.language')} 
                  htmlFor="language"
                >
                  <select
                    id="language"
                    name="language"
                    value={generalSettings.language}
                    onChange={handleLanguageChange}
                    className="form-control"
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:general.currency')} 
                  htmlFor="currency"
                >
                  <select
                    id="currency"
                    name="currency"
                    value={generalSettings.currency}
                    onChange={handleGeneralChange}
                    className="form-control"
                  >
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                    <option value="try">TRY (₺)</option>
                  </select>
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:general.dateFormat')} 
                  htmlFor="dateFormat"
                >
                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={generalSettings.dateFormat}
                    onChange={handleGeneralChange}
                    className="form-control"
                  >
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </FormGroup>
                
                <FormGroup 
                  isCheckbox
                  htmlFor="enableNotifications"
                >
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    name="enableNotifications"
                    checked={generalSettings.enableNotifications}
                    onChange={handleGeneralChange}
                  />
                  <label htmlFor="enableNotifications">
                    {t('settings:general.enableLowStockNotifications')}
                  </label>
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:general.creditCardVendorFee')} 
                  htmlFor="creditCardVendorFee"
                >
                  <input
                    type="number"
                    step="0.01"
                    id="creditCardVendorFee"
                    name="creditCardVendorFee"
                    value={generalSettings.creditCardVendorFee}
                    onChange={handleGeneralChange}
                    className="form-control"
                  />
                </FormGroup>
                
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary">
                    {t('common:saveChanges')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="danger" 
                    onClick={handleResetSettings}
                  >
                    {t('settings:database.resetSettings.action')}
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {/* Business Settings */}
          {activeTab === 'business' && (
            <>
              <h3>{t('settings:sections.businessInformation')}</h3>
              <form className={styles.form} onSubmit={handleBusinessSubmit}>
                <FormGroup 
                  label={t('settings:business.businessName')} 
                  htmlFor="businessName"
                >
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={businessSettings.businessName}
                    onChange={handleBusinessChange}
                    className="form-control"
                  />
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:business.address')} 
                  htmlFor="address"
                >
                  <textarea
                    id="address"
                    name="address"
                    value={businessSettings.address}
                    onChange={handleBusinessChange}
                    className="form-control"
                    rows={3}
                  />
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:business.phoneNumber')} 
                  htmlFor="phone"
                >
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={businessSettings.phone}
                    onChange={handleBusinessChange}
                    className="form-control"
                  />
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:business.email')} 
                  htmlFor="email"
                >
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={businessSettings.email}
                    onChange={handleBusinessChange}
                    className="form-control"
                  />
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:business.taxId')} 
                  htmlFor="taxId"
                >
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={businessSettings.taxId}
                    onChange={handleBusinessChange}
                    className="form-control"
                  />
                </FormGroup>
                
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary">
                    {t('common:saveChanges')}
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {/* Receipt Settings */}
          {activeTab === 'receipt' && (
            <>
              <h3>{t('settings:sections.receiptCustomization')}</h3>
              <form className={styles.form} onSubmit={handleReceiptSubmit}>
                <FormGroup 
                  label={t('settings:receipt.header')} 
                  htmlFor="header"
                >
                  <textarea
                    id="header"
                    name="header"
                    value={receiptSettings.header}
                    onChange={handleReceiptChange}
                    className="form-control"
                    rows={3}
                  />
                </FormGroup>
                
                <FormGroup 
                  label={t('settings:receipt.footer')} 
                  htmlFor="footer"
                >
                  <textarea
                    id="footer"
                    name="footer"
                    value={receiptSettings.footer}
                    onChange={handleReceiptChange}
                    className="form-control"
                    rows={3}
                  />
                </FormGroup>
                
                <FormGroup 
                  isCheckbox
                  htmlFor="showLogo"
                >
                  <input
                    type="checkbox"
                    id="showLogo"
                    name="showLogo"
                    checked={receiptSettings.showLogo}
                    onChange={handleReceiptChange}
                  />
                  <label htmlFor="showLogo">
                    {t('settings:receipt.showLogo')}
                  </label>
                </FormGroup>
                
                <div className={styles.formActions}>
                  <Button type="submit" variant="primary">
                    {t('common:saveChanges')}
                  </Button>
                </div>
              </form>
            </>
          )}
          
          {/* Database Management */}
          {activeTab === 'database' && (
            <>
              <h3>{t('settings:sections.databaseManagement')}</h3>
              
              <div className={styles.databaseActions}>
                {/* Export to JSON */}
                <div className={styles.actionCard}>
                  <h4>{t('settings:database.exportToJson.title')}</h4>
                  <p>{t('settings:database.exportToJson.description')}</p>
                  <Button
                    variant="secondary"
                    onClick={handleExportToJson}
                  >
                    {t('settings:database.exportToJson.action')}
                  </Button>
                </div>
                
                {/* Import from JSON */}
                <div className={styles.actionCard}>
                  <h4>{t('settings:database.importFromJson.title')}</h4>
                  <p>{t('settings:database.importFromJson.description')}</p>
                  <Button
                    variant="secondary"
                    onClick={handleImportFromJson}
                  >
                    {t('settings:database.importFromJson.action')}
                  </Button>
                </div>
                
                {/* Export to Excel */}
                <div className={styles.actionCard}>
                  <h4>{t('settings:database.exportToExcel.title')}</h4>
                  <p>{t('settings:database.exportToExcel.description')}</p>
                  <Button
                    variant="secondary"
                    onClick={handleExportToExcel}
                  >
                    {t('settings:database.exportToExcel.action')}
                  </Button>
                </div>
                
                {/* Import from Excel */}
                <div className={styles.actionCard}>
                  <h4>{t('settings:database.importFromExcel.title')}</h4>
                  <p>{t('settings:database.importFromExcel.description')}</p>
                  <Button
                    variant="secondary"
                    onClick={handleImportFromExcel}
                  >
                    {t('settings:database.importFromExcel.action')}
                  </Button>
                </div>
                
                {/* Reset Database */}
                <div className={`${styles.actionCard} ${styles.warningCard}`}>
                  <h4>{t('settings:database.reset.title')}</h4>
                  <p>{t('settings:database.reset.description')}</p>
                  <Button
                    variant="danger"
                    onClick={handleResetDatabase}
                  >
                    {t('settings:database.reset.action')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
