export type Role = 'Operator' | 'Supervisor' | 'Manager';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type Shift = 'A' | 'B' | 'C';

export interface AuditLog {
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: Role;
  action: 'CREATED' | 'UPDATED' | 'SUBMITTED' | 'APPROVED' | 'RETURNED';
  notes?: string;
  signatureDataUrl?: string; // Stored upon approval
}

export type EntryStatus = 'Draft' | 'Submitted' | 'Approved' | 'Returned';
export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface ProductionEntry {
  id: string; // uuid
  // Composite Key fields
  entryDate: string; // YYYY-MM-DD
  shift: Shift;
  hourSlot: string;
  machineId: string;
  
  // Data fields
  partNumber: string;
  operatorId: string;
  operatorName: string; // Denormalized for simpler history
  
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  
  downtimeMinutes: number;
  downtimeReason?: string;
  
  remarks?: string;

  // Calculated fields (stored for immutable historical record and easy querying, 
  // though they can be derived on the fly)
  acceptedQuantity: number;
  rejectionPercentage: number; // 0.0 to 100.0
  achievementPercentage: number; // 0.0 to 100+
  runningTime: number; // minutes

  // State Management
  status: EntryStatus;
  auditTrail: AuditLog[];
  
  // Offline Sync Management
  syncStatus: SyncStatus;
  lastModified: number; // Unix timestamp for conflict resolution

  isDeleted?: boolean; // Soft delete flag for cloud sync
}

export interface Machine {
  id: string;
  name: string;
}

export interface Part {
  id: string;
  name: string;
}

export interface HourSlot {
  id: string;
  label: string;
}
