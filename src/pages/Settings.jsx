import React, { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <ul className="settings-tabs">
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'business' ? 'active' : ''}`}
                onClick={() => setActiveTab('business')}
              >
                Business Information
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'tax' ? 'active' : ''}`}
                onClick={() => setActiveTab('tax')}
              >
                Tax Settings
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'receipt' ? 'active' : ''}`}
                onClick={() => setActiveTab('receipt')}
              >
                Receipt Customization
              </button>
            </li>
            <li>
              <button 
                className={`settings-tab-button ${activeTab === 'database' ? 'active' : ''}`}
                onClick={() => setActiveTab('database')}
              >
                Database Management
              </button>
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="general-settings">
              <h3>General Settings</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="language">Language</label>
                  <select id="language" name="language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Currency</label>
                  <select id="currency" name="currency">
                    <option value="usd">USD ($)</option>
                    <option value="eur">EUR (€)</option>
                    <option value="gbp">GBP (£)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dateFormat">Date Format</label>
                  <select id="dateFormat" name="dateFormat">
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="notifications" name="notifications" />
                  <label htmlFor="notifications">Enable Low Stock Notifications</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="business-settings">
              <h3>Business Information</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input type="text" id="businessName" name="businessName" placeholder="Your Business Name" />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea id="address" name="address" placeholder="Business Address" rows="3"></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" placeholder="Phone Number" />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" placeholder="Business Email" />
                </div>

                <div className="form-group">
                  <label htmlFor="taxId">Tax ID / Business Number</label>
                  <input type="text" id="taxId" name="taxId" placeholder="Tax ID or Business Number" />
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="tax-settings">
              <h3>Tax Settings</h3>
              
              <form className="settings-form">
                <div className="form-group checkbox-group">
                  <input type="checkbox" id="enableTax" name="enableTax" />
                  <label htmlFor="enableTax">Enable Tax Calculation</label>
                </div>

                <div className="form-group">
                  <label htmlFor="taxRate">Default Tax Rate (%)</label>
                  <input type="number" id="taxRate" name="taxRate" placeholder="0.0" min="0" step="0.1" />
                </div>

                <div className="form-group">
                  <label htmlFor="taxName">Tax Name</label>
                  <input type="text" id="taxName" name="taxName" placeholder="e.g. Sales Tax, VAT, GST" />
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="receipt-settings">
              <h3>Receipt Customization</h3>
              
              <form className="settings-form">
                <div className="form-group">
                  <label htmlFor="receiptHeader">Receipt Header</label>
                  <textarea id="receiptHeader" name="receiptHeader" placeholder="Text to appear at the top of receipts" rows="3"></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="receiptFooter">Receipt Footer</label>
                  <textarea id="receiptFooter" name="receiptFooter" placeholder="Thank you message or return policy" rows="3"></textarea>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="showLogo" name="showLogo" />
                  <label htmlFor="showLogo">Show Business Logo on Receipt</label>
                </div>

                <div className="form-group checkbox-group">
                  <input type="checkbox" id="showTaxDetails" name="showTaxDetails" />
                  <label htmlFor="showTaxDetails">Show Detailed Tax Information</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="button primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="database-settings">
              <h3>Database Management</h3>
              
              <div className="database-actions">
                <div className="action-card">
                  <h4>Backup Database</h4>
                  <p>Create a backup of your current database.</p>
                  <button className="button secondary">Create Backup</button>
                </div>

                <div className="action-card">
                  <h4>Restore Database</h4>
                  <p>Restore from a previously created backup.</p>
                  <button className="button secondary">Restore from Backup</button>
                </div>

                <div className="action-card">
                  <h4>Export Data</h4>
                  <p>Export your data to CSV or JSON format.</p>
                  <div className="button-group">
                    <button className="button secondary">Export to CSV</button>
                    <button className="button secondary">Export to JSON</button>
                  </div>
                </div>

                <div className="action-card danger">
                  <h4>Reset Database</h4>
                  <p>Warning: This will delete all your data and cannot be undone.</p>
                  <button className="button danger">Reset Database</button>
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
