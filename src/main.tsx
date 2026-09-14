import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <SyncProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SyncProvider>
    </AuthProvider>
  </React.StrictMode>,
);
