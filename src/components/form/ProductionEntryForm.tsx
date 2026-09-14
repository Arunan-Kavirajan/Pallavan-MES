import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { StorageService } from '../../services/storageService';
import { validateEntryForm, FormValues } from '../../utils/validation';
import { calculateAcceptedQuantity, calculateRejectionPercentage, calculateAchievementPercentage, calculateRunningTime } from '../../utils/calculations';
import { MACHINES, PARTS, SHIFTS, SHIFT_HOURS, REJECTION_REASONS } from '../../constants/seededData';
import { ProductionEntry, Shift, AuditLog } from '../../types/domain';
import LiveMetricsCard from './LiveMetricsCard';
import { format } from 'date-fns';
import { Save, Send, AlertTriangle } from 'lucide-react';

interface Props {
  entryId: string | null;
  onClose: () => void;
}

export default function ProductionEntryForm({ entryId, onClose }: Props) {
  const { currentUser } = useAuth();
  const { isOnline, isSimulatingOffline } = useSync();
  const effectivelyOnline = isOnline && !isSimulatingOffline;

  const [loading, setLoading] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  // The persistent DB model
  const [existingEntry, setExistingEntry] = useState<ProductionEntry | null>(null);

  // Form State
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<Shift>('A');
  const [hourSlot, setHourSlot] = useState(SHIFT_HOURS['A'][0].id);
  const [machineId, setMachineId] = useState(MACHINES[0].id);
  const [partNumber, setPartNumber] = useState(PARTS[0].id);
  
  const [values, setValues] = useState<FormValues>({
    plannedQuantity: '',
    producedQuantity: '',
    rejectedQuantity: '0',
    rejectionReason: '',
    downtimeMinutes: '0',
    downtimeReason: '',
    remarks: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Computed live metrics
  const p = Number(values.producedQuantity) || 0;
  const r = Number(values.rejectedQuantity) || 0;
  const pl = Number(values.plannedQuantity) || 0;
  const dt = Number(values.downtimeMinutes) || 0;

  const accepted = calculateAcceptedQuantity(p, r);
  const rejectionPct = calculateRejectionPercentage(p, r);
  const achievementPct = calculateAchievementPercentage(pl, accepted);
  const runningTime = calculateRunningTime(dt);

  // Auto-clear dependent fields when parent changes to 0
  useEffect(() => {
    if (r === 0 && values.rejectionReason) {
      setValues(v => ({ ...v, rejectionReason: '' }));
    }
  }, [r, values.rejectionReason]);

  useEffect(() => {
    if (dt === 0 && values.downtimeReason) {
      setValues(v => ({ ...v, downtimeReason: '' }));
    }
  }, [dt, values.downtimeReason]);

  // Load existing data if editing
  useEffect(() => {
    async function load() {
      if (entryId) {
        const entry = await StorageService.getEntry(entryId);
        if (entry) {
          setExistingEntry(entry);
          setEntryDate(entry.entryDate);
          setShift(entry.shift);
          setHourSlot(entry.hourSlot);
          setMachineId(entry.machineId);
          setPartNumber(entry.partNumber);
          setValues({
            plannedQuantity: entry.plannedQuantity.toString(),
            producedQuantity: entry.producedQuantity.toString(),
            rejectedQuantity: entry.rejectedQuantity.toString(),
            rejectionReason: entry.rejectionReason || '',
            downtimeMinutes: entry.downtimeMinutes.toString(),
            downtimeReason: entry.downtimeReason || '',
            remarks: entry.remarks || ''
          });
        }
      }
      setLoading(false);
    }
    load();
  }, [entryId]);

  // Dynamic shift hour list based on selected shift
  const currentShiftHours = useMemo(() => SHIFT_HOURS[shift], [shift]);
  
  // Update hour slot if shift changes and current slot is not in the new shift
  useEffect(() => {
    if (!currentShiftHours.find(h => h.id === hourSlot)) {
      setHourSlot(currentShiftHours[0].id);
    }
  }, [shift, currentShiftHours, hourSlot]);

  // Real-time duplication check
  useEffect(() => {
    async function checkDupe() {
      if (!entryDate || !shift || !hourSlot || !machineId) return;
      const dup = await StorageService.checkDuplicate(machineId, entryDate, shift, hourSlot, existingEntry?.id);
      if (dup) {
        setDuplicateWarning(`An entry already exists for this Machine, Date, Shift and Hour (${dup.status}).`);
      } else {
        setDuplicateWarning(null);
      }
    }
    checkDupe();
  }, [machineId, entryDate, shift, hourSlot, existingEntry]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const buildEntryToSave = (isSubmit: boolean): ProductionEntry => {
    const now = new Date().toISOString();
    
    let auditTrail = existingEntry ? [...existingEntry.auditTrail] : [];
    
    // Add create log if new
    if (!existingEntry) {
      auditTrail.push({
        timestamp: now,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CREATED'
      });
    } else {
       // Add update log if editing draft or returned
       auditTrail.push({
        timestamp: now,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATED'
      });
    }

    if (isSubmit) {
      auditTrail.push({
        timestamp: now,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SUBMITTED'
      });
    }

    const newStatus = isSubmit ? 'Submitted' : 'Draft';
    // If not online, and we are saving, it becomes pending sync.
    const newSyncStatus = effectivelyOnline ? 'synced' : 'pending';

    return {
      id: existingEntry?.id || uuidv4(),
      entryDate,
      shift,
      hourSlot,
      machineId,
      partNumber,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      
      plannedQuantity: pl,
      producedQuantity: p,
      rejectedQuantity: r,
      rejectionReason: r > 0 ? values.rejectionReason : undefined,
      
      downtimeMinutes: dt,
      downtimeReason: dt > 0 ? values.downtimeReason : undefined,
      
      remarks: values.remarks,

      acceptedQuantity: accepted,
      rejectionPercentage: rejectionPct,
      achievementPercentage: achievementPct,
      runningTime,

      status: newStatus,
      auditTrail,
      
      syncStatus: newSyncStatus,
      lastModified: Date.now()
    };
  };

  const handleSave = async (isSubmit: boolean) => {
    if (duplicateWarning) {
      alert("Cannot save. " + duplicateWarning);
      return;
    }

    const valResult = validateEntryForm(values, isSubmit);
    if (!valResult.isValid) {
      setErrors(valResult.errors);
      return;
    }

    const entryToSave = buildEntryToSave(isSubmit);
    await StorageService.saveEntry(entryToSave);
    onClose();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading form...</div>;

  const isReadOnly = currentUser.role !== 'Operator' || (existingEntry ? (existingEntry.status !== 'Draft' && existingEntry.status !== 'Returned') : false);

  return (
    <div className="p-6">
      
      {duplicateWarning && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
          <div>
            <h4 className="text-red-800 font-medium">Duplicate Entry Detected</h4>
            <p className="text-sm text-red-700">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {existingEntry?.status === 'Returned' && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="text-orange-800 font-medium mb-2">Entry Returned for Correction</h4>
          <div className="text-sm text-orange-700 space-y-2">
            {existingEntry.auditTrail.filter(a => a.action === 'RETURNED').reverse().map((log, idx) => (
              <div key={idx} className="bg-white p-2 rounded border border-orange-100">
                <span className="font-semibold">{log.userName} ({log.userRole}):</span> {log.notes}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          <fieldset disabled={isReadOnly} className="space-y-6">
            {/* Header / Identity Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                <select value={shift} onChange={e => setShift(e.target.value as Shift)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border">
                  {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hour Slot</label>
                <select value={hourSlot} onChange={e => setHourSlot(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border">
                  {currentShiftHours.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
                <select value={machineId} onChange={e => setMachineId(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border">
                  {MACHINES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                <select value={partNumber} onChange={e => setPartNumber(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border">
                  {PARTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                <input type="text" disabled value={existingEntry ? existingEntry.operatorName : currentUser.name} className="w-full bg-gray-50 border-gray-300 rounded-md shadow-sm sm:text-sm p-2 border text-gray-500" />
              </div>
            </div>

            {/* Production Numbers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Production Counts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Qty *</label>
                  <input type="number" min="0" name="plannedQuantity" value={values.plannedQuantity} onChange={handleChange} className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.plannedQuantity ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
                  {errors.plannedQuantity && <p className="mt-1 text-xs text-red-600">{errors.plannedQuantity}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produced Qty *</label>
                  <input type="number" min="0" name="producedQuantity" value={values.producedQuantity} onChange={handleChange} className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.producedQuantity ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
                  {errors.producedQuantity && <p className="mt-1 text-xs text-red-600">{errors.producedQuantity}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejected Qty</label>
                  <input type="number" min="0" name="rejectedQuantity" value={values.rejectedQuantity} onChange={handleChange} className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.rejectedQuantity ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
                  {errors.rejectedQuantity && <p className="mt-1 text-xs text-red-600">{errors.rejectedQuantity}</p>}
                </div>

              </div>

              {/* Conditional Rejection Reason */}
              {r > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <select name="rejectionReason" value={values.rejectionReason} onChange={handleChange} className={`w-full sm:w-1/2 rounded-md shadow-sm sm:text-sm p-2 border ${errors.rejectionReason ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}>
                    <option value="">-- Select Reason --</option>
                    {REJECTION_REASONS.map(rr => <option key={rr} value={rr}>{rr}</option>)}
                  </select>
                  {errors.rejectionReason && <p className="mt-1 text-xs text-red-600">{errors.rejectionReason}</p>}
                </div>
              )}
            </div>

            {/* Downtime */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Machine Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (Minutes)</label>
                  <input type="number" min="0" max="60" name="downtimeMinutes" value={values.downtimeMinutes} onChange={handleChange} className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.downtimeMinutes ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
                  {errors.downtimeMinutes && <p className="mt-1 text-xs text-red-600">{errors.downtimeMinutes}</p>}
                </div>

                {dt > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Downtime Reason *</label>
                    <input type="text" name="downtimeReason" value={values.downtimeReason} onChange={handleChange} placeholder="Explain why machine stopped" className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.downtimeReason ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
                    {errors.downtimeReason && <p className="mt-1 text-xs text-red-600">{errors.downtimeReason}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="pt-6 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks {rejectionPct > 10 ? <span className="text-danger">* (Required due to high rejection)</span> : '(Optional)'}</label>
              <textarea name="remarks" rows={3} value={values.remarks} onChange={handleChange} className={`w-full rounded-md shadow-sm sm:text-sm p-2 border ${errors.remarks ? 'border-red-300 ring-red-300' : 'border-gray-300 focus:ring-primary focus:border-primary'}`} />
              {errors.remarks && <p className="mt-1 text-xs text-red-600">{errors.remarks}</p>}
            </div>

          </fieldset>

        </div>

        {/* Right Column: Live Metrics */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <LiveMetricsCard 
              accepted={accepted} 
              rejectionPct={rejectionPct} 
              achievementPct={achievementPct} 
              runningTime={runningTime} 
            />
          </div>
        </div>

      </div>
      
      {/* Footer Actions */}
      <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          {isReadOnly ? 'Close' : 'Cancel'}
        </button>
        
        {!isReadOnly && (
          <>
            <button 
              type="button" 
              onClick={() => handleSave(false)} 
              disabled={!!duplicateWarning}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none flex items-center disabled:opacity-50"
            >
              <Save size={16} className="mr-2 text-gray-400" /> Save as Draft
            </button>
            <button 
              type="button" 
              onClick={() => handleSave(true)} 
              disabled={!!duplicateWarning}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none flex items-center disabled:opacity-50"
            >
              <Send size={16} className="mr-2" /> Submit for Approval
            </button>
          </>
        )}
      </div>

    </div>
  );
}
