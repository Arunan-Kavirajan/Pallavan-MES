import { ProductionEntry } from '../types/domain';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { SHIFT_HOURS } from '../constants/seededData';

export function exportToExcel(entries: ProductionEntry[], date: string, shift: string) {
  const data = entries.map(e => ({
    'Date': e.entryDate,
    'Shift': e.shift,
    'Hour': SHIFT_HOURS[e.shift as 'A'|'B'|'C'].find(s => s.id === e.hourSlot)?.label || e.hourSlot,
    'Machine': e.machineId,
    'Part': e.partNumber,
    'Operator': e.operatorName,
    'Planned': e.plannedQuantity,
    'Produced': e.producedQuantity,
    'Rejected': e.rejectedQuantity,
    'Rej Reason': e.rejectionReason || '',
    'Accepted': e.acceptedQuantity,
    'Rejection %': `${e.rejectionPercentage}%`,
    'Achievement %': `${e.achievementPercentage}%`,
    'Downtime (min)': e.downtimeMinutes,
    'DT Reason': e.downtimeReason || '',
    'Run Time': e.runningTime,
    'Status': e.status,
    'Remarks': e.remarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Shift_${shift}_${date}`);
  
  XLSX.writeFile(workbook, `Production_Report_${date}_Shift_${shift}.xlsx`);
}

export function exportToPDF(entries: ProductionEntry[], date: string, shift: string) {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(16);
  doc.text(`Pallavan Precision Works - Shift Production Report`, 14, 15);
  
  doc.setFontSize(11);
  doc.text(`Date: ${date} | Shift: ${shift}`, 14, 23);
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 29);

  const tableData = entries.map(e => [
    SHIFT_HOURS[e.shift as 'A'|'B'|'C'].find(s => s.id === e.hourSlot)?.label?.split(' ')[0] || e.hourSlot,
    e.machineId,
    e.partNumber,
    e.operatorName,
    e.plannedQuantity.toString(),
    e.producedQuantity.toString(),
    e.rejectedQuantity.toString(),
    e.acceptedQuantity.toString(),
    `${e.rejectionPercentage}%`,
    e.downtimeMinutes.toString(),
    e.status
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Hour', 'Machine', 'Part', 'Operator', 'Plan', 'Prod', 'Rej', 'Acc', 'Rej %', 'DT (m)', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [29, 78, 216] } // primary color
  });

  // Extract signatures
  const approvedEntries = entries.filter(e => e.status === 'Approved');
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (approvedEntries.length > 0) {
    doc.text('Supervisor Approvals:', 14, currentY);
    currentY += 10;
    
    // Just show a few unique signatures to not clutter PDF
    const uniqueApprovers = new Set<string>();
    
    approvedEntries.forEach(entry => {
      const approvalLog = entry.auditTrail.find(a => a.action === 'APPROVED' && a.signatureDataUrl);
      if (approvalLog && !uniqueApprovers.has(approvalLog.userName)) {
        uniqueApprovers.add(approvalLog.userName);
        
        doc.text(`Supervisor: ${approvalLog.userName}`, 14, currentY + 10);
        try {
          if (approvalLog.signatureDataUrl) {
            doc.addImage(approvalLog.signatureDataUrl, 'PNG', 14, currentY + 12, 40, 20);
          }
        } catch (e) {
          // ignore bad images
        }
        currentY += 35;
      }
    });
  }

  doc.save(`Production_Report_${date}_Shift_${shift}.pdf`);
}
