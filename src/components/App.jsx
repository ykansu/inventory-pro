import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { DatabaseProvider } from '../context/DatabaseContext';
import { Toaster } from 'react-hot-toast';
import LanguageInitializer from './LanguageInitializer';

// Import page components
import Dashboard from '../pages/Dashboard';
import ProductManagement from '../pages/ProductManagement';
import POS from '../pages/POS';
import SalesHistory from '../pages/SalesHistory';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import StockUpdate from '../pages/StockUpdate';

// Inner component that uses hooks after providers are set up
const AppContent = () => {
  const { t } = useTranslation(['common']);
  
  return (
    <Router>
      <div className="app-container">
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#E57373',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {/* Sidebar navigation */}
        <nav className="sidebar">
          <div className="sidebar-header">
            <h1>{t('app_title')}</h1>
          </div>
          <ul className="sidebar-menu">
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-tachometer-alt"></i> {t('dashboard')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-box"></i> {t('products')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/stock-update" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-cubes"></i> {t('stockUpdate')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/pos" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-cash-register"></i> {t('pointOfSale')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/sales" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-shopping-cart"></i> {t('salesHistory')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-chart-bar"></i> {t('reports')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="fas fa-cog"></i> {t('settings')}
              </NavLink>
            </li>
          </ul>
        </nav>
        
        {/* Main content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/stock-update" element={<StockUpdate />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// Main App component that sets up providers
const App = () => {
  return (
    <DatabaseProvider>
      <LanguageInitializer>
        <AppContent />
      </LanguageInitializer>
    </DatabaseProvider>
  );
};

export default App;
