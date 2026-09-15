import React, { useState } from 'react';
import Modal from '../common/Modal';
import { ProductionEntry } from '../../types/domain';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { format } from 'date-fns';
import { SHIFT_HOURS } from '../../constants/seededData';
import ReturnModal from './ReturnModal';
import SignaturePadModal from '../approval/SignaturePadModal';
import { StorageService } from '../../services/storageService';

interface Props {
  entry: ProductionEntry;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EntryDetailModal({ entry, onClose, onUpdated }: Props) {
  const { currentUser } = useAuth();
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const slotLabel = SHIFT_HOURS[entry.shift].find(s => s.id === entry.hourSlot)?.label || entry.hourSlot;

  const safeFormatDate = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      return format(new Date(dateStr), formatStr);
    } catch (e) {
      return dateStr || 'Invalid';
    }
  };

  const handleApprove = async (signatureDataUrl: string) => {
    const updated = { ...entry };
    updated.status = 'Approved';
    updated.auditTrail = [...entry.auditTrail, {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'APPROVED',
      signatureDataUrl
    }];
    updated.syncStatus = 'pending'; // Requires sync
    updated.lastModified = Date.now();
    
    await StorageService.saveEntry(updated);
    setShowSignatureModal(false);
    onUpdated();
  };

  const handleReturn = async (remark: string) => {
    const updated = { ...entry };
    updated.status = 'Returned';
    updated.auditTrail = [...entry.auditTrail, {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'RETURNED',
      notes: remark
    }];
    updated.syncStatus = 'pending';
    updated.lastModified = Date.now();
    
    await StorageService.saveEntry(updated);
    setShowReturnModal(false);
    onUpdated();
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Production Entry Details" maxWidth="max-w-4xl">
        
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{entry.machineId}</h2>
              <p className="text-gray-500 text-sm">
                {safeFormatDate(entry.entryDate, 'EEEE, MMMM do yyyy')} • Shift {entry.shift} • {slotLabel}
              </p>
          </div>
          <div className="text-right">
            <StatusBadge status={entry.status} />
            <div className="text-sm mt-1 text-gray-500">Op: {entry.operatorName}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">Production Data</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Part Number</span><span className="font-medium">{entry.partNumber}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Planned Target</span><span className="font-medium">{entry.plannedQuantity}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Total Produced</span><span className="font-medium">{entry.producedQuantity}</span></div>
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Total Rejected</span><span className={`font-medium ${entry.rejectedQuantity > 0 ? 'text-danger' : ''}`}>{entry.rejectedQuantity}</span></div>
              {entry.rejectedQuantity > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Rejection Reason</span><span className="font-medium text-danger">{entry.rejectionReason}</span></div>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-1">Machine Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Downtime</span><span className="font-medium">{entry.downtimeMinutes} min</span></div>
              {entry.downtimeMinutes > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-50"><span className="text-gray-500">Downtime Reason</span><span className="font-medium text-warning">{entry.downtimeReason}</span></div>
              )}
              {entry.remarks && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-gray-700 italic border border-gray-200">"{entry.remarks}"</div>
              )}
            </div>
          </div>

          <div>
             <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">Calculated Metrics</h3>
             <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Accepted</div>
                  <div className="text-lg font-bold">{entry.acceptedQuantity}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Achievement</div>
                  <div className="text-lg font-bold">{entry.achievementPercentage}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Rejection Rate</div>
                  <div className={`text-lg font-bold ${entry.rejectionPercentage > 10 ? 'text-danger' : ''}`}>{entry.rejectionPercentage}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs text-gray-500">Running Time</div>
                  <div className="text-lg font-bold">{entry.runningTime} min</div>
                </div>
             </div>

             <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Audit Trail Timeline</h3>
             <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 max-h-64 overflow-y-auto pr-2 pb-2">
               {entry.auditTrail.map((log, idx) => {
                 let bgColor = 'bg-gray-100 border-gray-300 text-gray-500';
                 if (log.action === 'CREATED') bgColor = 'bg-blue-100 border-blue-300 text-blue-600';
                 if (log.action === 'SUBMITTED') bgColor = 'bg-purple-100 border-purple-300 text-purple-600';
                 if (log.action === 'APPROVED') bgColor = 'bg-green-100 border-green-300 text-green-600';
                 if (log.action === 'RETURNED') bgColor = 'bg-red-100 border-red-300 text-red-600';

                 return (
                   <div key={idx} className="relative pl-6">
                     <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${bgColor}`} />
                     <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 shadow-xs">
                       <div className="flex justify-between items-start mb-1.5">
                         <div>
                           <span className={`text-xs font-bold uppercase tracking-wider ${bgColor.split(' ')[2]}`}>
                             {log.action}
                           </span>
                           <span className="text-xs text-gray-600 ml-2 font-medium">by {log.userName}</span>
                           <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
                             {log.userRole}
                           </span>
                         </div>
                         <span className="text-[10px] text-gray-400 font-mono">
                           {safeFormatDate(log.timestamp, 'MMM dd, HH:mm:ss')}
                         </span>
                       </div>
                       {log.notes && (
                         <div className="text-xs text-gray-700 bg-white border border-gray-200 p-2 rounded-md italic mt-2 shadow-xs">
                           "{log.notes}"
                         </div>
                       )}
                       {log.signatureDataUrl && (
                         <div className="mt-3 bg-white p-2 border border-gray-200 rounded-md inline-block shadow-xs">
                           <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1 font-semibold">Verified Digital Signature</span>
                           <img src={log.signatureDataUrl} alt="Signature" className="h-10 mix-blend-multiply" />
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Close
          </button>
          
          {currentUser.role === 'Supervisor' && entry.status === 'Submitted' && (
            <>
              <button 
                onClick={() => setShowReturnModal(true)} 
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
              >
                Return to Operator
              </button>
              <button 
                onClick={() => setShowSignatureModal(true)} 
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Sign & Approve
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modals for Supervisor Actions */}
      <ReturnModal 
        isOpen={showReturnModal} 
        onClose={() => setShowReturnModal(false)} 
        onConfirm={handleReturn} 
      />

      {showSignatureModal && (
        <SignaturePadModal 
          onClose={() => setShowSignatureModal(false)}
          onSign={handleApprove}
        />
      )}
    </>
  );
}
