import { User, Machine, Part, Shift, HourSlot } from '../types/domain';

export const SEEDED_USERS: User[] = [
  { id: 'OP-01', name: 'Ramesh Kumar', role: 'Operator' },
  { id: 'OP-02', name: 'Suresh Patel', role: 'Operator' },
  { id: 'SUP-01', name: 'Anitha Sharma', role: 'Supervisor' },
  { id: 'SUP-02', name: 'Balaji Natarajan', role: 'Supervisor' },
  { id: 'MGR-01', name: 'Karthik Venkatesh', role: 'Manager' },
  { id: 'MGR-02', name: 'Divya Murugan', role: 'Manager' },
];

export const MACHINES: Machine[] = [
  { id: 'PPW-CNC-01', name: 'PPW-CNC-01' },
  { id: 'PPW-CNC-02', name: 'PPW-CNC-02' },
  { id: 'PPW-VMC-03', name: 'PPW-VMC-03' },
  { id: 'PPW-LATHE-04', name: 'PPW-LATHE-04' },
  { id: 'PPW-GRIND-05', name: 'PPW-GRIND-05' },
];

export const PARTS: Part[] = [
  { id: 'PN-4471-A', name: 'PN-4471-A' },
  { id: 'PN-4471-B', name: 'PN-4471-B' },
  { id: 'PN-8802', name: 'PN-8802' },
  { id: 'PN-9130-X', name: 'PN-9130-X' },
  { id: 'PN-2256', name: 'PN-2256' },
];

export const SHIFTS: Shift[] = ['A', 'B', 'C'];

export const SHIFT_HOURS: Record<Shift, HourSlot[]> = {
  A: [
    { id: 'A-1', label: '06:00 - 07:00' },
    { id: 'A-2', label: '07:00 - 08:00' },
    { id: 'A-3', label: '08:00 - 09:00' },
    { id: 'A-4', label: '09:00 - 10:00' },
    { id: 'A-5', label: '10:00 - 11:00' },
    { id: 'A-6', label: '11:00 - 12:00' },
    { id: 'A-7', label: '12:00 - 13:00' },
    { id: 'A-8', label: '13:00 - 14:00' },
  ],
  B: [
    { id: 'B-1', label: '14:00 - 15:00' },
    { id: 'B-2', label: '15:00 - 16:00' },
    { id: 'B-3', label: '16:00 - 17:00' },
    { id: 'B-4', label: '17:00 - 18:00' },
    { id: 'B-5', label: '18:00 - 19:00' },
    { id: 'B-6', label: '19:00 - 20:00' },
    { id: 'B-7', label: '20:00 - 21:00' },
    { id: 'B-8', label: '21:00 - 22:00' },
  ],
  C: [
    { id: 'C-1', label: '22:00 - 23:00' },
    { id: 'C-2', label: '23:00 - 00:00' },
    { id: 'C-3', label: '00:00 - 01:00 (+1d)' },
    { id: 'C-4', label: '01:00 - 02:00 (+1d)' },
    { id: 'C-5', label: '02:00 - 03:00 (+1d)' },
    { id: 'C-6', label: '03:00 - 04:00 (+1d)' },
    { id: 'C-7', label: '04:00 - 05:00 (+1d)' },
    { id: 'C-8', label: '05:00 - 06:00 (+1d)' },
  ],
};

export const REJECTION_REASONS = [
  'Dimensional',
  'Surface finish',
  'Burr',
  'Material defect',
  'Setup error',
  'Other',
];
