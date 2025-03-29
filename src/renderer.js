import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.css';
import './styles/pages.css';

// Create root element for React
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render the React application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
