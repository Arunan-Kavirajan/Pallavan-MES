import React, { useState } from 'react';
import { format } from 'date-fns';
import { SHIFTS } from '../../constants/seededData';
import { Shift } from '../../types/domain';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { StorageService } from '../../services/storageService';
import { FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportPanel() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<Shift>('A');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const entries = await StorageService.getEntriesByDateAndShift(date, shift);
      if (entries.length === 0) {
        alert('No entries found for the selected date and shift.');
        setIsExporting(false);
        return;
      }
      
      if (type === 'excel') {
        exportToExcel(entries, date, shift);
      } else {
        exportToPDF(entries, date, shift);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export report');
    }
    setIsExporting(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Generate Shift Report</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shift</label>
            <select 
              value={shift} 
              onChange={e => setShift(e.target.value as Shift)} 
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary p-2 border"
            >
              {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <FileSpreadsheet className="mr-2" size={20} />
            Download Excel
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <FileText className="mr-2" size={20} />
            Download PDF
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Exports include all calculated fields, remarks, audit trails, and supervisor signatures (PDF).
        </p>
      </div>
    </div>
  );
}
