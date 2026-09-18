import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, CheckCircle, School } from 'lucide-react';

interface AdmissionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: any;
  schoolSettings?: any;
}

export const AdmissionPrintModal: React.FC<AdmissionPrintModalProps> = ({
  isOpen,
  onClose,
  admission,
  schoolSettings,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !admission) return null;

  const schoolName = schoolSettings?.schoolName || 'SRI VENKATESWARA JY SCHOOL';
  const schoolAddress = schoolSettings?.address || 'SVL Paradise Campus, Opp. Hero Showroom, Narasannapeta, Srikakulam Dist.';
  const schoolPhone = schoolSettings?.phone || '+91 94944 55667';
  const schoolEmail = schoolSettings?.email || 'info@jyschool.edu.in';
  const schoolLogo = schoolSettings?.logoUrl || '/logo.png';

  const regNo = `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;
  const regDate = admission.createdAt 
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <>
      {/* Screen Backdrop & Actions Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-wide">Student Admission Form Print Preview</h2>
                <p className="text-white/80 text-xs font-medium">Official A4 Student Registration Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-50 shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Form (A4)
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Preview Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/80 flex justify-center">
            {/* Visual Paper on Screen */}
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl border border-slate-200 p-[12mm] text-slate-900 text-xs font-sans">
              
              {/* Document Header */}
              <div className="border-b-2 border-indigo-900 pb-3 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                    <img 
                      src={schoolLogo} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-1" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-indigo-700');
                        if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = '🏛️';
                      }}
                    />
                  </div>

                  <div className="text-center flex-1">
                    <h1 className="text-xl font-black text-indigo-950 tracking-wider uppercase font-serif">
                      {schoolName}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                      Recognized by Govt. of Andhra Pradesh • English Medium
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {schoolAddress}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Phone: <span className="font-bold text-slate-700">{schoolPhone}</span> | Email: <span className="font-bold text-slate-700">{schoolEmail}</span>
                    </p>
                  </div>

                  {/* Top-Right Passport Photo Container */}
                  <div className="w-[32mm] h-[40mm] border-2 border-dashed border-indigo-900/40 rounded-lg overflow-hidden shrink-0 bg-slate-50 flex flex-col items-center justify-center text-center p-1 relative shadow-inner">
                    {admission.studentImage ? (
                      <img 
                        src={admission.studentImage} 
                        alt={admission.studentName} 
                        className="w-full h-full object-cover rounded" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                        <span className="text-2xl mb-1">👤</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase leading-tight">
                          Affix Student Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Title Ribbon */}
                <div className="mt-3 bg-indigo-950 text-white text-center py-1.5 px-4 rounded font-black text-sm tracking-widest uppercase shadow-sm">
                  APPLICATION FOR ADMISSION / విద్యార్థి ప్రవేశ దరఖాస్తు
                </div>

                {/* Application Meta Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mt-2 px-1">
                  <div>
                    Application No: <span className="font-mono font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{regNo}</span>
                  </div>
                  <div>
                    Date of Application: <span className="font-black text-slate-900">{regDate}</span>
                  </div>
                  <div>
                    Class Applied: <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 uppercase">{admission.classApplied || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 1. STUDENT PERSONAL INFORMATION */}
              <div className="mb-3.5">
                <div className="bg-slate-100 border border-slate-300 px-2 py-1 font-black text-xs text-indigo-950 uppercase tracking-wide flex items-center justify-between rounded-t">
                  <span>1. STUDENT PERSONAL INFORMATION (విద్యార్థి వివరాలు)</span>
                </div>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Student Full Name</td>
                      <td className="w-3/4 p-2 font-black text-slate-900 uppercase tracking-wide text-sm" colSpan={3}>
                        {admission.studentName || '-'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Gender (లింగం)</td>
                      <td className="w-1/4 p-2 font-bold text-slate-800 border-r border-slate-200 uppercase">
                        {admission.gender || '-'}
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Date of Birth (పుట్టిన తేదీ)</td>
                      <td className="w-1/4 p-2 font-bold text-slate-800">
                        {admission.dob ? new Date(admission.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Aadhar Card No.</td>
                      <td className="w-1/4 p-2 font-mono font-bold text-slate-900 border-r border-slate-200 tracking-wider">
                        {admission.aadharNo || '-'}
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Class Admitted To</td>
                      <td className="w-1/4 p-2 font-bold text-indigo-900 uppercase">
                        {admission.classApplied || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Residential Address</td>
                      <td className="w-3/4 p-2 font-medium text-slate-800 leading-relaxed" colSpan={3}>
                        {admission.address || 'Narasannapeta, Srikakulam District'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. PARENT & GUARDIAN DETAILS */}
              <div className="mb-3.5">
                <div className="bg-slate-100 border border-slate-300 px-2 py-1 font-black text-xs text-indigo-950 uppercase tracking-wide rounded-t">
                  2. PARENT & GUARDIAN DETAILS (తల్లిదండ్రుల వివరాలు)
                </div>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Father's Name (తండ్రి పేరు)</td>
                      <td className="w-1/4 p-2 font-bold text-slate-900 border-r border-slate-200 uppercase">
                        {admission.fatherName || '-'}
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Primary Mobile No.</td>
                      <td className="w-1/4 p-2 font-mono font-bold text-indigo-900">
                        {admission.phone || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mother's Name (తల్లి పేరు)</td>
                      <td className="w-1/4 p-2 font-bold text-slate-900 border-r border-slate-200 uppercase">
                        {admission.motherName || '-'}
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">WhatsApp / Emergency</td>
                      <td className="w-1/4 p-2 font-mono font-bold text-slate-800">
                        {admission.phone || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. FEE & REGISTRATION PARTICULARS */}
              <div className="mb-3.5">
                <div className="bg-slate-100 border border-slate-300 px-2 py-1 font-black text-xs text-indigo-950 uppercase tracking-wide rounded-t">
                  3. ADMISSION & FEE PARTICULARS (ఫీజు & అడ్మిషన్ వివరాలు)
                </div>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Admission Fee</td>
                      <td className="w-1/4 p-2 font-bold text-emerald-700 border-r border-slate-200">
                        {admission.admissionFee ? `₹ ${admission.admissionFee}` : 'As Per School Fee Structure'}
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Payment Mode</td>
                      <td className="w-1/4 p-2 font-bold text-slate-800 uppercase">
                        {admission.paymentMethod || 'CASH'}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Payment Status</td>
                      <td className="w-1/4 p-2 font-bold text-slate-800 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${admission.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {admission.paymentStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="w-1/4 p-2 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Admission Status</td>
                      <td className="w-1/4 p-2 font-bold text-slate-800">
                        <span className="font-black text-indigo-900 uppercase">
                          {admission.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. DECLARATION BY PARENT */}
              <div className="mb-4 border border-slate-300 rounded p-2.5 bg-slate-50/60">
                <h4 className="font-black text-[11px] text-slate-900 uppercase mb-1">
                  Declaration by Parent / Guardian (తల్లిదండ్రుల డిక్లరేషన్):
                </h4>
                <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                  I hereby declare that the particulars furnished above are true and correct to the best of my knowledge and belief. I agree to abide by the rules, regulations, and discipline of the school. I also understand that timely payment of school fees and regular attendance of my ward are mandatory.
                </p>
              </div>

              {/* 5. SIGNATURE BLOCKS */}
              <div className="mt-8 pt-4 border-t-2 border-slate-300">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="flex flex-col justify-end h-20">
                    <div className="border-t border-slate-800 mx-3 pt-1">
                      <p className="font-bold text-[11px] text-slate-900">Signature of Parent / Guardian</p>
                      <p className="text-[9px] text-slate-500">తల్లి / తండ్రి సంతకం</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end h-20">
                    <div className="border-t border-slate-800 mx-3 pt-1">
                      <p className="font-bold text-[11px] text-slate-900">Verified by (Teacher / Staff)</p>
                      <p className="text-[9px] text-slate-500">పరిశీలించిన ఉపాధ్యాయుడు</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-end h-20 relative">
                    <div className="border-t border-slate-800 mx-3 pt-1">
                      <p className="font-black text-[11px] text-slate-950">Principal / Correspondent</p>
                      <p className="text-[9px] text-slate-500">ప్రిన్సిపాల్ సంతకం & సీల్</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Seal Watermark Box */}
              <div className="mt-6 flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
                <span>JY School ERP System Generated Official Admission Record</span>
                <span>Page 1 of 1 • System Date: {new Date().toLocaleDateString('en-IN')}</span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Clean Print Portal (rendered in print media only) */}
      <div id="admission-print-root" className="hidden print:block">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #admission-print-root, #admission-print-root * {
              visibility: visible !important;
            }
            #admission-print-root {
              display: block !important;
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              background: white !important;
              z-index: 9999999 !important;
              margin: 0 !important;
              padding: 10mm 12mm !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
            .no-print {
              display: none !important;
            }
          }
        ` }} />

        {/* The Exact Same A4 Print Form */}
        <div className="w-[186mm] mx-auto text-slate-900 text-[11px] font-sans">
          {/* Header */}
          <div className="border-b-2 border-indigo-950 pb-2 mb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="w-14 h-14 border border-slate-300 rounded overflow-hidden shrink-0 flex items-center justify-center">
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="text-center flex-1">
                <h1 className="text-xl font-black text-indigo-950 uppercase font-serif tracking-wider">
                  {schoolName}
                </h1>
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mt-0.5">
                  Recognized by Govt. of Andhra Pradesh • English Medium
                </p>
                <p className="text-[9px] text-slate-600 font-medium">
                  {schoolAddress}
                </p>
                <p className="text-[9px] text-slate-600 font-bold">
                  Phone: {schoolPhone} | Email: {schoolEmail}
                </p>
              </div>
              <div className="w-[30mm] h-[36mm] border-2 border-dashed border-indigo-900 rounded overflow-hidden shrink-0 bg-slate-50 flex flex-col items-center justify-center text-center p-0.5">
                {admission.studentImage ? (
                  <img src={admission.studentImage} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[8px] font-bold text-slate-400 uppercase leading-tight p-1">
                    Affix Student Passport Photo
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 bg-indigo-950 text-white text-center py-1 rounded font-black text-xs tracking-widest uppercase">
              APPLICATION FOR ADMISSION / విద్యార్థి ప్రవేశ దరఖాస్తు
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 mt-1.5 px-1">
              <div>App No: <span className="font-mono font-black">{regNo}</span></div>
              <div>Date: <span className="font-black">{regDate}</span></div>
              <div>Class Applied: <span className="font-black uppercase">{admission.classApplied || 'N/A'}</span></div>
            </div>
          </div>

          {/* Table 1: Personal Details */}
          <div className="mb-3">
            <div className="bg-slate-200 border border-slate-400 px-2 py-0.5 font-black text-[10px] text-indigo-950 uppercase rounded-t">
              1. STUDENT PERSONAL INFORMATION
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Full Name</td>
                  <td className="w-3/4 p-1.5 font-black uppercase text-xs" colSpan={3}>{admission.studentName}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Gender</td>
                  <td className="w-1/4 p-1.5 font-bold uppercase border-r border-slate-200">{admission.gender || '-'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Date of Birth</td>
                  <td className="w-1/4 p-1.5 font-bold">
                    {admission.dob ? new Date(admission.dob).toLocaleDateString('en-IN') : '-'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Aadhar No.</td>
                  <td className="w-1/4 p-1.5 font-mono font-bold border-r border-slate-200">{admission.aadharNo || '-'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Class</td>
                  <td className="w-1/4 p-1.5 font-black uppercase">{admission.classApplied || '-'}</td>
                </tr>
                <tr>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Address</td>
                  <td className="w-3/4 p-1.5 leading-tight" colSpan={3}>{admission.address || 'Narasannapeta, Srikakulam Dist.'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 2: Parents */}
          <div className="mb-3">
            <div className="bg-slate-200 border border-slate-400 px-2 py-0.5 font-black text-[10px] text-indigo-950 uppercase rounded-t">
              2. PARENT & GUARDIAN DETAILS
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Father's Name</td>
                  <td className="w-1/4 p-1.5 font-bold uppercase border-r border-slate-200">{admission.fatherName || '-'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Contact Phone</td>
                  <td className="w-1/4 p-1.5 font-mono font-bold">{admission.phone || '-'}</td>
                </tr>
                <tr>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Mother's Name</td>
                  <td className="w-1/4 p-1.5 font-bold uppercase border-r border-slate-200">{admission.motherName || '-'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Emergency Phone</td>
                  <td className="w-1/4 p-1.5 font-mono font-bold">{admission.phone || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table 3: Fee */}
          <div className="mb-3">
            <div className="bg-slate-200 border border-slate-400 px-2 py-0.5 font-black text-[10px] text-indigo-950 uppercase rounded-t">
              3. ADMISSION & FEE PARTICULARS
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[10px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Admission Fee</td>
                  <td className="w-1/4 p-1.5 font-bold border-r border-slate-200">{admission.admissionFee ? `₹ ${admission.admissionFee}` : 'Standard Structure'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Payment Mode</td>
                  <td className="w-1/4 p-1.5 font-bold uppercase">{admission.paymentMethod || 'CASH'}</td>
                </tr>
                <tr>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Payment Status</td>
                  <td className="w-1/4 p-1.5 font-bold border-r border-slate-200 uppercase">{admission.paymentStatus || 'PENDING'}</td>
                  <td className="w-1/4 p-1.5 bg-slate-50 font-bold border-r border-slate-200">Status</td>
                  <td className="w-1/4 p-1.5 font-black uppercase">{admission.status || 'PENDING'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Declaration */}
          <div className="mb-3 border border-slate-300 rounded p-2 bg-slate-50">
            <h4 className="font-bold text-[9px] uppercase mb-0.5">Declaration by Parent / Guardian:</h4>
            <p className="text-[8.5px] text-slate-700 leading-tight">
              I hereby declare that the particulars furnished above are true and correct to the best of my knowledge and belief. I agree to abide by the rules, regulations, and discipline of the school.
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-6 pt-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col justify-end h-14">
                <div className="border-t border-slate-800 mx-2 pt-1">
                  <p className="font-bold text-[10px]">Parent Signature</p>
                  <p className="text-[8px] text-slate-500">తల్లి / తండ్రి సంతకం</p>
                </div>
              </div>
              <div className="flex flex-col justify-end h-14">
                <div className="border-t border-slate-800 mx-2 pt-1">
                  <p className="font-bold text-[10px]">Teacher / Verifier</p>
                  <p className="text-[8px] text-slate-500">ఉపాధ్యాయుని సంతకం</p>
                </div>
              </div>
              <div className="flex flex-col justify-end h-14">
                <div className="border-t border-slate-800 mx-2 pt-1">
                  <p className="font-black text-[10px]">Principal / Seal</p>
                  <p className="text-[8px] text-slate-500">ప్రిన్సిపాల్ సంతకం & ముద్ర</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
