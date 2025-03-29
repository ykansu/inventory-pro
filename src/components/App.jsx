import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

// Import page components (we'll create these next)
import Dashboard from '../pages/Dashboard';
import ProductManagement from '../pages/ProductManagement';
import POS from '../pages/POS';
import SalesHistory from '../pages/SalesHistory';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';

const App = () => {
  const { t } = useTranslation(['common']);
  
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Inventory Pro</h1>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">{t('dashboard')}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">📦</span>
                  <span className="nav-text">{t('products')}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/pos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">💰</span>
                  <span className="nav-text">{t('pointOfSale')}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/sales" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">📝</span>
                  <span className="nav-text">{t('salesHistory')}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">📈</span>
                  <span className="nav-text">{t('reports')}</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  <span className="nav-icon">⚙️</span>
                  <span className="nav-text">{t('settings')}</span>
                </NavLink>
              </li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <p>Version 0.1.0</p>
          </div>
        </aside>
        <main className="main-content">
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductManagement />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/sales" element={<SalesHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
