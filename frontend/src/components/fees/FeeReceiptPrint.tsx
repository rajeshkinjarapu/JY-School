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
    <div className="hidden print:flex print:flex-col w-full text-slate-900 bg-white print:h-[296mm] print:w-[210mm] m-0 p-0 overflow-hidden box-border">
      {/* 2 Copies (Office Copy & Parent Copy) */}
      {[ 'OFFICE COPY', 'PARENT COPY' ].map((copyType, idx) => (
        <div key={copyType} className={`relative print:h-[148mm] w-full flex flex-col justify-center px-6 ${idx === 1 ? 'border-t-[2px] border-dashed border-slate-400' : ''}`}>
          
          {idx === 1 && (
             <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-white px-4 text-slate-500 text-[11px] uppercase tracking-[0.2em] font-black">
               <Scissors className="w-4 h-4 mr-2" /> CUT HERE <Scissors className="w-4 h-4 ml-2 rotate-180" />
             </div>
          )}

          <div className="w-full h-[135mm] max-w-[850px] mx-auto border-[3px] border-slate-800 p-4 rounded-xl relative overflow-hidden box-border flex flex-col bg-slate-50/30 shadow-sm">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b-[3px] border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-[3px] border-slate-800 flex items-center justify-center overflow-hidden bg-white shadow-sm">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 drop-shadow-sm">{schoolName}</h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 mt-0.5">Fee Payment Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-4 py-1.5 font-black text-[11px] tracking-widest uppercase rounded-md shadow-sm mb-1.5">
                  {copyType}
                </div>
                <div className="text-[13px] font-black uppercase tracking-wider text-slate-800 mt-1">
                  Receipt No: <span className="text-indigo-700">{receiptNumber}</span>
                </div>
                <div className="text-[11px] font-extrabold text-slate-500 mt-1 uppercase tracking-wider">
                  Date: <span className="text-slate-800">{format(new Date(payment.paymentDate || payment.createdAt || new Date()), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm mb-4 bg-white p-3 rounded-lg border-2 border-slate-200 shadow-inner">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Student Name</div>
                <div className="font-black text-slate-800 text-[13px] border-b-2 border-slate-100 pb-1">{payment.student?.user?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Student ID No</div>
                <div className="font-black text-slate-800 text-[13px] border-b-2 border-slate-100 pb-1">{payment.student?.rollNo || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Class / Section</div>
                <div className="font-black text-slate-800 text-[13px] border-b-2 border-slate-100 pb-1">{payment.student?.class ? `${payment.student.class.name} - ${payment.student.class.section}` : 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Father's Name</div>
                <div className="font-black text-slate-800 text-[13px] border-b-2 border-slate-100 pb-1">{payment.student?.fatherName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</div>
                <div className="font-black text-slate-800 text-[13px] border-b-2 border-slate-100 pb-1">{payment.student?.mobile || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payment Status</div>
                <div className="font-black text-emerald-600 text-[13px] border-b-2 border-slate-100 pb-1 flex items-center gap-1">SUCCESS</div>
              </div>
            </div>

            {/* Payment Details Table */}
            <div className="border-[3px] border-slate-800 rounded-lg overflow-hidden flex-1 bg-white flex flex-col shadow-sm">
               <table className="w-full text-sm">
                 <thead className="bg-slate-100 border-b-[3px] border-slate-800 text-[11px] font-black text-slate-700 uppercase tracking-widest text-left">
                   <tr>
                     <th className="py-2.5 px-4 border-r-[3px] border-slate-800">Description</th>
                     <th className="py-2.5 px-4 border-r-[3px] border-slate-800 text-center">Payment Mode</th>
                     <th className="py-2.5 px-4 text-right">Amount</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr className="border-b-2 border-slate-200 font-bold">
                     <td className="py-3.5 px-4 border-r-[3px] border-slate-800 text-slate-800">{payment.feeStructure?.name || 'Tuition Fee'}</td>
                     <td className="py-3.5 px-4 border-r-[3px] border-slate-800 text-center text-slate-800 uppercase font-black">{payment.method}</td>
                     <td className="py-3.5 px-4 text-right text-slate-800 text-[15px]">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                   </tr>
                   {payment.remarks && (
                     <tr className="border-b-2 border-slate-200 font-semibold text-slate-600 text-xs bg-amber-50">
                       <td colSpan={3} className="py-2 px-4">Remarks: <span className="font-bold text-slate-800">{payment.remarks}</span></td>
                     </tr>
                   )}
                   <tr className="font-black text-base bg-indigo-50 border-b-[3px] border-slate-800">
                     <td colSpan={2} className="py-3 px-4 border-r-[3px] border-slate-800 text-right uppercase tracking-widest text-[11px] text-indigo-900">Total Paid</td>
                     <td className="py-3 px-4 text-right text-[18px] text-indigo-700">₹{payment.amountPaid.toLocaleString('en-IN')}</td>
                   </tr>
                 </tbody>
               </table>
               
               {/* Spacer to push signatures to bottom */}
               <div className="flex-1"></div>

               <div className="flex justify-between items-center text-sm font-black bg-slate-100 p-3">
                 <span className="text-[11px] uppercase tracking-widest text-slate-500">Pending Balance for {payment.feeStructure?.name || 'this fee'}:</span>
                 <span className={`text-[15px] ${pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{pendingBalance > 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
               </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-8 mb-2 px-8">
              <div className="text-center">
                <div className="w-56 border-b-2 border-dashed border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized Signatory</div>
              </div>
              <div className="text-center">
                <div className="w-56 border-b-2 border-dashed border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cashier / Office</div>
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
  const { createRoot } = await import('react-dom/client');
  const html2canvas = (await import('html2canvas')).default;

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

  const totalAmt = feeItems.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = feeItems.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = Math.max(0, totalAmt - totalPaid);
  const pct = totalAmt > 0 ? Math.round((totalPaid / totalAmt) * 100) : 0;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const FeeStatementTemplate = () => (
    <div className="w-[210mm] bg-white text-slate-900 font-sans p-[14mm] box-border relative">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 rounded-xl p-6 flex justify-between items-center relative overflow-hidden shadow-lg border-l-4 border-white mb-8">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md">
            <span className="text-xl font-black text-slate-900">JY</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-widest">{schoolName}</h1>
            <p className="text-xs text-slate-300 mt-1">{schoolAddress}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg px-6 py-3 text-center shadow-md relative z-10">
          <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase">Fee Statement</h2>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Date: {today}</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      </div>

      {/* STUDENT DETAILS BOX */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 mb-8 grid grid-cols-2 gap-y-4 gap-x-8">
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Name</div>
          <div className="text-sm font-black text-slate-900 border-b-2 border-slate-200 pb-1.5">{studentName.toUpperCase()}</div>
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class & Section</div>
          <div className="text-sm font-black text-slate-900 border-b-2 border-slate-200 pb-1.5">{className} — {section}</div>
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student ID / Roll No</div>
          <div className="text-sm font-black text-slate-900 border-b-2 border-slate-200 pb-1.5">{studentId}</div>
        </div>
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Father's Name</div>
          <div className="text-sm font-black text-slate-900 border-b-2 border-slate-200 pb-1.5">{fatherName}</div>
        </div>
      </div>

      {/* FEE TABLE */}
      <div className="border-[3px] border-slate-900 rounded-xl overflow-hidden mb-8 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left font-black text-[11px] uppercase tracking-widest w-12 text-center">#</th>
              <th className="py-3 px-4 text-left font-black text-[11px] uppercase tracking-widest">Fee Description</th>
              <th className="py-3 px-4 text-right font-black text-[11px] uppercase tracking-widest">Total</th>
              <th className="py-3 px-4 text-right font-black text-[11px] uppercase tracking-widest">Paid</th>
              <th className="py-3 px-4 text-right font-black text-[11px] uppercase tracking-widest">Pending</th>
              <th className="py-3 px-4 text-center font-black text-[11px] uppercase tracking-widest">Due Date</th>
              <th className="py-3 px-4 text-center font-black text-[11px] uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {feeItems.map((item, idx) => {
              const pending = Math.max(0, item.totalAmount - item.paidAmount);
              const status = pending === 0 ? 'PAID ✓' : pending < item.totalAmount ? 'PARTIAL' : 'UNPAID';
              const statusColor = pending === 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pending < item.totalAmount ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{item.name} {item.term ? `(${item.term})` : ''}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">₹ {item.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600">₹ {item.paidAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-right font-black text-rose-600">₹ {pending.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SUMMARY BOXES */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-50 border-[3px] border-slate-300 rounded-xl p-4 text-center shadow-sm">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Amount</div>
          <div className="text-2xl font-black text-slate-900">₹ {totalAmt.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-emerald-50 border-[3px] border-emerald-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2">Amount Paid</div>
          <div className="text-2xl font-black text-emerald-700">₹ {totalPaid.toLocaleString('en-IN')}</div>
        </div>
        <div className={`border-[3px] rounded-xl p-4 text-center shadow-sm ${totalPending > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`text-[11px] font-black uppercase tracking-widest mb-2 ${totalPending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Amount Pending</div>
          <div className={`text-2xl font-black ${totalPending > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>₹ {totalPending.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mb-8">
        <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-3">Payment Progress: {pct}% completed</div>
        <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ${pct === 100 ? 'bg-emerald-500' : 'bg-slate-900'}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      {/* FOOTER NOTICE */}
      {totalPending > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center mb-8 shadow-sm">
          <p className="text-sm font-black text-amber-700 tracking-wide">
            ⚠ Pending amount of ₹ {totalPending.toLocaleString('en-IN')} must be cleared at the earliest to avoid late fees.
          </p>
        </div>
      )}

      {/* SIGNATURES */}
      <div className="mt-16 flex justify-between items-end border-t-2 border-slate-300 pt-6">
        <div className="text-[10px] font-semibold text-slate-400">
          This is a system-generated document from {schoolName}.<br/>No signature is required.
        </div>
        <div className="text-right">
          <div className="w-64 border-b-2 border-dashed border-slate-400 mb-2"></div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Accounts Office Stamp / Signature</div>
        </div>
      </div>
    </div>
  );

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<FeeStatementTemplate />);

  // Wait for React to render and DOM to update
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // high quality
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const image = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    const safeName = studentName.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
    link.download = `Fee_Statement_${safeName}_${studentId}.jpg`;
    link.href = image;
    link.click();
  } catch (err) {
    console.error('Error generating image', err);
    alert('Failed to generate JPG. Please try again.');
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};
