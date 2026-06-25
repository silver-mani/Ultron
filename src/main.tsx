import React from 'react';
import ReactDOM from 'react-dom/client';

// 0. Reset — clears browser default margin/padding
import './reset.css';

// 1. Alloy tokens first — defines all --color-*, --space-*, etc. CSS vars
import 'alloy-design-system/styles/tokens.css';
// 1b. Alloy icon-slot rules — centers SVGs inside .alloy-icon-slot wrappers
import 'alloy-design-system/styles/artwork.css';

// 2. Geist font faces (geist v1.7+ ships woff2 only, no style.css)
import './fonts.css';

// 3. Consumer-side Alloy overrides (loaded last so they win) — bottom-right toasts
import './ultron-overrides.css';

import { ToastProvider } from 'alloy-design-system';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);
