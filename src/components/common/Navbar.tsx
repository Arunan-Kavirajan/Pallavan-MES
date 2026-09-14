import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { SEEDED_USERS } from '../../constants/seededData';
import { Wifi, WifiOff, CloudSync, Factory, Download } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { isOnline, isSimulatingOffline, toggleOfflineSimulation, pendingCount, syncNow } = useSync();
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
            
            {/* Sync Status / Offline Simulator */}
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
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isSimulatingOffline} onChange={toggleOfflineSimulation} />
                    <div className={`block w-8 h-4 rounded-full ${isSimulatingOffline ? 'bg-danger' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition transform ${isSimulatingOffline ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">Simulate Offline</span>
                </label>
                
                {!isOnline && pendingCount > 0 && (
                  <button 
                    onClick={syncNow}
                    className="ml-2 p-1 text-primary hover:bg-blue-50 rounded"
                    title="Force Sync Now"
                  >
                    <CloudSync size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900 leading-tight">{currentUser.name}</div>
                <div className="text-xs text-primary font-medium">{currentUser.role}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-sm border border-blue-200">
                {currentUser.name.charAt(0)}
              </div>
              {installPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  title="Install App to Desktop or Tablet"
                >
                  <Download size={14} />
                  Install App
                </button>
              )}

              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 px-2 py-1.5 rounded transition-colors"
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
