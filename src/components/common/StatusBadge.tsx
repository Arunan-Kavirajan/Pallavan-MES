import React from 'react';
import { EntryStatus, SyncStatus } from '../../types/domain';
import { CheckCircle, Clock, AlertCircle, FileEdit, CloudOff } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';

export const StatusBadge: React.FC<{ status: EntryStatus }> = ({ status }) => {
  switch (status) {
    case 'Draft':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FileEdit size={12} className="mr-1" /> Draft
        </span>
      );
    case 'Submitted':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock size={12} className="mr-1" /> Submitted
        </span>
      );
    case 'Approved':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" /> Approved
        </span>
      );
    case 'Returned':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle size={12} className="mr-1" /> Returned
        </span>
      );
    default:
      return null;
  }
};

export const SyncBadge: React.FC<{ syncStatus: SyncStatus }> = ({ syncStatus }) => {
  if (!firebaseService.isEnabled) return null; // Don't show sync badges if no cloud configured
  
  if (syncStatus === 'synced') return null; // Don't clutter UI if synced

  if (syncStatus === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 ml-2 border border-amber-200" title="Waiting for network to sync to cloud">
        <CloudOff size={10} className="mr-1" /> Pending Sync
      </span>
    );
  }

  if (syncStatus === 'conflict') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 ml-2 border border-red-200">
        <AlertCircle size={10} className="mr-1" /> Sync Error
      </span>
    );
  }

  return null;
};
