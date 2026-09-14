import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { SHIFTS } from '../../constants/seededData';
import { Shift, ProductionEntry } from '../../types/domain';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { StorageService } from '../../services/storageService';
import { FileSpreadsheet, FileText, CheckCircle, AlertCircle, FileCheck, Eye } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export default function ExportPanel() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<Shift>('A');
  const [matchingEntries, setMatchingEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Live lookup of matching entries
  useEffect(() => {
    async function checkEntries() {
      setLoading(true);
      const entries = await StorageService.getEntriesByDateAndShift(date, shift);
      // NEVER export or show drafts in the export panel
      const nonDrafts = entries.filter(e => e.status !== 'Draft');
      setMatchingEntries(nonDrafts);
      setLoading(false);
    }
    checkEntries();
  }, [date, shift]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    if (matchingEntries.length === 0) {
      alert('No entries found for the selected date and shift.');
      return;
    }

    setIsExporting(true);
    try {
      if (type === 'excel') {
        exportToExcel(matchingEntries, date, shift);
      } else {
        exportToPDF(matchingEntries, date, shift);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export report');
    }
    setIsExporting(false);
  };

  const approvedCount = matchingEntries.filter(e => e.status === 'Approved').length;
  const submittedCount = matchingEntries.filter(e => e.status === 'Submitted').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Shift Production Export</h3>
            <p className="text-sm text-gray-500">
              Download complete shift audit reports in Excel (.xlsx) or formatted PDF.
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
            Supervisor & Manager Role
          </span>
        </div>
        
        {/* Date & Shift Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Operational Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full border-gray-300 rounded-lg shadow-xs focus:ring-primary focus:border-primary p-2.5 border text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shift</label>
            <select 
              value={shift} 
              onChange={e => setShift(e.target.value as Shift)} 
              className="w-full border-gray-300 rounded-lg shadow-xs focus:ring-primary focus:border-primary p-2.5 border text-sm"
            >
              {SHIFTS.map(s => <option key={s} value={s}>Shift {s} ({s === 'A' ? '06:00-14:00' : s === 'B' ? '14:00-22:00' : '22:00-06:00'})</option>)}
            </select>
          </div>
        </div>

        {/* Live Matching Summary Box */}
        <div className={`p-4 rounded-lg border mb-6 ${
          matchingEntries.length > 0 
            ? 'bg-blue-50/50 border-blue-200' 
            : 'bg-amber-50/50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {matchingEntries.length > 0 ? (
                <FileCheck className="text-primary" size={20} />
              ) : (
                <AlertCircle className="text-amber-500" size={20} />
              )}
              <span className="text-sm font-semibold text-gray-800">
                {loading ? 'Checking records...' : `${matchingEntries.length} entries found for ${date} (Shift ${shift})`}
              </span>
            </div>

            {matchingEntries.length > 0 && (
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                  {approvedCount} Approved
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  {submittedCount} Submitted
                </span>
              </div>
            )}
          </div>

          {matchingEntries.length === 0 && !loading && (
            <p className="text-xs text-gray-500 mt-2">
              No entries exist for this exact date and shift. Try selecting today or yesterday with Shift A, or switch to the Entries tab to log entries.
            </p>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting || matchingEntries.length === 0}
            className="flex-1 flex items-center justify-center px-5 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="mr-2.5" size={20} />
            Export to Excel (.xlsx)
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting || matchingEntries.length === 0}
            className="flex-1 flex items-center justify-center px-5 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="mr-2.5" size={20} />
            Export to PDF (with Signatures)
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Exports contain all production metrics, running times, scrap reasons, downtime explanations, and supervisor approval signatures.
        </p>
      </div>

      {/* Preview Table if entries exist */}
      {matchingEntries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <Eye size={16} className="text-gray-500" />
            Report Data Preview ({matchingEntries.length} records)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Machine</th>
                  <th className="px-3 py-2 text-left">Part</th>
                  <th className="px-3 py-2 text-left">Operator</th>
                  <th className="px-3 py-2 text-right">Prod</th>
                  <th className="px-3 py-2 text-right">Rej</th>
                  <th className="px-3 py-2 text-right">Rej %</th>
                  <th className="px-3 py-2 text-right">DT (m)</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {matchingEntries.map(e => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 font-mono font-medium text-gray-900">{e.machineId}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{e.partNumber}</td>
                    <td className="px-3 py-2 text-gray-700">{e.operatorName}</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">{e.producedQuantity}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-semibold">{e.rejectedQuantity}</td>
                    <td className="px-3 py-2 text-right">{e.rejectionPercentage}%</td>
                    <td className="px-3 py-2 text-right text-amber-600">{e.downtimeMinutes}</td>
                    <td className="px-3 py-2"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
