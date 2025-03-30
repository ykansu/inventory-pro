import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useDatabase } from '../context/DatabaseContext';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { t, language, changeLanguage, getAvailableLanguages } = useTranslation(['settings', 'common']);
  const availableLanguages = getAvailableLanguages();
  const { 
    settings, 
    updateSetting, 
    saveSettingSafely, 
    database, 
    isLoading,
    resetAndReloadSettings
  } = useDatabase();
  
  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    language: language,
    currency: 'usd',
    dateFormat: 'mm/dd/yyyy',
    enableNotifications: false
  });
  
  const [businessSettings, setBusinessSettings] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    taxId: ''
  });
  
  const [taxSettings, setTaxSettings] = useState({
    enableTax: false,
    taxRate: 0,
    taxName: 'Tax'
  });
  
  const [receiptSettings, setReceiptSettings] = useState({
    header: '',
    footer: '',
    showLogo: false,
    showTaxDetails: true
  });
  
  // Load settings on mount
  useEffect(() => {
    if (!isLoading && settings) {
      updateLocalStatesFromSettings(settings);
    }
  }, [isLoading, settings, language]);
  
  // Function to update all local state from settings object
  const updateLocalStatesFromSettings = async (settingsObject) => {
    const settingsObj = await settingsObject.getAllSettings();
    
    // General settings - ensure proper case normalization for currency
    const currency = settingsObj.currency ? settingsObj.currency.toLowerCase() : 'usd';
    
    setGeneralSettings({
      language: language,
      currency: currency,
      dateFormat: settingsObj.date_format || settingsObj.dateFormat || 'mm/dd/yyyy',
      enableNotifications: settingsObj.enable_notifications,
    });
    
    // Business settings
    setBusinessSettings({
      businessName: settingsObj.business_name || settingsObj.businessName || 'Inventory Pro Store',
      address: settingsObj.business_address || settingsObj.address || '',
      phone: settingsObj.business_phone || settingsObj.phone || '',
      email: settingsObj.business_email || settingsObj.email || '',
      taxId: settingsObj.tax_id || settingsObj.taxId || ''
    });
    
    // Tax settings
    const taxRate = typeof settingsObj.tax_rate === 'number' 
      ? settingsObj.tax_rate 
      : (typeof settingsObj.taxRate === 'number' ? settingsObj.taxRate : 0);
      
    setTaxSettings({
      enableTax: settingsObj.enable_tax,
      taxRate: taxRate,
      taxName: settingsObj.tax_name || settingsObj.taxName || 'Tax'
    });
    
    // Receipt settings
    setReceiptSettings({
      header: settingsObj.receipt_header || settingsObj.receiptHeader || '',
      footer: settingsObj.receipt_footer || '',
      showLogo: settingsObj.show_logo,
      showTaxDetails: settingsObj.show_tax_details
    });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);
    setGeneralSettings(prev => ({ ...prev, language: newLanguage }));
    
    // Save language setting
    handleSaveSetting('language', newLanguage).then(success => {
      if (success) {
        updateLocalStatesFromSettings({
          ...settings,
          language: newLanguage
        });
        toast.success(t('settings:languageChangeSuccess'));
      } else {
        toast.error(t('settings:languageChangeError'));
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
  
  const handleTaxChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setTaxSettings(prev => ({ ...prev, [name]: newValue }));
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
      
      await saveSettingSafely(key, processedValue, type, description);
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
      enable_notifications: generalSettings.enableNotifications
    };
    
    // Save all general settings except language (already saved when changed)
    for (const [key, value] of Object.entries(mappedSettings)) {
      if (key !== 'language') { 
        const result = await handleSaveSetting(key, value);
        if (!result) success = false;
      }
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings(settings);
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('settings:saveSuccess'));
    } else {
      toast.error(t('settings:saveError'));
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
    
    // Save all business settings with correct field names
    for (const [key, value] of Object.entries(mappedSettings)) {
      const result = await handleSaveSetting(key, value);
      if (!result) success = false;
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings(settings);
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('settings:saveSuccess'));
    } else {
      toast.error(t('settings:saveError'));
    }
  };
  
  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    let success = true;
    
    // Map to correct database field names
    const mappedSettings = {
      enable_tax: taxSettings.enableTax,
      tax_rate: taxSettings.taxRate,
      tax_name: taxSettings.taxName
    };
    
    // Save all tax settings
    for (const [key, value] of Object.entries(mappedSettings)) {
      const result = await handleSaveSetting(key, value);
      if (!result) success = false;
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings(settings);
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('settings:saveSuccess'));
    } else {
      toast.error(t('settings:saveError'));
    }
  };
  
  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    let success = true;
    
    // Save receipt header/footer with correct field names
    const result1 = await handleSaveSetting('receipt_header', receiptSettings.header);
    const result2 = await handleSaveSetting('receipt_footer', receiptSettings.footer);
    
    // Save other receipt settings
    const result3 = await handleSaveSetting('show_logo', receiptSettings.showLogo);
    const result4 = await handleSaveSetting('show_tax_details', receiptSettings.showTaxDetails);
    
    if (!result1 || !result2 || !result3 || !result4) {
      success = false;
    }
    
    // Refresh the settings from context to update the UI
    updateLocalStatesFromSettings(settings);
    
    // Show a single toast based on the result
    if (success) {
      toast.success(t('settings:saveSuccess'));
    } else {
      toast.error(t('settings:saveError'));
    }
  };
  
  // Database management
  const handleCreateBackup = async () => {
    try {
      await database.createBackup();
      toast.success(t('settings:database.backup.success'));
    } catch (error) {
      toast.error(t('settings:database.backup.error'));
      console.error('Backup creation failed:', error);
    }
  };
  
  const handleRestoreBackup = async () => {
    try {
      await database.restoreFromBackup();
      toast.success(t('settings:database.restore.success'));
      window.location.reload();
    } catch (error) {
      toast.error(t('settings:database.restore.error'));
      console.error('Restore from backup failed:', error);
    }
  };
  
  const handleResetDatabase = async () => {
    if (window.confirm(t('settings:database.reset.confirmMessage'))) {
      try {
        await database.resetDatabase();
        toast.success(t('settings:database.reset.success'));
        window.location.reload();
      } catch (error) {
        toast.error(t('settings:database.reset.error'));
        console.error('Database reset failed:', error);
      }
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>{t('settings:title')}</h2>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <ul className="settings-tabs">
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                {t('settings:sections.general')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'business' ? 'active' : ''}`}
                onClick={() => setActiveTab('business')}
              >
                {t('settings:sections.businessInformation')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'tax' ? 'active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                {t('settings:sections.taxSettings')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'receipt' ? 'active' : ''}`}
                onClick={() => setActiveTab('receipt')}
              >
                {t('settings:sections.receiptCustomization')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                {t('settings:sections.databaseManagement')}
              </button>
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="general-settings">
              <h3>{t('settings:sections.general')}</h3>
              
              <form className="settings-form" onSubmit={handleGeneralSubmit}>
                <div className="form-group">
                  <label htmlFor="language">{t('settings:general.language')}</label>
                  <select 
                    id="language" 
                    name="language" 
                    value={generalSettings.language}
                    onChange={handleLanguageChange}
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>
                        {t(`settings:languages.${lang}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">{t('settings:general.currency')}</label>
                  <select 
                    id="currency" 
                    name="currency"
                    value={generalSettings.currency?.toLowerCase()}
                    onChange={handleGeneralChange}
                  >
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                    <option value="try">TRY (₺)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dateFormat">{t('settings:general.dateFormat')}</label>
                  <select 
                    id="dateFormat" 
                    name="dateFormat"
                    value={generalSettings.dateFormat}
                    onChange={handleGeneralChange}
                  >
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="enableNotifications" 
                    name="enableNotifications"
                    checked={generalSettings.enableNotifications}
                    onChange={handleGeneralChange}
                  />
                  <label htmlFor="enableNotifications">{t('settings:general.enableLowStockNotifications')}</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    {t('common:saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="business-settings">
              <h3>{t('settings:sections.businessInformation')}</h3>
              
              <form className="settings-form" onSubmit={handleBusinessSubmit}>
                <div className="form-group">
                  <label htmlFor="businessName">{t('settings:business.businessName')}</label>
                  <input 
                    type="text" 
                    id="businessName" 
                    name="businessName" 
                    value={businessSettings.businessName}
                    onChange={handleBusinessChange}
                    placeholder={t('settings:business.businessNamePlaceholder')} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">{t('settings:business.address')}</label>
                  <textarea 
                    id="address" 
                    name="address" 
                    value={businessSettings.address}
                    onChange={handleBusinessChange}
                    placeholder={t('settings:business.addressPlaceholder')} 
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">{t('settings:business.phoneNumber')}</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={businessSettings.phone}
                    onChange={handleBusinessChange}
                    placeholder={t('settings:business.phonePlaceholder')} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('settings:business.email')}</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={businessSettings.email}
                    onChange={handleBusinessChange}
                    placeholder={t('settings:business.emailPlaceholder')} 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taxId">{t('settings:business.taxId')}</label>
                  <input 
                    type="text" 
                    id="taxId" 
                    name="taxId" 
                    value={businessSettings.taxId}
                    onChange={handleBusinessChange}
                    placeholder={t('settings:business.taxIdPlaceholder')} 
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    {t('common:saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="tax-settings">
              <h3>{t('settings:sections.taxSettings')}</h3>
              
              <form className="settings-form" onSubmit={handleTaxSubmit}>
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="enableTax" 
                    name="enableTax"
                    checked={taxSettings.enableTax}
                    onChange={handleTaxChange}
                  />
                  <label htmlFor="enableTax">{t('settings:tax.enableTaxCalculation')}</label>
                </div>

                <div className="form-group">
                  <label htmlFor="taxRate">{t('settings:tax.defaultTaxRate')}</label>
                  <input 
                    type="number" 
                    id="taxRate" 
                    name="taxRate" 
                    value={taxSettings.taxRate}
                    onChange={handleTaxChange}
                    placeholder="0.0" 
                    min="0" 
                    step="0.1" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taxName">{t('settings:tax.taxName')}</label>
                  <input 
                    type="text" 
                    id="taxName" 
                    name="taxName" 
                    value={taxSettings.taxName}
                    onChange={handleTaxChange}
                    placeholder={t('settings:tax.taxNamePlaceholder')} 
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    {t('common:saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="receipt-settings">
              <h3>{t('settings:sections.receiptCustomization')}</h3>
              
              <form className="settings-form" onSubmit={handleReceiptSubmit}>
                <div className="form-group">
                  <label htmlFor="header">{t('settings:receipt.header')}</label>
                  <textarea 
                    id="header" 
                    name="header" 
                    value={receiptSettings.header}
                    onChange={handleReceiptChange}
                    placeholder={t('settings:receipt.headerPlaceholder')} 
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="footer">{t('settings:receipt.footer')}</label>
                  <textarea 
                    id="footer" 
                    name="footer" 
                    value={receiptSettings.footer}
                    onChange={handleReceiptChange}
                    placeholder={t('settings:receipt.footerPlaceholder')} 
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="showLogo" 
                    name="showLogo"
                    checked={receiptSettings.showLogo}
                    onChange={handleReceiptChange}
                  />
                  <label htmlFor="showLogo">{t('settings:receipt.showLogo')}</label>
                </div>

                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="showTaxDetails" 
                    name="showTaxDetails"
                    checked={receiptSettings.showTaxDetails}
                    onChange={handleReceiptChange}
                  />
                  <label htmlFor="showTaxDetails">{t('settings:receipt.showTaxDetails')}</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    {t('common:saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="database-settings">
              <h3>{t('settings:sections.databaseManagement')}</h3>
              
              <div className="database-actions">
                <div className="action-card">
                  <h4>{t('settings:database.backup.title')}</h4>
                  <p>{t('settings:database.backup.description')}</p>
                  <button 
                    className="button secondary"
                    onClick={handleCreateBackup}
                  >
                    {t('settings:database.backup.action')}
                  </button>
                </div>
                
                <div className="action-card">
                  <h4>{t('settings:database.restore.title')}</h4>
                  <p>{t('settings:database.restore.description')}</p>
                  <button 
                    className="button secondary"
                    onClick={handleRestoreBackup}
                  >
                    {t('settings:database.restore.action')}
                  </button>
                </div>
                
                <div className="action-card warning">
                  <h4>{t('settings:database.reset.title')}</h4>
                  <p>{t('settings:database.reset.description')}</p>
                  <button 
                    className="button danger"
                    onClick={handleResetDatabase}
                  >
                    {t('settings:database.reset.action')}
                  </button>
                </div>
                
                <div className="action-card">
                  <h4>{t('settings:database.resetSettings.title')}</h4>
                  <p>{t('settings:database.resetSettings.description')}</p>
                  <button 
                    className="button secondary"
                    onClick={async () => {
                      const success = await resetAndReloadSettings();
                      if (success) {
                        toast.success(t('settings:database.resetSettings.success'));
                        window.location.reload();
                      } else {
                        toast.error(t('settings:database.resetSettings.error'));
                      }
                    }}
                  >
                    {t('settings:database.resetSettings.action')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
