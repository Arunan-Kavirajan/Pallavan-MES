import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { firebaseService } from '../../services/firebaseService';
import { Wifi, WifiOff, CloudSync, Factory, Download, Database, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { isOnline, pendingCount, syncNow } = useSync();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white p-2 rounded-lg">
              <Factory size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900 hidden sm:block">Pallavan Precision Works</h1>
              <p className="text-xs text-gray-500 font-medium">Shift Production System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Sync Status - ONLY show if Firebase is configured */}
            {firebaseService.isEnabled && (
              <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                <div className="mr-3 flex items-center">
                  {isOnline ? (
                    <Wifi size={16} className="text-success mr-2" />
                  ) : (
                    <WifiOff size={16} className="text-danger mr-2" />
                  )}
                  <span className="text-xs font-medium text-gray-700">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  {!isOnline && pendingCount > 0 && (
                    <span className="ml-2 bg-warning text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {pendingCount} unsynced
                    </span>
                  )}
                </div>
                
                <div className="border-l border-gray-300 pl-3 flex items-center space-x-2">
                  {!isOnline && pendingCount > 0 && (
                    <button 
                      onClick={syncNow}
                      className="p-1 text-primary hover:bg-blue-50 rounded"
                      title="Force Sync Now"
                    >
                      <CloudSync size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {/* Install App Button */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:flex items-center px-3 py-1.5 border border-primary text-primary hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
              >
                <Download size={16} className="mr-2" /> Install App
              </button>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-3 bg-gray-50 pl-3 pr-4 py-1.5 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-right pr-2 border-r border-gray-200">
                <div className="text-sm font-bold text-gray-900 leading-tight">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">{currentUser?.role}</div>
              </div>
              
              <button 
                onClick={logout}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>

          </div>

        </div>
      </div>
    </nav>
  );
}
