import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initStorage } from './utils/storage';

// Saves are loaded from the browser's database before the app first renders
initStorage().then(() =>
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ),
);
