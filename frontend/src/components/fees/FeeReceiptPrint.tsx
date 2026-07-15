import React from 'react';
import { School, Scissors } from 'lucide-react';
import { format } from 'date-fns';

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

  const ReceiptHalf = ({ type }: { type: 'STUDENT COPY' | 'OFFICE COPY' }) => (
    <div className="w-full h-full flex flex-col bg-white text-slate-900 box-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="School Logo" className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-[0.2em] text-slate-900">{schoolName}</h1>
            <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-slate-600 mt-1">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-sm">{type}</div>
          <div className="mt-3 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold space-y-1">
            <div>Date: <span className="text-slate-900 font-black">{format(new Date(payment.createdAt || new Date()), 'dd MMM yyyy')}</span></div>
            <div>Receipt No: <span className="text-slate-900 font-black">{receiptNumber}</span></div>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-4 border border-slate-200 rounded-[10px] bg-slate-50">
            <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500 font-black mb-3">Student Details</div>
            <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">{payment.student?.user?.name || 'N/A'}</div>
            <div className="mt-3 text-[10.5px] text-slate-700 grid gap-2">
              <div><span className="font-black text-slate-900">ID:</span> {payment.student?.rollNo || 'N/A'}</div>
              <div><span className="font-black text-slate-900">Class:</span> {payment.student?.class?.name || '-'}</div>
              <div><span className="font-black text-slate-900">Section:</span> {payment.student?.class?.section || '-'}</div>
              <div><span className="font-black text-slate-900">Father:</span> {payment.student?.fatherName || 'N/A'}</div>
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-[10px] bg-slate-50">
            <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500 font-black mb-3">Payment Details</div>
            <div className="text-[10.5px] text-slate-700 grid gap-2">
              <div className="flex justify-between"><span className="font-black text-slate-900">Amount Paid</span><span className="font-extrabold text-slate-900">₹{payment.amountPaid}</span></div>
              <div className="flex justify-between"><span className="font-black text-slate-900">Method</span><span className="font-semibold text-slate-900">{payment.method}</span></div>
              {payment.utrNumber && (
                <div className="flex justify-between items-start"><span className="font-black text-slate-900">UTR / Ref</span><span className="font-semibold text-slate-900 text-right break-all">{payment.utrNumber}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-[10px] overflow-hidden mb-5">
          <div className="bg-slate-100 px-4 py-3 text-[10px] uppercase tracking-[0.26em] font-black text-slate-900">Payment Breakdown</div>
          <div className="bg-white grid grid-cols-[1fr_140px] gap-4 px-4 py-4 text-sm font-black text-slate-900 border-b border-slate-200">
            <span>{payment.feeStructure?.name || 'Tuition Fee'}</span>
            <span className="text-right">₹{payment.amountPaid}</span>
          </div>
          <div className="bg-slate-50 px-4 py-4 text-[10.5px] tracking-[0.16em] text-slate-700 grid grid-cols-[1fr_140px] gap-4 border-b border-slate-200">
            <span>Remarks</span>
            <span className="text-right">{payment.remarks || 'Fee Payment'}</span>
          </div>
          <div className="bg-white px-4 py-4 text-sm font-black text-slate-900 grid grid-cols-[1fr_140px] gap-4 border-b border-slate-200">
            <span>Total Paid</span>
            <span className="text-right">₹{payment.amountPaid}</span>
          </div>
          <div className="bg-slate-50 px-4 py-4 text-[10.5px] text-slate-700 font-semibold grid grid-cols-[1fr_140px] gap-4">
            <span>Pending Balance</span>
            <span className="text-right">₹{pendingBalance > 0 ? pendingBalance : 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-[1px] bg-slate-300 mb-2"></div>
            <div className="text-[10px] uppercase tracking-[0.24em] font-black text-slate-700">Collected By</div>
          </div>
          <div className="text-center">
            <div className="h-[1px] bg-slate-300 mb-2"></div>
            <div className="text-[10px] uppercase tracking-[0.24em] font-black text-slate-700">Received By</div>
          </div>
          <div className="text-center">
            <div className="h-[1px] bg-slate-300 mb-2"></div>
            <div className="text-[10px] uppercase tracking-[0.24em] font-black text-slate-700">Date</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:block">
      <div className="w-[210mm] h-[297mm] bg-white text-slate-900 print:overflow-hidden">
        <div className="h-[148.5mm] border-b border-dashed border-slate-300 relative overflow-hidden">
          <ReceiptHalf type="STUDENT COPY" />
          <div className="absolute left-[16mm] right-[16mm] bottom-0 flex items-center justify-center py-2 bg-white text-slate-500 text-[10px] uppercase tracking-[0.24em]">
            <Scissors className="w-4 h-4 mr-2" />Cut Here<Scissors className="w-4 h-4 ml-2 rotate-180" />
          </div>
        </div>
        <div className="h-[148.5mm] overflow-hidden">
          <ReceiptHalf type="OFFICE COPY" />
        </div>
      </div>
    </div>
  );
};
