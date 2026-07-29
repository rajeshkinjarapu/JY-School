import React from 'react';
import { format } from 'date-fns';
import { Scissors } from 'lucide-react';

interface FeeReceiptPrintProps {
  payment: any;
  schoolName?: string;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ payment, schoolName = 'JY SCHOOL' }) => {
  if (!payment) return null;

  const formatReceiptNumber = (rNo: string) => {
    if (!rNo) return '';
    if (rNo.includes('-')) {
import React from 'react';
import { format } from 'date-fns';
import { Scissors } from 'lucide-react';

interface FeeReceiptPrintProps {
  payment: any;
  schoolName?: string;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ payment, schoolName = 'JY SCHOOL' }) => {
  if (!payment) return null;

  const formatReceiptNumber = (rNo: string) => {
    if (!rNo) return '';
    if (rNo.includes('-')) {
      const clean = rNo.replace(/[^a-zA-Z0-9]/g, '');
      return 'JY' + clean.substring(0, 8).toUpperCase();
    }
    return rNo;
  };

  const receiptNumber = payment?.receiptNo 
    ? formatReceiptNumber(payment.receiptNo) 
    : ('JY26' + Math.floor(10000000 + Math.random() * 90000000));

  const pendingBalance = payment.feeStructure 
    ? (payment.feeStructure.amount - (payment.feeStructure.feePayments?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || payment.amountPaid))
    : 0;

  return (
    <div className="hidden print:flex print:flex-col w-full text-slate-900 bg-white print:h-[297mm] print:w-[210mm] m-0 p-0 overflow-hidden box-border">
      {/* 2 Copies (Office Copy & Parent Copy) */}
      {[ 'OFFICE COPY', 'PARENT COPY' ].map((copyType, idx) => (
        <div key={copyType} className={`relative flex-1 flex flex-col justify-center px-4 ${idx === 1 ? 'border-t-2 border-dashed border-slate-300' : ''}`}>
          
          {idx === 1 && (
             <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-white px-4 text-slate-500 text-[10px] uppercase tracking-[0.24em]">
               <Scissors className="w-4 h-4 mr-2" />Cut Here<Scissors className="w-4 h-4 ml-2 rotate-180" />
             </div>
          )}

          <div className="w-full max-w-[800px] mx-auto border-2 border-slate-900 p-5 rounded-lg relative overflow-hidden box-border">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider">{schoolName}</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Fee Payment Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 font-black text-[10px] tracking-widest uppercase rounded">
                  {copyType}
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider">
                  Receipt No: {receiptNumber}
                </div>
                <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                  Date: {format(new Date(payment.paymentDate || payment.createdAt || new Date()), 'dd MMM yyyy')}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col gap-5">
              
              {/* Top Details */}
              <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Student Name</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-1.5">{payment.student?.user?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ID No</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-1.5">{payment.student?.rollNo || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Class / Sec</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-1.5">{payment.student?.class ? `${payment.student.class.name} - ${payment.student.class.section}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Father's Name</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-1.5">{payment.student?.fatherName || 'N/A'}</div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border-2 border-slate-900 rounded-lg overflow-hidden mt-2">
                 <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm">
                   <thead className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-600 uppercase tracking-widest text-left">
                     <tr>
                       <th className="py-2.5 px-4 border-r-2 border-slate-900">Description</th>
                       <th className="py-2.5 px-4 border-r-2 border-slate-900 text-center">Payment Mode</th>
                       <th className="py-2.5 px-4 text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="border-b border-slate-300 font-bold">
                       <td className="py-3 px-4 border-r-2 border-slate-900">{payment.feeStructure?.name || 'Tuition Fee'}</td>
                       <td className="py-3 px-4 border-r-2 border-slate-900 text-center">{payment.method}</td>
                       <td className="py-3 px-4 text-right">₹{payment.amountPaid}</td>
                     </tr>
                     {payment.remarks && (
                       <tr className="border-b border-slate-300 font-semibold text-slate-600 text-xs">
                         <td colSpan={3} className="py-2 px-4 bg-yellow-50/50">Remarks: {payment.remarks}</td>
                       </tr>
                     )}
                     <tr className="font-black text-base bg-slate-100">
                       <td colSpan={2} className="py-3 px-4 border-r-2 border-slate-900 text-right uppercase tracking-widest text-[11px]">Total Paid</td>
                       <td className="py-3 px-4 text-right text-lg">₹{payment.amountPaid}</td>
                     </tr>
                   </tbody>
                 </table></div>
              </div>
              
              <div className="flex justify-between items-center text-sm font-bold bg-slate-100 p-3.5 rounded-lg border-2 border-slate-300">
                <span className="text-[11px] uppercase tracking-widest text-slate-600">Pending Balance for {payment.feeStructure?.name || 'this fee'}:</span>
                <span className="text-red-600 text-base">₹{pendingBalance > 0 ? pendingBalance : 0}</span>
              </div>

            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-14 px-8">
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Collected By</div>
              </div>
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Received By</div>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// Fee Statement PDF Generator (jsPDF — A4 professional)
// Usage: generateFeeStatementPDF({ studentName, ... })
// ─────────────────────────────────────────────────────────────────────────────

export interface FeeStatementItem {
  name: string;
  term?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
}

export interface FeeStatementData {
  studentName: string;
  studentId: string;
  className: string;
  section: string;
  fatherName?: string;
  phone?: string;
  feeItems: FeeStatementItem[];
  schoolName?: string;
  schoolAddress?: string;
}

export const generateFeeStatementPDF = async (data: FeeStatementData): Promise<void> => {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;

  const {
    studentName,
    studentId,
    className,
    section,
    fatherName = '—',
    phone = '—',
    feeItems,
    schoolName = 'JY SCHOOL',
    schoolAddress = 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // Professional Monochrome / Dark Blue Palette
  const primary: [number, number, number]   = [15, 23, 42];   // Slate-900 (Dark Navy)
  const accent: [number, number, number]    = [51, 65, 85];   // Slate-700
  const dark: [number, number, number]      = [15, 23, 42];   // Slate-900
  const muted: [number, number, number]     = [100, 116, 139]; // Slate-500
  const green: [number, number, number]     = [22, 163, 74];   // Green-600
  const red: [number, number, number]       = [220, 38, 38];   // Red-600
  const lightBg: [number, number, number]   = [248, 250, 252]; // Slate-50
  const border: [number, number, number]    = [203, 213, 225]; // Slate-300

  let y = margin;

  // ── HEADER BANNER ─────────────────────────────────────────────────────────
  doc.setFillColor(...primary);
  doc.roundedRect(margin, y, contentW, 36, 3, 3, 'F');
  
  // Decorative left stripe (Subtle accent)
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, 4, 36, 'F');

  // Logo circle
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 20, y + 18, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primary);
  doc.text('JY', margin + 16, y + 22);

  // School info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName.toUpperCase(), margin + 40, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Light slate
  doc.text(schoolAddress, margin + 40, y + 24);

  // Statement label (right side pill)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageW - margin - 55, y + 9, 52, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primary);
  doc.text('FEE STATEMENT', pageW - margin - 29, y + 16.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Date: ${today}`, pageW - margin - 29, y + 22, { align: 'center' });

  y += 44;

  // ── STUDENT DETAILS BOX ───────────────────────────────────────────────────
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 32, 3, 3, 'FD');

  const half = contentW / 2;

  // Left side
  const drawField = (label: string, value: string, lx: number, ly: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(label, lx, ly);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...dark);
    doc.text(value, lx, ly + 7);
  };

  drawField('STUDENT NAME', studentName.toUpperCase(), margin + 6, y + 10);
  drawField('STUDENT ID / ROLL NO', studentId, margin + 6, y + 23);
  drawField('CLASS & SECTION', `${className} — ${section}`, margin + half + 4, y + 10);
  drawField("FATHER'S NAME", fatherName, margin + half + 4, y + 23);

  // Divider
  doc.setDrawColor(...border);
  doc.line(margin + half, y + 4, margin + half, y + 28);

  y += 40;

  // ── FEE TABLE ─────────────────────────────────────────────────────────────
  const rows = feeItems.map((item, idx) => {
    const pending = Math.max(0, item.totalAmount - item.paidAmount);
    const status = pending === 0 ? 'PAID ✓' : pending < item.totalAmount ? 'PARTIAL' : 'UNPAID';
    return [
      idx + 1,
      item.name + (item.term ? ` (${item.term})` : ''),
      `₹ ${item.totalAmount.toLocaleString('en-IN')}`,
      `₹ ${item.paidAmount.toLocaleString('en-IN')}`,
      `₹ ${pending.toLocaleString('en-IN')}`,
      item.dueDate
        ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
        : '—',
      status,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Fee Description', 'Total', 'Paid', 'Pending', 'Due Date', 'Status']],
    body: rows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica', textColor: dark },
    headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [250, 245, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 52 },
      2: { halign: 'right', cellWidth: 24 },
      3: { halign: 'right', cellWidth: 24, textColor: green },
      4: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: red },
      5: { halign: 'center', cellWidth: 22, textColor: muted },
      6: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (hookData) => {
      if (hookData.column.index === 6 && hookData.section === 'body') {
        const val = String(hookData.cell.raw);
        if (val.includes('PAID')) hookData.cell.styles.textColor = green;
        else if (val === 'PARTIAL') hookData.cell.styles.textColor = [217, 119, 6];
        else hookData.cell.styles.textColor = red;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── SUMMARY BOXES ─────────────────────────────────────────────────────────
  const totalAmt = feeItems.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = feeItems.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = Math.max(0, totalAmt - totalPaid);
  const pct = totalAmt > 0 ? Math.round((totalPaid / totalAmt) * 100) : 0;

  const bw = (contentW - 8) / 3;

  const drawBox = (
    label: string,
    value: string,
    x: number,
    fillRgb: [number, number, number],
    strokeRgb: [number, number, number],
    textRgb: [number, number, number],
  ) => {
    doc.setFillColor(...fillRgb);
    doc.setDrawColor(...strokeRgb);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, bw, 24, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(label, x + bw / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...textRgb);
    doc.text(value, x + bw / 2, y + 18, { align: 'center' });
  };

  drawBox('TOTAL AMOUNT', `₹ ${totalAmt.toLocaleString('en-IN')}`, margin, lightBg, border, primary);
  drawBox('AMOUNT PAID', `₹ ${totalPaid.toLocaleString('en-IN')}`, margin + bw + 4, [236, 253, 245], [167, 243, 208], green);
  drawBox('AMOUNT PENDING', `₹ ${totalPending.toLocaleString('en-IN')}`, margin + (bw + 4) * 2, totalPending > 0 ? [254, 242, 242] : [236, 253, 245], totalPending > 0 ? [254, 202, 202] : [167, 243, 208], totalPending > 0 ? red : green);

  y += 32;

  // Progress bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text(`Payment Progress: ${pct}% completed`, margin, y + 4);
  doc.setFillColor(237, 233, 254);
  doc.roundedRect(margin, y + 6, contentW, 6, 3, 3, 'F');
  
  if (pct > 0) {
    doc.setFillColor(...(pct === 100 ? green : primary));
    doc.roundedRect(margin, y + 6, Math.max(5, (contentW * pct) / 100), 6, 3, 3, 'F');
  }

  y += 22;

  // ── FOOTER NOTICE ─────────────────────────────────────────────────────────
  if (totalPending > 0) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(253, 224, 71);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 14, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(202, 138, 4);
    doc.text(
      `⚠  Pending amount of ₹ ${totalPending.toLocaleString('en-IN')} must be cleared at the earliest to avoid late fees.`,
      pageW / 2,
      y + 8.5,
      { align: 'center' }
    );
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = pageH - 20;
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(`This is a system-generated document from ${schoolName}. No signature is required.`, margin, footerY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('Accounts Office Stamp / Signature: _____________________', pageW - margin, footerY + 6, { align: 'right' });

  // Save
  const safeName = studentName.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
  doc.save(`Fee_Statement_${safeName}_${studentId}.pdf`);
};
