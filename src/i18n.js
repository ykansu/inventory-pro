import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all translation files
import enCommon from './translations/en/common.json';
import trCommon from './translations/tr/common.json';
import enDashboard from './translations/en/dashboard.json';
import trDashboard from './translations/tr/dashboard.json';
import enProducts from './translations/en/products.json';
import trProducts from './translations/tr/products.json';
import enPOS from './translations/en/pos.json';
import trPOS from './translations/tr/pos.json';
import enSales from './translations/en/sales.json';
import trSales from './translations/tr/sales.json';
import enReports from './translations/en/reports.json';
import trReports from './translations/tr/reports.json';
import enSettings from './translations/en/settings.json';
import trSettings from './translations/tr/settings.json';
import enExpenses from './translations/en/expenses.json';
import trExpenses from './translations/tr/expenses.json';

// Organize resources by language and namespace
const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    products: enProducts,
    pos: enPOS,
    sales: enSales,
    reports: enReports,
    settings: enSettings,
    expenses: enExpenses
  },
  tr: {
    common: trCommon,
    dashboard: trDashboard,
    products: trProducts,
    pos: trPOS,
    sales: trSales,
    reports: trReports,
    settings: trSettings,
    expenses: trExpenses
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language - will be overridden from DB when loaded
    fallbackLng: 'en', // fallback language
    
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    
    // Enable nested keys with dots
    keySeparator: '.',
    
    // Allow namespaces with colons
    nsSeparator: ':',
    
    // Allow loading multiple namespaces
    ns: ['common', 'dashboard', 'products', 'pos', 'sales', 'reports', 'settings', 'expenses'],
    defaultNS: 'common'
  });

export default i18n;
