import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
// Import i18n configuration
import './i18n';
// Import CSS files
import './index.css';

// Create root element for React
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render the React application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Accept HMR updates
if (module.hot) {
  module.hot.accept();
}
