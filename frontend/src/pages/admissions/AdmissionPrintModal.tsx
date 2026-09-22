import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

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

  const schoolName = schoolSettings?.schoolName || 'SRI VENKATESWARA JY PUBLIC SCHOOL';
  const schoolSociety = 'SRI VENKATESWARA EDUCATIONAL SOCIETY (REGD. NO. 412/2005)';
  const schoolSub = '(IIT-JEE • NEET FOUNDATION & ALL-INDIA OLYMPIAD ACADEMY)';
  const schoolAddress = schoolSettings?.address || 'SVL Paradise Campus, Opp. Hero Showroom, Narasannapeta, Srikakulam Dist. – 532421';
  const schoolContact = 'Ph: +91 95029 24433, 98481 23456 | Email: info@svjyschool.edu.in | Web: www.jyschool.edu.in';
  const schoolLogo = schoolSettings?.logoUrl || '/logo.png';

  const currentYear = new Date().getFullYear();
  const academicYear = admission.academicYear || `${currentYear}-${currentYear + 1}`;
  const regNo = admission.regNo || `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;

  const regDate = admission.createdAt
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Date of Birth Digits [D][D] [M][M] [Y][Y][Y][Y]
  let dobDigits = ['', '', '', '', '', '', '', ''];
  let formattedDobText = '';
  if (admission.dob) {
    try {
      const d = new Date(admission.dob);
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = String(d.getFullYear());
      dobDigits = [
        dayStr[0], dayStr[1],
        monthStr[0], monthStr[1],
        yearStr[0], yearStr[1], yearStr[2], yearStr[3]
      ];
      formattedDobText = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {}
  }

  // Gender flags
  const genderUpper = (admission.gender || '').toString().toUpperCase();
  const isBoy = genderUpper === 'MALE' || genderUpper === 'BOY';
  const isGirl = genderUpper === 'FEMALE' || genderUpper === 'GIRL';

  // Parse siblings safely
  let siblingsList: any[] = [];
  if (admission.siblingsData && admission.siblingsData !== 'NA') {
    try {
      siblingsList = typeof admission.siblingsData === 'string' ? JSON.parse(admission.siblingsData) : admission.siblingsData;
    } catch (e) {}
  }

  // Full formatted residence address
  const fullAddress = admission.address || [
    admission.doorNo ? `D.No: ${admission.doorNo}` : null,
    admission.village,
    admission.sachivalayam ? `Sachivalayam: ${admission.sachivalayam}` : null,
    admission.mandal ? `Mandal: ${admission.mandal}` : null,
    admission.district ? `Dist: ${admission.district}` : null,
    admission.state || 'Andhra Pradesh',
    admission.pincode ? `PIN: ${admission.pincode}` : null,
  ].filter(Boolean).join(', ') || 'Narasannapeta, Srikakulam District, Andhra Pradesh';

  const feeAmount = admission.admissionFee 
    ? `₹ ${Number(admission.admissionFee).toLocaleString('en-IN')}` 
    : 'As Prescribed by Management';

  const resolveImg = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const base = import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998';
    return `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Page 1: Official Student Admission Dossier & Tear-Off Acknowledgement Slip
  const renderPage1 = () => (
    <div className="a4-page bg-white text-slate-900 box-border w-[210mm] h-[297mm] p-[5mm] relative flex flex-col justify-between overflow-hidden shadow-sm mx-auto mb-6 print:mb-0 print:border-none print:shadow-none print:p-[5mm]">
      {/* Outer Institutional Navy Certificate Border */}
      <div className="w-full h-full border-[2.5px] border-[#1e3a8a] p-[2.5mm] box-border flex flex-col justify-between">
        {/* Inner Fine Navy Border */}
        <div className="w-full h-full border border-[#1e3a8a] p-[4mm] box-border flex flex-col justify-between">
          
          {/* TOP SECTION: INSTITUTIONAL HEADER & PHOTO */}
          <div>
            <div className="flex items-center justify-between gap-3 border-b-2 border-[#1e3a8a] pb-2.5">
              {/* School Emblem / Crest */}
              <div className="w-[20mm] h-[20mm] rounded-full border-2 border-[#1e3a8a] p-1 flex items-center justify-center bg-white shrink-0 shadow-sm">
                <img
                  src={schoolLogo}
                  alt="School Crest"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<div class="text-center font-black text-[9px] text-[#1e3a8a] leading-tight">SVJY<br/><span class="text-[7px]">ACADEMY</span></div>';
                    }
                  }}
                />
              </div>

              {/* Institution Identity */}
              <div className="text-center flex-1">
                <p className="text-[7.5px] font-extrabold uppercase tracking-[0.2em] text-slate-600 mb-0.5">
                  {schoolSociety}
                </p>
                <h1 className="text-[18px] font-black uppercase tracking-wider text-[#1e3a8a] leading-none font-serif mb-1 drop-shadow-sm">
                  {schoolName}
                </h1>
                <p className="text-[9.5px] font-black uppercase tracking-wider text-[#c2410c] mb-0.5">
                  {schoolSub}
                </p>
                <p className="text-[8.5px] font-semibold text-slate-700 leading-tight">
                  {schoolAddress}
                </p>
                <p className="text-[7.5px] font-medium text-slate-500 mt-0.5">
                  {schoolContact}
                </p>
              </div>

              {/* Passport Photo Box (Official 32mm x 40mm) */}
              <div className="w-[30mm] h-[38mm] border-2 border-[#1e3a8a] rounded-sm bg-slate-50 p-0.5 flex flex-col items-center justify-center text-center shrink-0 overflow-hidden shadow-sm">
                {admission.studentImage ? (
                  <img
                    src={resolveImg(admission.studentImage)}
                    alt={admission.studentName}
                    className="w-full h-full object-cover rounded-xs"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-slate-400">
                    <div className="w-8 h-8 border border-dashed border-slate-400 rounded-full flex items-center justify-center mb-1">
                      <span className="text-[12px] font-bold">📷</span>
                    </div>
                    <span className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight leading-tight">
                      Affix Recent<br />Passport Size<br />Photograph
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* DOSSIER TITLE RIBBON */}
            <div className="mt-2 bg-[#1e3a8a] text-white py-1 px-3 flex items-center justify-between rounded-xs shadow-sm">
              <span className="text-[8.5px] font-extrabold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-xs">
                OFFICIAL ADMISSION RECORD
              </span>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-center">
                STUDENT ADMISSION REGISTRATION DOSSIER ({academicYear})
              </h2>
              <span className="text-[8.5px] font-extrabold tracking-widest uppercase text-amber-300">
                ORIGINAL DOSSIER
              </span>
            </div>

            {/* QUICK METADATA BAR (4 Columns) */}
            <div className="grid grid-cols-4 border border-t-0 border-slate-400 bg-slate-100 text-[9px] divide-x divide-slate-400 font-sans">
              <div className="p-1.5 flex items-baseline gap-1">
                <span className="text-slate-500 font-bold uppercase">Admn No:</span>
                <span className="font-mono font-black text-slate-950">{regNo}</span>
              </div>
              <div className="p-1.5 flex items-baseline gap-1">
                <span className="text-slate-500 font-bold uppercase">Date:</span>
                <span className="font-bold text-slate-950">{regDate}</span>
              </div>
              <div className="p-1.5 flex items-baseline gap-1">
                <span className="text-slate-500 font-bold uppercase">Class Seeking:</span>
                <span className="font-black text-[#1e3a8a] uppercase">{admission.classApplied || 'N/A'}</span>
              </div>
              <div className="p-1.5 flex items-baseline gap-1">
                <span className="text-slate-500 font-bold uppercase">Academic Year:</span>
                <span className="font-bold text-slate-950">{academicYear}</span>
              </div>
            </div>

            {/* SECTION 1: STUDENT BIODATA & PERSONAL PARTICULAR */}
            <div className="mt-2.5">
              <div className="bg-slate-200/90 border border-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 1: STUDENT BIODATA & IDENTIFICATION
                </span>
                <span className="text-[7.5px] font-bold text-slate-600 uppercase">Part A</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[9.5px]">
                <tbody>
                  {/* Full Name & Gender */}
                  <tr className="border-b border-slate-300">
                    <td className="w-36 bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Full Name of the Student:
                    </td>
                    <td className="p-1.5 font-black text-slate-950 uppercase tracking-wide border-r border-slate-300 text-[10.5px]">
                      {admission.studentName || '—'}
                    </td>
                    <td className="w-24 bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Gender:
                    </td>
                    <td className="w-36 p-1.5 font-bold">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3.5 h-3.5 border border-slate-800 rounded-xs inline-flex items-center justify-center font-black text-[9px] text-[#1e3a8a]">
                            {isBoy ? '✓' : ''}
                          </span>
                          <span>BOY (Male)</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3.5 h-3.5 border border-slate-800 rounded-xs inline-flex items-center justify-center font-black text-[9px] text-[#1e3a8a]">
                            {isGirl ? '✓' : ''}
                          </span>
                          <span>GIRL (Female)</span>
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Date of Birth & Mother Tongue */}
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Date of Birth:
                    </td>
                    <td className="p-1.5 border-r border-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <div className="flex border border-slate-700 rounded-xs overflow-hidden">
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] border-r border-slate-400 bg-white">{dobDigits[0]}</span>
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] bg-white">{dobDigits[1]}</span>
                          </div>
                          <span className="mx-1 text-slate-400 font-bold">/</span>
                          <div className="flex border border-slate-700 rounded-xs overflow-hidden">
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] border-r border-slate-400 bg-white">{dobDigits[2]}</span>
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] bg-white">{dobDigits[3]}</span>
                          </div>
                          <span className="mx-1 text-slate-400 font-bold">/</span>
                          <div className="flex border border-slate-700 rounded-xs overflow-hidden">
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] border-r border-slate-400 bg-white">{dobDigits[4]}</span>
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] border-r border-slate-400 bg-white">{dobDigits[5]}</span>
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] border-r border-slate-400 bg-white">{dobDigits[6]}</span>
                            <span className="w-4 h-4 inline-flex items-center justify-center font-black font-mono text-[9.5px] bg-white">{dobDigits[7]}</span>
                          </div>
                        </div>
                        {formattedDobText && (
                          <span className="text-[8.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            ({formattedDobText})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Mother Tongue:
                    </td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {admission.motherTongue || 'Telugu'}
                    </td>
                  </tr>

                  {/* Student Aadhaar & Nationality & Religion */}
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Student Aadhaar Number:
                    </td>
                    <td className="p-1.5 font-mono font-bold text-slate-950 border-r border-slate-300">
                      {admission.aadharNo || 'Not Provided / Pending'}
                    </td>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Nationality / Religion:
                    </td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {admission.nationality || 'Indian'} • {admission.religion || 'Hindu'}
                    </td>
                  </tr>

                  {/* Social Category & Sub-Caste & State */}
                  <tr>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Social Category & Caste:
                    </td>
                    <td className="p-1.5 font-bold text-slate-950 border-r border-slate-300">
                      <span className="inline-block bg-[#1e3a8a]/10 text-[#1e3a8a] px-1.5 py-0.2 rounded font-black text-[9px] mr-2">
                        {admission.caste || 'General / OC'}
                      </span>
                      <span>Sub-Caste: </span>
                      <span className="font-bold text-slate-900 underline underline-offset-2">
                        {admission.subCaste || '—'}
                      </span>
                    </td>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Domicile State:
                    </td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {admission.state || 'Andhra Pradesh'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: PARENT & GUARDIAN PARTICULARS (Comparison Table) */}
            <div className="mt-2.5">
              <div className="bg-slate-200/90 border border-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 2: PARENT & GUARDIAN DETAILS
                </span>
                <span className="text-[7.5px] font-bold text-slate-600 uppercase">Part B</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-700 font-extrabold text-[8.5px] uppercase tracking-wider">
                    <th className="w-36 p-1 text-left border-r border-slate-300 pl-2">PARTICULAR</th>
                    <th className="p-1 text-left border-r border-slate-300 pl-2">FATHER / PRIMARY GUARDIAN</th>
                    <th className="p-1 text-left pl-2">MOTHER / SECONDARY GUARDIAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Full Legal Name:
                    </td>
                    <td className="p-1.5 font-black text-slate-950 uppercase border-r border-slate-300">
                      {admission.fatherName ? `SRI ${admission.fatherName}` : '—'}
                    </td>
                    <td className="p-1.5 font-black text-slate-950 uppercase">
                      {admission.motherName ? `SMT ${admission.motherName}` : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Occupation / Profession:
                    </td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300">
                      {admission.fatherOccupation || '—'}
                    </td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {admission.motherOccupation || 'Home Maker'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Aadhaar Card Number:
                    </td>
                    <td className="p-1.5 font-mono font-bold text-slate-950 border-r border-slate-300">
                      {admission.fatherAadhar || '—'}
                    </td>
                    <td className="p-1.5 font-mono font-bold text-slate-950">
                      {admission.motherAadhar || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Mobile Contact Number:
                    </td>
                    <td className="p-1.5 font-mono font-black text-[#1e3a8a] border-r border-slate-300">
                      {admission.fatherPhone || admission.phone || '—'}
                    </td>
                    <td className="p-1.5 font-mono font-bold text-slate-900">
                      {admission.motherPhone || admission.alternatePhone || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: RESIDENTIAL & PREVIOUS ACADEMIC PARTICULARS */}
            <div className="mt-2.5">
              <div className="bg-slate-200/90 border border-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 3: RESIDENCE, PREVIOUS SCHOOL & FEE STRUCTURE
                </span>
                <span className="text-[7.5px] font-bold text-slate-600 uppercase">Part C</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[9.5px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-36 bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Permanent Residence Address:
                    </td>
                    <td colSpan={3} className="p-1.5 font-semibold text-slate-900 leading-snug">
                      {fullAddress}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Previous School Attended:
                    </td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300">
                      {admission.previousSchool || 'N/A (Direct Entry / Fresher)'}
                    </td>
                    <td className="w-32 bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Previous Class / TC:
                    </td>
                    <td className="w-48 p-1.5 font-bold text-slate-900">
                      {admission.previousClass ? `Class: ${admission.previousClass}` : 'Fresher'} • TC: Attached
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 p-1.5 font-bold text-slate-700 border-r border-slate-300">
                      Annual Institutional Fee Fixed:
                    </td>
                    <td colSpan={3} className="p-1.5 font-black text-slate-950 bg-amber-50/50">
                      <span className="text-[#c2410c] text-[11px] mr-3">{feeAmount}</span>
                      <span className="text-[8px] font-bold text-slate-600">
                        (Payable in 3 Scheduled Terms as per Institutional Norms)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER SECTION: TEAR-OFF PERFORATION & OFFICIAL ACKNOWLEDGEMENT SLIP */}
          <div className="mt-3 pt-1">
            {/* Scissor Perforation Divider */}
            <div className="relative border-t-2 border-dashed border-slate-600 my-1 text-center">
              <span className="bg-white px-3 font-mono font-bold text-[8px] tracking-widest text-slate-500 uppercase absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                ✂ CUT HERE / TEAR ALONG PERFORATION (PARENT / STUDENT ACKNOWLEDGEMENT COPY) ✂
              </span>
            </div>

            {/* Acknowledgement Card */}
            <div className="border border-slate-400 bg-slate-50/80 rounded-xs p-2.5 mt-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-[#1e3a8a] flex items-center justify-center bg-white">
                    <img src={schoolLogo} alt="Crest" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a] leading-tight">
                      {schoolName}
                    </h3>
                    <p className="text-[7.5px] font-semibold text-slate-600">
                      Narasannapeta, Srikakulam Dist. | Official Admission Acknowledgement
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-[#1e3a8a] text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded tracking-widest">
                    ADMISSION ACKNOWLEDGEMENT SLIP
                  </span>
                  <p className="text-[7.5px] font-mono text-slate-500 mt-0.5">
                    Ref: {regNo} • Date: {regDate}
                  </p>
                </div>
              </div>

              {/* Acknowledgement Particulars Table */}
              <table className="w-full border-collapse border border-slate-300 text-[9px] bg-white">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-32 bg-slate-100 p-1 font-bold text-slate-600 border-r border-slate-200">
                      Student Full Name:
                    </td>
                    <td className="p-1 font-black text-slate-950 uppercase border-r border-slate-200">
                      {admission.studentName}
                    </td>
                    <td className="w-24 bg-slate-100 p-1 font-bold text-slate-600 border-r border-slate-200">
                      Class Allotted:
                    </td>
                    <td className="p-1 font-black text-[#1e3a8a] uppercase">
                      {admission.classApplied || '—'} ({academicYear})
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1 font-bold text-slate-600 border-r border-slate-200">
                      Parent / Guardian Name:
                    </td>
                    <td className="p-1 font-bold text-slate-900 uppercase border-r border-slate-200">
                      {admission.fatherName || admission.motherName || '—'}
                    </td>
                    <td className="bg-slate-100 p-1 font-bold text-slate-600 border-r border-slate-200">
                      Annual Fee Fixed:
                    </td>
                    <td className="p-1 font-black text-slate-950">
                      {feeAmount}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures for Acknowledgement */}
              <div className="grid grid-cols-3 gap-6 items-end mt-5 pt-1 px-3">
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-bold text-[8.5px] text-slate-800">Signature of Parent / Guardian</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-bold text-[8.5px] text-slate-800">Cashier / Admission Incharge</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-black text-[8.5px] text-[#1e3a8a]">Principal & Correspondent (Seal)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer Note */}
            <div className="flex items-center justify-between text-[7px] text-slate-400 mt-1.5 px-1 font-sans">
              <span>Sri Venkateswara JY Public School • Student Admission Dossier</span>
              <span className="font-bold">Page 1 of 2 (Official Registration Record)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // Render Page 2: Sibling Particulars, Institutional Code of Conduct, Parental Declaration & Scrutiny
  const renderPage2 = () => (
    <div className="a4-page bg-white text-slate-900 box-border w-[210mm] h-[297mm] p-[5mm] relative flex flex-col justify-between overflow-hidden shadow-sm mx-auto mb-6 print:mb-0 print:border-none print:shadow-none print:p-[5mm]">
      {/* Outer Institutional Navy Certificate Border */}
      <div className="w-full h-full border-[2.5px] border-[#1e3a8a] p-[2.5mm] box-border flex flex-col justify-between">
        {/* Inner Fine Navy Border */}
        <div className="w-full h-full border border-[#1e3a8a] p-[4mm] box-border flex flex-col justify-between">

          {/* TOP SECTION: PAGE 2 INSTITUTIONAL BANNER */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#1e3a8a] pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full border border-[#1e3a8a] p-0.5 flex items-center justify-center bg-white">
                  <img src={schoolLogo} alt="Crest" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-wide text-[#1e3a8a] leading-none font-serif">
                    {schoolName}
                  </h2>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                    INSTITUTIONAL CODE OF CONDUCT, TERMS & CONDITIONS & UNDERTAKING
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-slate-900 text-white font-mono text-[8.5px] font-bold px-2 py-0.5 rounded">
                  {regNo}
                </span>
                <p className="text-[8px] font-bold text-[#1e3a8a] mt-0.5">
                  Student: {admission.studentName} ({admission.classApplied || 'N/A'})
                </p>
              </div>
            </div>

            {/* SECTION 4: SIBLING PARTICULARS */}
            <div className="mt-2.5">
              <div className="bg-slate-200/90 border border-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 4: SIBLING INFORMATION (STUDYING IN SVJY OR OTHER INSTITUTIONS)
                </span>
                <span className="text-[7.5px] font-bold text-slate-600 uppercase">Part D</span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[9px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-700 font-extrabold text-[8px] uppercase tracking-wider">
                    <th className="w-12 p-1 text-center border-r border-slate-300">S.NO</th>
                    <th className="p-1 text-left border-r border-slate-300 pl-2">NAME OF SIBLING</th>
                    <th className="w-28 p-1 text-center border-r border-slate-300">CLASS / GRADE</th>
                    <th className="p-1 text-left pl-2">WHERE HE / SHE IS STUDYING</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3].map((idx) => {
                    const sib = siblingsList[idx];
                    return (
                      <tr key={idx} className="border-b border-slate-300 last:border-b-0 h-[18px]">
                        <td className="p-1 text-center font-bold font-mono border-r border-slate-300 text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-1 pl-2 border-r border-slate-300 font-black text-slate-950 uppercase">
                          {sib ? sib.name : (idx === 0 && siblingsList.length === 0 ? 'NA (No Siblings Recorded / Only Child)' : '—')}
                        </td>
                        <td className="p-1 text-center border-r border-slate-300 font-bold text-slate-800">
                          {sib ? sib.className : '—'}
                        </td>
                        <td className="p-1 pl-2 font-medium text-slate-700">
                          {sib ? sib.schoolName : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SECTION 5: TERMS AND CONDITIONS (11 Points) */}
            <div className="mt-2.5">
              <div className="bg-slate-200/90 border border-slate-400 px-2 py-0.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 5: CODE OF CONDUCT & INSTITUTIONAL RULES (MANDATORY COMPLIANCE)
                </span>
                <span className="text-[7.5px] font-bold text-slate-600 uppercase">11 Rules</span>
              </div>

              <div className="border border-t-0 border-slate-400 p-2 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] leading-tight font-sans text-slate-800">
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">1.</span>
                    <span><strong>Student Discipline:</strong> Student must strictly obey all rules, disciplinary standards, and regulations set by the management.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">2.</span>
                    <span><strong>Prescribed Uniform:</strong> Students are not permitted to enter or move around school premises without proper prescribed uniform and ID card.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">3.</span>
                    <span><strong>Campus Visitors:</strong> During school instructional hours, no outside visitors or parents are permitted into classroom areas.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">4.</span>
                    <span><strong>Parent-Faculty Protocol:</strong> Parents must not approach teachers directly during school hours without prior permission of the management.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">5.</span>
                    <span><strong>Disciplinary Authority:</strong> Management reserves full right to accept or reject admissions. Names will be struck off for continuous indiscipline.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">6.</span>
                    <span><strong>Property Indemnity:</strong> In case of willful or accidental damage to school property/lab, parents must reimburse the exact value of damage.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">7.</span>
                    <span><strong>Finality of Decision:</strong> In all disciplinary and administrative matters, the decision of the School Management is final and binding.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">8.</span>
                    <span><strong>Attendance & Absence:</strong> Continuous absence for 10 days without written leave will result in striking off rolls. Prior leave approval is mandatory.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">9.</span>
                    <span><strong>Readmission Terms:</strong> For struck-off admissions, readmission is subject to management discretion upon clearing all arrears and re-entry charges.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-black text-[#1e3a8a] shrink-0">10.</span>
                    <span><strong>Term Payment Schedule:</strong> Fees must be cleared in 3 installments as stipulated; delayed fee payments will revoke all concession eligibility.</span>
                  </div>
                  <div className="flex items-start gap-1 col-span-2 bg-amber-50 border border-amber-200 p-1 rounded-xs">
                    <span className="font-black text-[#c2410c] shrink-0">11.</span>
                    <span className="font-bold text-[#c2410c]">
                      Strict Non-Refundability: All institutional fees (admission, tuition, activity, digital curriculum) once paid are non-refundable and non-transferable under any circumstances.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: FEE PAYMENT INSTALLMENT SCHEDULE */}
            <div className="mt-2">
              <div className="grid grid-cols-3 border border-slate-400 text-center divide-x divide-slate-400 bg-white shadow-xs">
                <div className="p-1.5 bg-slate-50">
                  <p className="text-[7.5px] font-extrabold uppercase text-slate-500">Term 1 Installment</p>
                  <p className="text-[9.5px] font-black text-[#1e3a8a]">August 1st Week</p>
                </div>
                <div className="p-1.5 bg-slate-50">
                  <p className="text-[7.5px] font-extrabold uppercase text-slate-500">Term 2 Installment</p>
                  <p className="text-[9.5px] font-black text-[#1e3a8a]">November 1st Week</p>
                </div>
                <div className="p-1.5 bg-slate-50">
                  <p className="text-[7.5px] font-extrabold uppercase text-slate-500">Term 3 Installment</p>
                  <p className="text-[9.5px] font-black text-[#1e3a8a]">Before Sankranti Holidays</p>
                </div>
              </div>
            </div>

            {/* SECTION 7: FORMAL PARENTAL DECLARATION & UNDERTAKING */}
            <div className="mt-2.5 border border-slate-500 rounded-xs p-2.5 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1">
                <h4 className="font-serif font-black text-[9.5px] uppercase tracking-wider text-[#1e3a8a]">
                  FORMAL DECLARATION & UNDERTAKING BY PARENT / GUARDIAN
                </h4>
                <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a]" />
              </div>
              <p className="text-[8.5px] leading-relaxed text-justify text-slate-800 font-sans">
                I, <strong className="uppercase text-slate-950 font-black underline underline-offset-2">{admission.fatherName || admission.motherName || 'Parent / Guardian'}</strong>, Parent / Legal Guardian of <strong className="uppercase text-slate-950 font-black underline underline-offset-2">{admission.studentName || 'Student'}</strong>, seeking admission into <strong className="text-[#1e3a8a]">{admission.classApplied || 'Class'}</strong> for Academic Year <strong>{academicYear}</strong>, do hereby solemnly declare that if my child is admitted, I promise to send my child daily to school in time with complete books and prescribed uniform, and pay the fee regularly. I will follow all rules and regulations and abide by the directions given by the school authority. I also state that outside of school hours, it is my sole responsibility to take care of the child. I declare that all information furnished above is true and correct to the best of my knowledge; if found incorrect at any stage, the admission of my ward may be cancelled immediately.
              </p>

              <div className="flex justify-between items-end mt-4 pt-1 px-2">
                <div className="space-y-0.5 text-[8.5px]">
                  <div><span className="font-bold text-slate-500">PLACE:</span> <span className="font-bold text-slate-900">Narasannapeta</span></div>
                  <div><span className="font-bold text-slate-500">DATE:</span> <span className="font-bold text-slate-900">{regDate}</span></div>
                </div>
                <div className="text-center">
                  <div className="w-48 border-t border-slate-700 pt-1">
                    <p className="font-bold text-[8.5px] text-slate-900">Signature of the Parent / Guardian</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: FOR OFFICE USE ONLY (SCRUTINY, CHECKLIST & FINAL APPROVAL) */}
          <div className="mt-2.5">
            <div className="border border-slate-500 rounded-xs p-2 bg-slate-100">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#1e3a8a]">
                  SECTION 8: FOR OFFICE & SCRUTINY USE ONLY (ADMISSION COMMITTEE)
                </span>
                <span className="text-[7.5px] font-bold text-slate-500 uppercase">Institutional Clearance</span>
              </div>

              {/* Document Checklist Badges */}
              <div className="grid grid-cols-6 gap-1 text-[7.5px] mb-2 text-center font-bold">
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Birth Cert
                </span>
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Student Aadhaar
                </span>
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Parent Aadhaar
                </span>
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> TC / Record Sheet
                </span>
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 3 Photos
                </span>
                <span className="border border-slate-300 bg-white py-1 px-1 rounded flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Fee Receipt
                </span>
              </div>

              {/* Scrutiny Data Row */}
              <div className="grid grid-cols-4 border border-slate-300 bg-white p-1 text-[8.5px] mb-4 divide-x divide-slate-300">
                <div className="pl-1">
                  <span className="text-slate-500 font-bold">Status: </span>
                  <span className="font-black text-emerald-700">PROVISIONALLY ADMITTED</span>
                </div>
                <div className="pl-1">
                  <span className="text-slate-500 font-bold">Section: </span>
                  <span className="font-black text-slate-900">A</span>
                </div>
                <div className="pl-1">
                  <span className="text-slate-500 font-bold">Roll No: </span>
                  <span className="font-mono font-black text-slate-900">{admission.rollNumber || '—'}</span>
                </div>
                <div className="pl-1">
                  <span className="text-slate-500 font-bold">Ledger Folio: </span>
                  <span className="font-mono font-black text-slate-900">{regNo.slice(-6)}</span>
                </div>
              </div>

              {/* 3 Institutional Signatures */}
              <div className="grid grid-cols-3 gap-6 items-end pt-1 px-2">
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-bold text-[8.5px] text-slate-800">Scrutiny / Admission Clerk</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-bold text-[8.5px] text-slate-800">Accounts & Fee Officer</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-700 pt-1">
                    <p className="font-black text-[8.5px] text-[#1e3a8a]">Principal & Correspondent (Seal)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 Footer Note */}
            <div className="flex items-center justify-between text-[7px] text-slate-400 mt-1.5 px-1 font-sans">
              <span>Sri Venkateswara JY Public School • Institutional Code of Conduct & Undertaking</span>
              <span className="font-bold">Page 2 of 2 (Rules & Office Clearance Record)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* Screen Modal Backdrop & Preview Controls */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md no-print">
        <div className="relative w-full max-w-[1200px] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '95vh' }}>
          
          {/* Modal Header Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#1e3a8a] via-slate-900 to-[#1e3a8a] text-white flex items-center justify-between shadow-lg border-b border-slate-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
                <Printer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-wide flex items-center gap-2">
                  Official Student Admission Dossier (2 Pages)
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Executive A4 Print
                  </span>
                </h2>
                <p className="text-white/70 text-xs">Standard Institutional 2-Page A4 Registration Dossier with Double Certificate Border</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xl flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" /> Print Both Pages (A4)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Preview - Side by Side Pages */}
          <div className="flex-1 overflow-auto p-6 bg-slate-950/60">
            {/* Pages Labels Row */}
            <div className="flex gap-6 justify-center mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-full shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                PAGE 1 OF 2: OFFICIAL STUDENT ADMISSION DOSSIER & TEAR-OFF ACKNOWLEDGEMENT SLIP
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-full shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                PAGE 2 OF 2: SIBLING RECORD, 11 MANDATORY RULES, PARENTAL UNDERTAKING & OFFICE SCRUTINY
              </div>
            </div>

            {/* Side-by-Side A4 Pages with Scale */}
            <div className="flex gap-8 justify-center items-start" style={{ minWidth: 'max-content', paddingBottom: '16px' }}>
              {/* Page 1 - Scaled to ~62% */}
              <div style={{
                display: 'inline-block',
                width: '210mm',
                height: '297mm',
                transform: 'scale(0.62)',
                transformOrigin: 'top left',
                flexShrink: 0,
                marginRight: 'calc(210mm * 0.62 - 210mm)',
                marginBottom: 'calc(297mm * 0.62 - 297mm)',
              }}>
                <div style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '2px solid #475569' }}>
                  {renderPage1()}
                </div>
              </div>

              {/* Page 2 - Scaled to ~62% */}
              <div style={{
                display: 'inline-block',
                width: '210mm',
                height: '297mm',
                transform: 'scale(0.62)',
                transformOrigin: 'top left',
                flexShrink: 0,
                marginRight: 'calc(210mm * 0.62 - 210mm)',
                marginBottom: 'calc(297mm * 0.62 - 297mm)',
              }}>
                <div style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden', border: '2px solid #475569' }}>
                  {renderPage2()}
                </div>
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
              margin: 0mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body > * {
              display: none !important;
            }
            body > #admission-print-root {
              display: block !important;
            }
            #admission-print-root {
              display: block !important;
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            .a4-page {
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              min-height: 297mm !important;
              box-sizing: border-box !important;
              padding: 5mm !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              background: white !important;
            }
            .a4-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />
        {renderPage1()}
        {renderPage2()}
      </div>
    </>,
    document.body
  );
};

export default AdmissionPrintModal;
