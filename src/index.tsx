import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root element with id='root'. Check your index.html file.");
}

import { initJsCorp } from './core/js-corp-lock';

// Initialize JS Corp Core Watermark
initJsCorp();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
