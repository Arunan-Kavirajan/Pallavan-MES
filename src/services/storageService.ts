import Dexie, { Table } from 'dexie';
import { ProductionEntry } from '../types/domain';
import { format, subDays } from 'date-fns';

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

// SVG placeholder signature for seeded approved entries
const SAMPLE_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAA8CAYAAACEFv7+AAAAPUlEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4Gq9SAAGw70S8AAAAAElFTkSuQmCC";

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
  },

  async seedDemoDataIfEmpty(): Promise<boolean> {
    const count = await db.entries.count();
    if (count > 0) return false;
    await this.loadDemoData();
    return true;
  },

  async loadDemoData(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');

    const demoEntries: ProductionEntry[] = [
      // 1. Ready for Supervisor Review (Submitted) - Ramesh Kumar
      {
        id: 'demo-entry-1',
        entryDate: today,
        shift: 'A',
        hourSlot: 'A-1',
        machineId: 'PPW-CNC-01',
        partNumber: 'PN-4471-A',
        operatorId: 'OP-01',
        operatorName: 'Ramesh Kumar',
        plannedQuantity: 100,
        producedQuantity: 98,
        rejectedQuantity: 3,
        rejectionReason: 'Burr',
        downtimeMinutes: 5,
        downtimeReason: 'Minor coolant top-up',
        remarks: 'Normal operation during morning start',
        acceptedQuantity: 95,
        rejectionPercentage: 3.1,
        achievementPercentage: 95.0,
        runningTime: 55,
        status: 'Submitted',
        syncStatus: 'synced',
        lastModified: Date.now() - 3600000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'SUBMITTED'
          }
        ]
      },
      // 2. High Rejection Submitted with Remark - Suresh Patel
      {
        id: 'demo-entry-2',
        entryDate: today,
        shift: 'A',
        hourSlot: 'A-2',
        machineId: 'PPW-CNC-02',
        partNumber: 'PN-4471-B',
        operatorId: 'OP-02',
        operatorName: 'Suresh Patel',
        plannedQuantity: 80,
        producedQuantity: 75,
        rejectedQuantity: 10,
        rejectionReason: 'Dimensional',
        downtimeMinutes: 15,
        downtimeReason: 'Tooling wear offset adjustment',
        remarks: 'Batch raw material hardness exceeded tolerance. Tool offset recalibrated after piece #50.',
        acceptedQuantity: 65,
        rejectionPercentage: 13.3,
        achievementPercentage: 81.3,
        runningTime: 45,
        status: 'Submitted',
        syncStatus: 'synced',
        lastModified: Date.now() - 3000000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 2800000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'SUBMITTED'
          }
        ]
      },
      // 3. In Draft state for Ramesh to edit or submit
      {
        id: 'demo-entry-3',
        entryDate: today,
        shift: 'A',
        hourSlot: 'A-3',
        machineId: 'PPW-VMC-03',
        partNumber: 'PN-8802',
        operatorId: 'OP-01',
        operatorName: 'Ramesh Kumar',
        plannedQuantity: 60,
        producedQuantity: 58,
        rejectedQuantity: 1,
        rejectionReason: 'Surface finish',
        downtimeMinutes: 0,
        downtimeReason: undefined,
        remarks: 'Hourly run in progress',
        acceptedQuantity: 57,
        rejectionPercentage: 1.7,
        achievementPercentage: 95.0,
        runningTime: 60,
        status: 'Draft',
        syncStatus: 'synced',
        lastModified: Date.now() - 1000000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 1000000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'CREATED'
          }
        ]
      },
      // 4. Returned to Operator for Correction
      {
        id: 'demo-entry-4',
        entryDate: today,
        shift: 'A',
        hourSlot: 'A-4',
        machineId: 'PPW-LATHE-04',
        partNumber: 'PN-9130-X',
        operatorId: 'OP-02',
        operatorName: 'Suresh Patel',
        plannedQuantity: 50,
        producedQuantity: 40,
        rejectedQuantity: 8,
        rejectionReason: 'Setup error',
        downtimeMinutes: 30,
        downtimeReason: 'Chuck alignment re-centering',
        remarks: 'Initial setup needed verification',
        acceptedQuantity: 32,
        rejectionPercentage: 20.0,
        achievementPercentage: 64.0,
        runningTime: 30,
        status: 'Returned',
        syncStatus: 'synced',
        lastModified: Date.now() - 1800000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 5000000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 4000000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'SUBMITTED'
          },
          {
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            userId: 'SUP-01',
            userName: 'Anitha Sharma',
            userRole: 'Supervisor',
            action: 'RETURNED',
            notes: 'Setup error caused 20% scrap. Please confirm if alignment pins were checked before running remaining parts.'
          }
        ]
      },
      // 5. Approved entry with digital signature (Yesterday)
      {
        id: 'demo-entry-5',
        entryDate: yesterday,
        shift: 'A',
        hourSlot: 'A-1',
        machineId: 'PPW-GRIND-05',
        partNumber: 'PN-2256',
        operatorId: 'OP-01',
        operatorName: 'Ramesh Kumar',
        plannedQuantity: 120,
        producedQuantity: 118,
        rejectedQuantity: 2,
        rejectionReason: 'Material defect',
        downtimeMinutes: 10,
        downtimeReason: 'Wheel dressing',
        remarks: 'Smooth operation',
        acceptedQuantity: 116,
        rejectionPercentage: 1.7,
        achievementPercentage: 96.7,
        runningTime: 50,
        status: 'Approved',
        syncStatus: 'synced',
        lastModified: Date.now() - 86400000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 90000000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 88000000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'SUBMITTED'
          },
          {
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            userId: 'SUP-01',
            userName: 'Anitha Sharma',
            userRole: 'Supervisor',
            action: 'APPROVED',
            signatureDataUrl: SAMPLE_SIGNATURE
          }
        ]
      },
      // 6. Approved entry from Shift B (Yesterday)
      {
        id: 'demo-entry-6',
        entryDate: yesterday,
        shift: 'B',
        hourSlot: 'B-1',
        machineId: 'PPW-CNC-01',
        partNumber: 'PN-4471-A',
        operatorId: 'OP-02',
        operatorName: 'Suresh Patel',
        plannedQuantity: 110,
        producedQuantity: 108,
        rejectedQuantity: 4,
        rejectionReason: 'Burr',
        downtimeMinutes: 0,
        downtimeReason: undefined,
        remarks: 'Shift B handover clean',
        acceptedQuantity: 104,
        rejectionPercentage: 3.7,
        achievementPercentage: 94.5,
        runningTime: 60,
        status: 'Approved',
        syncStatus: 'synced',
        lastModified: Date.now() - 70000000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 75000000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 72000000).toISOString(),
            userId: 'OP-02',
            userName: 'Suresh Patel',
            userRole: 'Operator',
            action: 'SUBMITTED'
          },
          {
            timestamp: new Date(Date.now() - 70000000).toISOString(),
            userId: 'SUP-02',
            userName: 'Balaji Natarajan',
            userRole: 'Supervisor',
            action: 'APPROVED',
            signatureDataUrl: SAMPLE_SIGNATURE
          }
        ]
      },
      // 7. Approved entry from Shift C (Two days ago)
      {
        id: 'demo-entry-7',
        entryDate: twoDaysAgo,
        shift: 'C',
        hourSlot: 'C-1',
        machineId: 'PPW-CNC-02',
        partNumber: 'PN-4471-B',
        operatorId: 'OP-01',
        operatorName: 'Ramesh Kumar',
        plannedQuantity: 90,
        producedQuantity: 88,
        rejectedQuantity: 3,
        rejectionReason: 'Dimensional',
        downtimeMinutes: 20,
        downtimeReason: 'Hydraulic pressure fluctuation',
        remarks: 'Pressure regulator replaced during downtime',
        acceptedQuantity: 85,
        rejectionPercentage: 3.4,
        achievementPercentage: 94.4,
        runningTime: 40,
        status: 'Approved',
        syncStatus: 'synced',
        lastModified: Date.now() - 170000000,
        auditTrail: [
          {
            timestamp: new Date(Date.now() - 175000000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'CREATED'
          },
          {
            timestamp: new Date(Date.now() - 172000000).toISOString(),
            userId: 'OP-01',
            userName: 'Ramesh Kumar',
            userRole: 'Operator',
            action: 'SUBMITTED'
          },
          {
            timestamp: new Date(Date.now() - 170000000).toISOString(),
            userId: 'SUP-01',
            userName: 'Anitha Sharma',
            userRole: 'Supervisor',
            action: 'APPROVED',
            signatureDataUrl: SAMPLE_SIGNATURE
          }
        ]
      }
    ];

    await db.entries.bulkPut(demoEntries);
  }
};
