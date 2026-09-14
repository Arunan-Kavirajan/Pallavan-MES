import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { ProductionEntry } from '../../types/domain';
import { StatusBadge, SyncBadge } from '../common/StatusBadge';
import { format } from 'date-fns';
import { SHIFT_HOURS } from '../../constants/seededData';
import EntryDetailModal from './EntryDetailModal';

interface Props {
  onEdit: (id: string) => void;
}

export default function EntryList({ onEdit }: Props) {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEntry, setSelectedEntry] = useState<ProductionEntry | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    let all = await StorageService.getAllEntries();
    
    // RBAC logic
    if (currentUser.role === 'Operator') {
      all = all.filter(e => e.operatorId === currentUser.id);
    }
    
    // Sort descending by date/shift/slot
    all.sort((a, b) => b.lastModified - a.lastModified);
    
    setEntries(all);
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [currentUser]);

  // When returning from details, refresh
  const handleModalClose = (wasUpdated: boolean) => {
    setSelectedEntry(null);
    if (wasUpdated) loadEntries();
  };

  const getHourLabel = (shift: 'A'|'B'|'C', slotId: string) => {
    const slot = SHIFT_HOURS[shift].find(s => s.id === slotId);
    return slot ? slot.label : slotId;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading entries...</div>;

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        No production entries found.
        {currentUser.role === 'Operator' && <p className="mt-2">Click "New Entry" to record production.</p>}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
              {currentUser.role !== 'Operator' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prod / Rej</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{format(new Date(entry.entryDate), 'MMM dd, yyyy')}</div>
                  <div className="text-xs text-gray-500">Shift {entry.shift} • {getHourLabel(entry.shift, entry.hourSlot)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entry.machineId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.partNumber}
                </td>
                {currentUser.role !== 'Operator' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.operatorName}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="font-medium text-gray-900">{entry.producedQuantity}</div>
                  <div className={`text-xs ${entry.rejectedQuantity > 0 ? 'text-danger' : 'text-gray-400'}`}>
                    {entry.rejectedQuantity} rej ({entry.rejectionPercentage}%)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={entry.status} />
                  <SyncBadge syncStatus={entry.syncStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Action logic based on role and status */}
                  {currentUser.role === 'Operator' && (entry.status === 'Draft' || entry.status === 'Returned') ? (
                    <button onClick={() => onEdit(entry.id)} className="text-primary hover:text-primary-dark">Edit</button>
                  ) : (
                    <button onClick={() => setSelectedEntry(entry)} className="text-gray-600 hover:text-gray-900">
                      {currentUser.role === 'Supervisor' && entry.status === 'Submitted' ? 'Review' : 'View'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEntry && (
        <EntryDetailModal 
          entry={selectedEntry} 
          onClose={() => handleModalClose(false)}
          onUpdated={() => handleModalClose(true)}
        />
      )}
    </>
  );
}
