import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { ProductionEntry, EntryStatus } from '../../types/domain';
import { StatusBadge, SyncBadge } from '../common/StatusBadge';
import { format } from 'date-fns';
import { SHIFT_HOURS, MACHINES, SHIFTS } from '../../constants/seededData';
import EntryDetailModal from './EntryDetailModal';
import { Filter, Trash2, Database, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { useSync } from '../../contexts/SyncContext';
import { useLiveQuery } from 'dexie-react-hooks';

interface Props {
  onEdit: (id: string) => void;
}

export default function EntryList({ onEdit }: Props) {
  const { currentUser } = useAuth();
  const { pendingCount } = useSync();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | EntryStatus>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [machineFilter, setMachineFilter] = useState<string>('ALL');
  
  const [selectedEntry, setSelectedEntry] = useState<ProductionEntry | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    idToDelete: string | null;
  }>({ isOpen: false, idToDelete: null });

  // Reactive live query that instantly updates when Firebase pushes new data to Dexie
  const entries = useLiveQuery(async () => {
    let all = await StorageService.getAllEntries();
    
    // RBAC logic: Operator only sees their own entries
    if (currentUser.role === 'Operator') {
      all = all.filter(e => e.operatorId === currentUser.id);
    } else {
      // Supervisors and Managers should NOT see Drafts. Drafts are private to operators until submitted.
      all = all.filter(e => e.status !== 'Draft');
    }
    
    // Sort descending by last modified
    all.sort((a, b) => b.lastModified - a.lastModified);
    return all;
    }, [currentUser]);

  const safeEntries = entries || [];
  const loading = entries === undefined;

  // Tab counts
  const counts = useMemo(() => {
    return {
      ALL: safeEntries.length,
      Draft: safeEntries.filter(e => e.status === 'Draft').length,
      Submitted: safeEntries.filter(e => e.status === 'Submitted').length,
      Approved: safeEntries.filter(e => e.status === 'Approved').length,
      Returned: safeEntries.filter(e => e.status === 'Returned').length,
    };
  }, [safeEntries]);

  // Filtered array
  const filtered = useMemo(() => {
    let result = [...safeEntries];

    if (statusFilter !== 'ALL') {
      result = result.filter(e => e.status === statusFilter);
    }
    if (shiftFilter !== 'ALL') {
      result = result.filter(e => e.shift === shiftFilter);
    }
    if (machineFilter !== 'ALL') {
      result = result.filter(e => e.machineId === machineFilter);
    }

    return result;
  }, [safeEntries, statusFilter, shiftFilter, machineFilter]);

  const handleModalClose = (wasUpdated: boolean) => {
    setSelectedEntry(null);
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, idToDelete: id });
  };

  const confirmDelete = async () => {
    const id = confirmDialog.idToDelete;
    if (!id) return;
    
    setConfirmDialog({ isOpen: false, idToDelete: null });
    
    try {
      await StorageService.deleteEntry(id);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Failed to delete draft: ' + err.message);
    }
  };

    const getHourLabel = (shift: 'A'|'B'|'C', slotId: string) => {
    const slot = SHIFT_HOURS[shift]?.find(s => s.id === slotId);
    return slot ? slot.label : slotId;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded-lg w-full md:w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-full md:w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-full md:w-1/3"></div>
        </div>
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Filter & Action Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-xs">
          {(['ALL', 'Draft', 'Submitted', 'Approved', 'Returned'] as const)
            .filter(tab => tab !== 'Draft' || currentUser.role === 'Operator')
            .map(tab => {
            const count = counts[tab as keyof typeof counts];
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab === 'ALL' ? 'All Entries' : tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shift & Machine Dropdowns + Demo Data Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-md p-1.5 focus:ring-primary focus:border-primary text-gray-700"
          >
            <option value="ALL">All Shifts</option>
            {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
          </select>

          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-md p-1.5 focus:ring-primary focus:border-primary text-gray-700"
          >
            <option value="ALL">All Machines</option>
            {MACHINES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

      </div>

      {/* Entries Table */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="font-medium text-gray-700">No matching entries found</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter !== 'ALL' || shiftFilter !== 'ALL' || machineFilter !== 'ALL'
              ? 'Try resetting your filters to see more entries.'
              : currentUser.role === 'Operator'
              ? 'Click "New Entry" above to start logging your shift production.'
              : 'Switch persona or reload demo data.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Date & Shift Slot</th>
                <th className="px-6 py-3 text-left">Machine</th>
                <th className="px-6 py-3 text-left">Part Number</th>
                {currentUser.role !== 'Operator' && (
                  <th className="px-6 py-3 text-left">Operator</th>
                )}
                <th className="px-6 py-3 text-right">Prod / Rej</th>
                <th className="px-6 py-3 text-right">Achievement</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {filtered.map((entry) => (
                <tr 
                  key={entry.id} 
                  onClick={() => setSelectedEntry(entry)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{format(new Date(entry.entryDate), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-gray-500">Shift {entry.shift} • {getHourLabel(entry.shift, entry.hourSlot)}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {entry.machineId}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-600">
                    {entry.partNumber}
                  </td>

                  {currentUser.role !== 'Operator' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.operatorName}
                    </td>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="font-bold text-gray-900">{entry.producedQuantity} pcs</div>
                    <div className={`text-xs ${entry.rejectedQuantity > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      {entry.rejectedQuantity} rej ({entry.rejectionPercentage}%)
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    <div className={entry.achievementPercentage >= 100 ? 'text-green-600 font-bold' : 'text-gray-700'}>
                      {entry.achievementPercentage}%
                    </div>
                    <div className="text-[10px] text-gray-400">Target: {entry.plannedQuantity}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StatusBadge status={entry.status} />
                      <SyncBadge syncStatus={entry.syncStatus} />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {currentUser.role === 'Operator' && (entry.status === 'Draft' || entry.status === 'Returned') ? (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(entry.id); }} 
                            className="text-primary hover:text-primary-dark font-medium text-xs bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                          >
                            Edit
                          </button>
                          {entry.status === 'Draft' && (
                            <button 
                              type="button"
                              onClick={(e) => initiateDelete(entry.id, e)} 
                              className="text-red-600 hover:text-red-800 p-2 ml-1 cursor-pointer"
                              title="Delete Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry); }} 
                          className={`text-xs px-2.5 py-1 rounded font-medium ${
                            currentUser.role === 'Supervisor' && entry.status === 'Submitted'
                              ? 'bg-primary text-white hover:bg-primary-dark'
                              : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {currentUser.role === 'Supervisor' && entry.status === 'Submitted' ? 'Review & Sign' : 'View'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEntry && (
        <EntryDetailModal 
          entry={selectedEntry} 
          onClose={() => handleModalClose(false)}
          onUpdated={() => handleModalClose(true)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Draft"
        message="Are you sure you want to delete this draft entry? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, idToDelete: null })}
      />
    </>
  );
}
