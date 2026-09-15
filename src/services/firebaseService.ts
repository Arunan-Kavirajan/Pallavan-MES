import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, deleteDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { ProductionEntry } from '../types/domain';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  public db: Firestore | null = null;
  public isEnabled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Only initialize if we have the minimal config required
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.isEnabled = true;
        console.log('[Firebase] Cloud Sync Engine Initialized.');
      } catch (err) {
        console.warn('[Firebase] Initialization failed:', err);
      }
    } else {
      console.info('[Firebase] Missing VITE_FIREBASE_API_KEY in .env. Operating in Local-First emulation mode.');
    }
  }

  /**
   * Pushes a synced entry to Cloud Firestore.
   * If Firebase is disabled (emulation mode), silently simulates success.
   */
  async syncEntryToCloud(entry: ProductionEntry): Promise<void> {
    if (!this.isEnabled || !this.db) {
      throw new Error("Firebase is not configured. Entry remains pending for retroactive sync.");
    }

    try {
      const entryRef = doc(this.db, 'production_entries', entry.id);
      
      if (entry.isDeleted) {
        await deleteDoc(entryRef);
        return;
      }
      
      // Firebase Firestore crashes if it encounters `undefined` values.
      // We must strip undefined keys from the object.
      const cleanEntry = Object.fromEntries(
        Object.entries(entry).filter(([_, v]) => v !== undefined)
      );

      await setDoc(entryRef, {
        ...cleanEntry,
        _cloudSyncedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (err) {
      console.error('[Firebase] Failed to sync entry to cloud:', err);
      throw err; // Let the local sync manager handle the retry logic
    }
  }

  /**
   * Listens for real-time changes on Firebase and syncs them DOWN to the local database.
   * Returns an unsubscribe function.
   */
  subscribeToChanges(onUpdate: (entries: ProductionEntry[]) => void): () => void {
    if (!this.isEnabled || !this.db) return () => {};

    const q = collection(this.db, 'production_entries');
      return onSnapshot(q, (snapshot) => {
        const entries: ProductionEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as ProductionEntry;
          
          // Auto-delete completely corrupted records directly from the cloud
          if (!data.entryDate || !data.machineId || !data.shift || !data.status) {
            console.warn(`[Firebase] Destroying irreparably corrupted cloud record: ${docSnap.id}`);
            deleteDoc(doc(this.db!, 'production_entries', docSnap.id)).catch(console.error);
            return; // Skip adding to Dexie
          }

          // Explicitly enforce the ID from the document key
          data.id = docSnap.id;
          // Strip Firebase Timestamp objects because they cause DataError in IndexedDB
          if ('_cloudSyncedAt' in data) {
            delete (data as any)._cloudSyncedAt;
          }
          entries.push(data);
        });
        onUpdate(entries);
      }, (error) => {
      console.error('[Firebase] Snapshot sync error:', error);
    });
  }
}

export const firebaseService = new FirebaseService();
