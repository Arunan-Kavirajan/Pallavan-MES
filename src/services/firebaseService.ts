import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
      // Emulation mode - zero config required!
      return Promise.resolve();
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
}

export const firebaseService = new FirebaseService();
