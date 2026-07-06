import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Enforce French number formatting (space as thousands separator) globally
const nativeToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function (
  this: number,
  locales?: string | string[],
  options?: Intl.NumberFormatOptions
) {
  return nativeToLocaleString.call(this, locales || 'fr-FR', options);
};


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
