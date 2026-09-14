import Dexie, { Table } from 'dexie';
import { ProductionEntry } from '../types/domain';

export class AppDatabase extends Dexie {
  entries!: Table<ProductionEntry, string>;

  constructor() {
    super('ApexFlowProductionDB');
    this.version(1).stores({
      entries: 'id, [machineId+entryDate+shift+hourSlot], entryDate, shift, status, syncStatus'
    });
  }
}

export const db = new AppDatabase();

export const StorageService = {
  async saveEntry(entry: ProductionEntry): Promise<void> {
    await db.entries.put(entry);
  },

  async getEntry(id: string): Promise<ProductionEntry | undefined> {
    const entry = await db.entries.get(id);
    if (entry?.isDeleted) return undefined;
    return entry;
  },

  async upsertCloudEntries(cloudEntries: ProductionEntry[]): Promise<void> {
    // Fetch all currently pending entries to protect them from being overwritten
    const pending = await db.entries.where('syncStatus').equals('pending').toArray();
    const pendingIds = new Set(pending.map(e => e.id));

    const toUpsert = cloudEntries.filter(e => !pendingIds.has(e.id)).map(e => {
      // Ensure cloud entries are marked as synced locally
      return { ...e, syncStatus: 'synced' as const };
    });

    if (toUpsert.length > 0) {
      await db.entries.bulkPut(toUpsert);
    }
  },

  async getAllEntries(): Promise<ProductionEntry[]> {
    const all = await db.entries.toArray();
    return all.filter(e => !e.isDeleted);
  },

  async getEntriesByDateAndShift(date: string, shift: string): Promise<ProductionEntry[]> {
    const entries = await db.entries.where({ entryDate: date, shift }).toArray();
    return entries.filter(e => !e.isDeleted);
  },

  async checkDuplicate(machineId: string, entryDate: string, shift: string, hourSlot: string, currentId?: string): Promise<ProductionEntry | undefined> {
    const entries = await db.entries.where({
      machineId,
      entryDate,
      shift,
      hourSlot
    }).toArray();
    
    // Ignore deleted entries, ignore the current entry being edited, and IGNORE DRAFTS from other users
    // so a pending draft doesn't lock up a slot for the whole factory.
    const existing = entries.find(e => !e.isDeleted && e.id !== currentId && e.status !== 'Draft');
    return existing;
  },

  async deleteEntry(id: string): Promise<void> {
    // Soft delete to ensure sync logic catches it and deletes from Firebase
    await db.entries.update(id, { 
      isDeleted: true, 
      syncStatus: 'pending',
      lastModified: Date.now()
    });
  }
};
