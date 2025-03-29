import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { t, language, changeLanguage, getAvailableLanguages } = useTranslation(['settings', 'common']);
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    changeLanguage(newLanguage);
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
                {t('settings:tabs.general')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'business' ? 'active' : ''}`}
                onClick={() => setActiveTab('business')}
              >
                {t('settings:tabs.businessInformation')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'tax' ? 'active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                {t('settings:tabs.taxSettings')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'receipt' ? 'active' : ''}`}
                onClick={() => setActiveTab('receipt')}
              >
                {t('settings:tabs.receiptCustomization')}
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                {t('settings:tabs.databaseManagement')}
              </button>
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="general-settings">
              <h3>{t('settings:general.title')}</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="language">{t('settings:general.language')}</label>
                  <select 
                    id="language" 
                    name="language" 
                    value={language}
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
                  <select id="currency" name="currency">
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                    <option value="try">TRY (₺)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dateFormat">{t('settings:general.dateFormat')}</label>
                  <select id="dateFormat" name="dateFormat">
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="notifications" name="notifications" />
                  <label htmlFor="notifications">{t('settings:general.enableLowStockNotifications')}</label>
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
              <h3>{t('settings:business.title')}</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="businessName">{t('settings:business.businessName')}</label>
                  <input type="text" id="businessName" name="businessName" placeholder={t('settings:business.businessNamePlaceholder')} />
                </div>

                <div className="form-group">
                  <label htmlFor="address">{t('settings:business.address')}</label>
                  <textarea id="address" name="address" placeholder={t('settings:business.addressPlaceholder')} rows="3"></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">{t('settings:business.phoneNumber')}</label>
                  <input type="tel" id="phone" name="phone" placeholder={t('settings:business.phonePlaceholder')} />
                </div>

                <div className="form-group">
                  <label htmlFor="email">{t('settings:business.email')}</label>
                  <input type="email" id="email" name="email" placeholder={t('settings:business.emailPlaceholder')} />
                </div>

                <div className="form-group">
                  <label htmlFor="taxId">{t('settings:business.taxId')}</label>
                  <input type="text" id="taxId" name="taxId" placeholder={t('settings:business.taxIdPlaceholder')} />
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
              <h3>{t('settings:tax.title')}</h3>
              
              <form className="settings-form">
                <div className="form-group checkbox-group">
                  <input type="checkbox" id="enableTax" name="enableTax" />
                  <label htmlFor="enableTax">{t('settings:tax.enableTaxCalculation')}</label>
                </div>

                <div className="form-group">
                  <label htmlFor="taxRate">{t('settings:tax.defaultTaxRate')}</label>
                  <input type="number" id="taxRate" name="taxRate" placeholder="0.0" min="0" step="0.1" />
                </div>

                <div className="form-group">
                  <label htmlFor="taxName">{t('settings:tax.taxName')}</label>
                  <input type="text" id="taxName" name="taxName" placeholder={t('settings:tax.taxNamePlaceholder')} />
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
              <h3>{t('settings:receipt.title')}</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="receiptHeader">{t('settings:receipt.header')}</label>
                  <textarea id="receiptHeader" name="receiptHeader" placeholder={t('settings:receipt.headerPlaceholder')} rows="3"></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="receiptFooter">{t('settings:receipt.footer')}</label>
                  <textarea id="receiptFooter" name="receiptFooter" placeholder={t('settings:receipt.footerPlaceholder')} rows="3"></textarea>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="showLogo" name="showLogo" />
                  <label htmlFor="showLogo">{t('settings:receipt.showLogo')}</label>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="showTaxDetails" name="showTaxDetails" />
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
              <h3>{t('settings:database.title')}</h3>
              
              <div className="database-actions">
                <div className="action-card">
                  <h4>{t('settings:database.backup.title')}</h4>
                  <p>{t('settings:database.backup.description')}</p>
                  <button className="button secondary">
                    {t('settings:database.backup.action')}
                  </button>
                </div>
                
                <div className="action-card">
                  <h4>{t('settings:database.restore.title')}</h4>
                  <p>{t('settings:database.restore.description')}</p>
                  <button className="button secondary">
                    {t('settings:database.restore.action')}
                  </button>
                </div>
                
                <div className="action-card warning">
                  <h4>{t('settings:database.reset.title')}</h4>
                  <p>{t('settings:database.reset.description')}</p>
                  <button className="button danger">
                    {t('settings:database.reset.action')}
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
