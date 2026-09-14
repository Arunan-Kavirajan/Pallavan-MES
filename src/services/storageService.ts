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
    return await db.entries.get(id);
  },

  async getAllEntries(): Promise<ProductionEntry[]> {
    return await db.entries.toArray();
  },

  async getEntriesByDateAndShift(date: string, shift: string): Promise<ProductionEntry[]> {
    return await db.entries.where({ entryDate: date, shift }).toArray();
  },

  async checkDuplicate(machineId: string, entryDate: string, shift: string, hourSlot: string, currentId?: string): Promise<ProductionEntry | undefined> {
    const existing = await db.entries.where({
      machineId,
      entryDate,
      shift,
      hourSlot
    }).first();

    if (existing && existing.id !== currentId) {
      return existing;
    }
    return undefined;
  },

  async deleteEntry(id: string): Promise<void> {
    await db.entries.delete(id);
  }
};
