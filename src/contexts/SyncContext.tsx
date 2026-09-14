import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';

interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
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

  // Subscribe to cloud changes when online
  useEffect(() => {
    if (!isOnline) return;

    // This listener automatically pushes updates from Firebase down to IndexedDB
    const unsubscribe = firebaseService.subscribeToChanges(async (cloudEntries) => {
      // Import the storage service to perform bulk upsert
      const { StorageService } = await import('../services/storageService');
      await StorageService.upsertCloudEntries(cloudEntries);
    });

    return () => unsubscribe();
  }, [isOnline]);

  const syncNow = async () => {
    if (!isOnline) return;
    
    // 1. Fetch pending
    const allPending = await db.entries.where('syncStatus').equals('pending').toArray();
    
    // 2. Process (simulate network + push to Firebase)
    if (allPending.length > 0) {
      // Simulate base network latency
      await new Promise(r => setTimeout(r, 1000));
      
      for (const p of allPending) {
        try {
          await firebaseService.syncEntryToCloud(p);
          
          if (p.isDeleted) {
            await db.entries.delete(p.id);
          } else {
            await db.entries.update(p.id, { syncStatus: 'synced' });
          }
        } catch (err) {
          console.error('Failed to sync to cloud', err);
          // Leaves it pending
        }
      }
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncNow();
    }
  }, [isOnline, pendingCount]);

  return (
    <SyncContext.Provider value={{
      isOnline,
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
