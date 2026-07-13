import React from 'react';
import { School } from 'lucide-react';
import { format } from 'date-fns';

interface FeeReceiptPrintProps {
  payment: any;
  schoolName?: string;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ payment, schoolName = 'JY SCHOOL' }) => {
  if (!payment) return null;

  const ReceiptHalf = ({ type }: { type: 'STUDENT COPY' | 'OFFICE COPY' }) => (
    <div className="flex-1 w-[210mm] p-10 flex flex-col justify-between bg-white text-black relative box-border mx-auto overflow-hidden">
      
      {/* Background Watermark (Optional) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <School className="w-64 h-64" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center print:bg-black">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">{schoolName}</h1>
              <p className="text-xs text-slate-600 font-semibold tracking-wider">PREMIUM EDUCATION INSTITUTE</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-sm tracking-widest text-slate-700">
              {type}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Date: <strong>{format(new Date(payment.createdAt || new Date()), 'dd MMM yyyy')}</strong></p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Student Details</p>
              <h2 className="text-lg font-bold text-slate-900">{payment.student?.user?.name || 'N/A'}</h2>
              <div className="text-sm font-medium text-slate-700 mt-1 flex justify-between">
                <span>ID: {payment.student?.rollNo || 'N/A'}</span>
                <span>Class: {payment.student?.class?.name} {payment.student?.class?.section}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Payment Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm font-medium text-slate-700">
                <div className="text-slate-500">Amount Paid:</div>
                <div className="font-bold text-slate-900">₹{payment.amountPaid}</div>
                <div className="text-slate-500">Method:</div>
                <div className="font-bold text-slate-900">{payment.method}</div>
                {payment.utrNumber && (
                  <>
                    <div className="text-slate-500">UTR / Ref:</div>
                    <div className="font-bold text-slate-900">{payment.utrNumber}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 mb-6">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-800">
                <th className="p-3 text-xs font-bold uppercase border-b border-r border-slate-300">Description</th>
                <th className="p-3 text-xs font-bold uppercase border-b border-slate-300 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 text-sm font-semibold border-b border-r border-slate-300">
                  {payment.feeStructure?.name || 'Tuition Fee'}
                  <div className="text-xs text-slate-500 font-normal mt-1">{payment.remarks || 'Fee Payment'}</div>
                </td>
                <td className="p-3 text-sm font-bold text-right border-b border-slate-300">
                  ₹{payment.amountPaid}
                </td>
              </tr>
              {/* Empty padding rows for professional look */}
              <tr>
                <td className="p-3 border-r border-slate-300 h-10"></td>
                <td className="p-3 border-slate-300"></td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 text-sm font-bold text-right uppercase tracking-wider border-t border-r border-slate-300">Total Paid</td>
                <td className="p-3 text-base font-black text-right border-t border-slate-300">
                  ₹{payment.amountPaid}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-auto pt-6 flex justify-between items-end border-t border-slate-200">
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cashier / Accountant</p>
          </div>
          <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent / Student Signature</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:flex flex-col fixed top-0 left-0 right-0 bottom-0 bg-white z-[9999] w-full h-[297mm] text-black print:overflow-hidden print:!m-0 print:!p-0 font-sans">
      <style>
        {`
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          @media print {
            html, body { height: 297mm; overflow: hidden; }
          }
        `}
      </style>
      
      {/* Student Copy (Top Half) */}
      <ReceiptHalf type="STUDENT COPY" />
      
      {/* Cutting Line (Middle) */}
      <div className="w-full flex items-center justify-center relative my-0 h-0 print:opacity-50">
        <div className="absolute w-[210mm] mx-auto border-t-[1.5px] border-dashed border-slate-300 z-10"></div>
        <div className="absolute bg-white px-6 z-20 flex items-center gap-2 text-slate-400">
          <span className="text-[9px] tracking-[0.25em] font-extrabold uppercase">✂ Cut Here ✂</span>
        </div>
      </div>
      
      {/* Office Copy (Bottom Half) */}
      <ReceiptHalf type="OFFICE COPY" />
      
    </div>
  );
};
