import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';

interface AdmissionPrintModalProps {
  isOpen?: boolean;
  onClose: () => void;
  admission: any;
  schoolSettings?: any;
}

export const AdmissionPrintModal: React.FC<AdmissionPrintModalProps> = ({
  isOpen = true,
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

  const currentYear = new Date().getFullYear();
  const academicYear = admission.academicYear || `${currentYear}-${currentYear + 1}`;
  const regNo = `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;
  const regDate = admission.createdAt 
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');

  // Parse siblings safely
  let siblingsList: any[] = [];
  if (admission.siblingsData && admission.siblingsData !== 'NA') {
    try {
      siblingsList = typeof admission.siblingsData === 'string' ? JSON.parse(admission.siblingsData) : admission.siblingsData;
    } catch (e) {}
  }

  // Full formatted residence address
  const fullAddress = admission.address || [
    admission.doorNo,
    admission.village,
    admission.mandal,
    admission.district,
    admission.state
  ].filter(Boolean).join(', ') || 'Narasannapeta, Srikakulam District';

  const handlePrint = () => {
    window.print();
  };

  // Common sheet content component for preview and print
  const renderAdmissionSheet = () => (
    <div className="w-full bg-white text-slate-900 text-[10px] leading-tight font-sans">
      
      {/* 1. Header with Crest & Photo */}
      <div className="border-b-2 border-indigo-950 pb-2 mb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="w-full h-full object-contain p-1" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = '🏛️';
              }}
            />
          </div>

          <div className="text-center flex-1">
            <h1 className="text-base font-black text-indigo-950 tracking-wide uppercase font-serif">
              {schoolName}
            </h1>
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
              Recognized by Govt. of Andhra Pradesh • English Medium
            </p>
            <p className="text-[8.5px] text-slate-600 font-medium">
              {schoolAddress}
            </p>
            <p className="text-[8.5px] text-slate-600 font-semibold">
              Phone: <span className="font-bold text-slate-800">{schoolPhone}</span> | Email: <span className="font-bold text-slate-800">{schoolEmail}</span>
            </p>
          </div>

          {/* Passport Photo */}
          <div className="w-[28mm] h-[34mm] border-2 border-dashed border-indigo-950/40 rounded overflow-hidden shrink-0 bg-slate-50 flex flex-col items-center justify-center text-center p-0.5">
            {admission.studentImage ? (
              <img 
                src={admission.studentImage} 
                alt={admission.studentName} 
                className="w-full h-full object-cover rounded" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <span className="text-xl">👤</span>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase leading-none mt-1">
                  Affix Student<br />Photo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Title Ribbon */}
        <div className="mt-1.5 bg-indigo-950 text-white text-center py-1 px-2 rounded font-black text-xs tracking-wider uppercase">
          APPLICATION FOR ADMISSION & STUDENT RECORD
        </div>

        {/* Meta Bar */}
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-700 mt-1 px-1">
          <div>Application No: <span className="font-mono font-black text-indigo-900 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">{regNo}</span></div>
          <div>Date: <span className="font-black text-slate-900">{regDate}</span></div>
          <div>Academic Year: <span className="font-black text-indigo-900">{academicYear}</span></div>
          <div>Class Applied: <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200 uppercase">{admission.classApplied || 'N/A'}</span></div>
        </div>
      </div>

      {/* 2. Student Personal Information */}
      <div className="mb-2">
        <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 font-black text-[9.5px] text-indigo-950 uppercase tracking-wide rounded-t">
          1. STUDENT PERSONAL INFORMATION
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Student Full Name</td>
              <td className="w-[42%] p-1.5 font-black text-slate-900 uppercase text-[10.5px] border-r border-slate-200">{admission.studentName || '-'}</td>
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Gender</td>
              <td className="w-[22%] p-1.5 font-black text-slate-900 uppercase">{admission.gender || '-'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Date of Birth</td>
              <td className="p-1.5 font-bold text-slate-800 border-r border-slate-200">
                {admission.dob ? new Date(admission.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Student Aadhaar</td>
              <td className="p-1.5 font-mono font-bold text-slate-900">{admission.aadharNo || '-'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mother Tongue</td>
              <td className="p-1.5 font-bold text-slate-800 border-r border-slate-200">{admission.motherTongue || 'Telugu'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Nationality</td>
              <td className="p-1.5 font-bold text-slate-800">{admission.nationality || 'Indian'}</td>
            </tr>
            <tr>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Religion</td>
              <td className="p-1.5 font-bold text-slate-800 border-r border-slate-200">{admission.religion || 'Hindu'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Caste / Sub-Caste</td>
              <td className="p-1.5 font-bold text-slate-800">
                {admission.caste || '-'}{admission.subCaste ? ` (${admission.subCaste})` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Parent & Guardian Details */}
      <div className="mb-2">
        <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 font-black text-[9.5px] text-indigo-950 uppercase tracking-wide rounded-t">
          2. PARENT & GUARDIAN PARTICULARS
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Father's Name</td>
              <td className="w-[32%] p-1.5 font-black text-slate-900 uppercase border-r border-slate-200">{admission.fatherName || '-'}</td>
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Occupation</td>
              <td className="w-[32%] p-1.5 font-bold text-slate-800">{admission.fatherOccupation || '-'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Father Aadhar No</td>
              <td className="p-1.5 font-mono font-bold text-slate-800 border-r border-slate-200">{admission.fatherAadhar || '-'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mobile No</td>
              <td className="p-1.5 font-mono font-bold text-indigo-900">{admission.fatherPhone || admission.phone || '-'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mother's Name</td>
              <td className="p-1.5 font-black text-slate-900 uppercase border-r border-slate-200">{admission.motherName || '-'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Occupation</td>
              <td className="p-1.5 font-bold text-slate-800">{admission.motherOccupation || '-'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mother Aadhar No</td>
              <td className="p-1.5 font-mono font-bold text-slate-800 border-r border-slate-200">{admission.motherAadhar || '-'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Mobile No</td>
              <td className="p-1.5 font-mono font-bold text-indigo-900">{admission.motherPhone || '-'}</td>
            </tr>
            <tr>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Primary Contact No</td>
              <td className="p-1.5 font-mono font-black text-indigo-950 border-r border-slate-200">{admission.phone || '-'}</td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Alternate Mobile No</td>
              <td className="p-1.5 font-mono font-bold text-slate-800">{admission.alternatePhone || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Residential Address & Previous School */}
      <div className="mb-2">
        <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 font-black text-[9.5px] text-indigo-950 uppercase tracking-wide rounded-t">
          3. RESIDENTIAL ADDRESS & PREVIOUS SCHOOL
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Residence</td>
              <td className="w-[82%] p-1.5 font-medium text-slate-900" colSpan={3}>
                {fullAddress}
              </td>
            </tr>
            <tr>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Previous School Studied</td>
              <td className="p-1.5 font-bold text-slate-900" colSpan={3}>
                {admission.previousSchool || 'N/A (Fresher)'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Sibling Details */}
      <div className="mb-2">
        <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 font-black text-[9.5px] text-indigo-950 uppercase tracking-wide rounded-t flex justify-between">
          <span>4. SIBLING DETAILS</span>
          <span className="font-semibold text-[8.5px] text-slate-500">{siblingsList.length > 0 ? 'Brothers / Sisters Reported' : 'NA'}</span>
        </div>
        {siblingsList.length > 0 ? (
          <table className="w-full border-collapse border border-slate-300 text-[9px]">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-300">
              <tr>
                <th className="p-1 w-8 text-center border-r border-slate-300">S.NO</th>
                <th className="p-1 border-r border-slate-300">NAME</th>
                <th className="p-1 w-24 border-r border-slate-300">CLASS</th>
                <th className="p-1">WHERE HE / SHE STUDYING</th>
              </tr>
            </thead>
            <tbody>
              {siblingsList.map((sib, i) => (
                <tr key={i} className="border-b border-slate-200 last:border-b-0">
                  <td className="p-1 text-center font-bold text-slate-600 border-r border-slate-200">{i + 1}</td>
                  <td className="p-1 font-bold text-slate-900 border-r border-slate-200 uppercase">{sib.name || '-'}</td>
                  <td className="p-1 font-semibold text-slate-800 border-r border-slate-200">{sib.className || '-'}</td>
                  <td className="p-1 text-slate-800">{sib.schoolName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-slate-300 p-1.5 text-center text-slate-500 font-bold text-[9px]">
            Sibling Details : NA (No Siblings Recorded)
          </div>
        )}
      </div>

      {/* 6. Application Fee & Mode */}
      <div className="mb-2">
        <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 font-black text-[9.5px] text-indigo-950 uppercase tracking-wide rounded-t">
          5. APPLICATION FEE & PAYMENT PARTICULARS
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Application Fee</td>
              <td className="w-[32%] p-1.5 font-black text-emerald-800 border-r border-slate-200">
                {admission.admissionFee ? `₹ ${admission.admissionFee}` : 'As Per School Structure'}
              </td>
              <td className="w-[18%] p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Payment Mode</td>
              <td className="w-[32%] p-1.5 font-bold text-slate-900 uppercase">
                {admission.paymentMethod || 'CASH'}
              </td>
            </tr>
            <tr>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Payment Status</td>
              <td className="p-1.5 font-black border-r border-slate-200">
                <span className={`px-1.5 py-0.2 rounded text-[8.5px] ${admission.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                  {admission.paymentStatus || 'PENDING'}
                </span>
              </td>
              <td className="p-1.5 bg-slate-50 font-bold text-slate-700 border-r border-slate-200">Cash Received By</td>
              <td className="p-1.5 font-bold text-amber-900 bg-amber-50/30">
                {admission.cashReceivedByName || (admission.paymentMethod === 'CASH' ? 'School Office' : 'N/A (Online/UPI)')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. Following Terms and Conditions Should Strictly Be Followed */}
      <div className="mb-2 border border-slate-300 rounded overflow-hidden">
        <div className="bg-rose-900 text-white font-black text-[9px] px-2 py-0.5 uppercase tracking-wide">
          FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED
        </div>
        <div className="p-2 bg-slate-50/80 text-[8px] leading-snug space-y-1 font-medium text-slate-800">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <div>1. Student should obey the rules and regulations set by the management.</div>
            <div>2. Student would not be allowed to move around premises without uniform.</div>
            <div>3. During school time no visitor is allowed.</div>
            <div>4. During school time parents should not approach teachers without permission.</div>
            <div>5. Management has right to reject/accept application or strike out student.</div>
            <div>6. In case of damage to school property, parent would pay value of damage.</div>
            <div>7. Decision of management would be final and parties would accept it.</div>
            <div>8. Absent for 10 days without info leads to name being struck out.</div>
            <div>9. Student has to pay all dues again to be readmitted.</div>
            <div>10. Fee collected in 3 terms. Otherwise fee concession not allowed.</div>
            <div className="col-span-2 font-bold text-rose-900">11. The fee once paid will strictly NOT be refunded under any circumstances.</div>
          </div>
        </div>
      </div>

      {/* 8. Signatures Block */}
      <div className="mt-4 pt-2 border-t-2 border-slate-300">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col justify-end h-14">
            <div className="border-t border-slate-900 mx-2 pt-1">
              <p className="font-bold text-[9.5px] text-slate-900">Signature of Parent / Guardian</p>
            </div>
          </div>

          <div className="flex flex-col justify-end h-14">
            <div className="border-t border-slate-900 mx-2 pt-1">
              <p className="font-bold text-[9.5px] text-slate-900">Verified by (Teacher / Staff)</p>
              {admission.registeredByName && (
                <p className="text-[8px] text-indigo-900 font-semibold">{admission.registeredByName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-end h-14">
            <div className="border-t border-slate-900 mx-2 pt-1">
              <p className="font-black text-[9.5px] text-slate-950">Principal / Correspondent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="mt-3 flex justify-between items-center text-[7.5px] text-slate-400 border-t border-slate-200 pt-1">
        <span>JY School ERP System Generated Official Admission Record</span>
        <span>Page 1 of 1 • System Date: {new Date().toLocaleDateString('en-IN')}</span>
      </div>

    </div>
  );

  return createPortal(
    <>
      {/* Screen Backdrop & Actions Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Top Bar */}
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
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-white text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-50 shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Form (A4)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Preview Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/80 flex justify-center">
            <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl border border-slate-200 p-[10mm] text-slate-900">
              {renderAdmissionSheet()}
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
              padding: 8mm 10mm !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
            }
          }
        `}} />
        {renderAdmissionSheet()}
      </div>
    </>,
    document.body
  );
};

export default AdmissionPrintModal;

