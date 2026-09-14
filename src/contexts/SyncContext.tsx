import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/storageService';

interface SyncContextType {
  isOnline: boolean;
  isSimulatingOffline: boolean;
  toggleOfflineSimulation: () => void;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Real offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count whenever db changes
  useEffect(() => {
    const updateCount = async () => {
      const count = await db.entries.where('syncStatus').equals('pending').count();
      setPendingCount(count);
    };
    
    updateCount();
    
    const updateFn = () => { setTimeout(updateCount, 50); };
    
    // Subscribe to dexie mutations
    db.entries.hook('creating', updateFn);
    db.entries.hook('updating', updateFn);
    db.entries.hook('deleting', updateFn);
    
    return () => {
      db.entries.hook('creating').unsubscribe(updateFn);
      db.entries.hook('updating').unsubscribe(updateFn);
      db.entries.hook('deleting').unsubscribe(updateFn);
    };
  }, []);

  const effectivelyOnline = isOnline && !isSimulatingOffline;

  const toggleOfflineSimulation = () => {
    setIsSimulatingOffline(prev => !prev);
  };

  const syncNow = async () => {
    if (!effectivelyOnline) return;
    
    // In a real app, this would push to backend API and pull changes.
    // For this offline-first local app, syncing just means resolving 'pending' to 'synced'
    // after simulating network latency.
    
    const pendingEntries = await db.entries.where('syncStatus').equals('pending').toArray();
    if (pendingEntries.length === 0) return;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    await db.transaction('rw', db.entries, async () => {
      for (const entry of pendingEntries) {
        await db.entries.update(entry.id, { syncStatus: 'synced' });
      }
    });
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (effectivelyOnline && pendingCount > 0) {
      syncNow();
    }
  }, [effectivelyOnline, pendingCount]);

  return (
    <SyncContext.Provider value={{
      isOnline: effectivelyOnline,
      isSimulatingOffline,
      toggleOfflineSimulation,
      pendingCount,
      syncNow
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
