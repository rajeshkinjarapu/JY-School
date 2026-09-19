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
  const schoolSub = '(IIT-JEE/NEET Foundation - Olympiads)';
  const schoolAddress = schoolSettings?.address || 'Near Axis Bank, Old Bus Stand, Narasannapeta';
  const schoolLogo = schoolSettings?.logoUrl || '/logo.png';

  const currentYear = new Date().getFullYear();
  const academicYear = admission.academicYear || `${currentYear}-${currentYear + 1}`;
  const regNo = admission.regNo || `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;
  
  const regDate = admission.createdAt 
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Date of Birth Digits [D][D] [M][M] [Y][Y][Y][Y]
  let dobDigits = ['', '', '', '', '', '', '', ''];
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
    } catch (_) {}
  }

  // Gender flags
  const isBoy = admission.gender?.toString().toUpperCase() === 'MALE' || admission.gender?.toString().toUpperCase() === 'BOY';
  const isGirl = admission.gender?.toString().toUpperCase() === 'FEMALE' || admission.gender?.toString().toUpperCase() === 'GIRL';

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

  const feeAmount = admission.admissionFee ? `₹ ${admission.admissionFee}` : '____________________';

  const resolveImg = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const base = import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998';
    return `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for Underline fill fields
  const renderField = (label: string, value?: string | null, minWidth: string = '120px') => (
    <span className="inline-flex items-baseline gap-1 mr-3 mb-1">
      <span className="font-semibold text-slate-800 shrink-0">{label}</span>
      <span className="font-bold text-slate-950 border-b border-slate-700 px-1 text-center min-h-[16px]" style={{ minWidth }}>
        {value || ''}
      </span>
    </span>
  );

  // Render Page 1 - Admission Form + Acknowledgement
  const renderPage1 = () => (
    <div className="a4-page bg-white text-slate-950 font-serif text-[11px] leading-[1.35] relative flex flex-col justify-between p-[10mm] box-border border border-slate-300 shadow-sm mx-auto mb-6 print:mb-0 print:border-none print:shadow-none print:p-[8mm]">
      <div>
        {/* Header Block */}
        <div className="flex items-start justify-between gap-2 border-b-2 border-slate-900 pb-2 mb-2">
          {/* School Crest */}
          <div className="w-16 h-16 rounded-full border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center p-1 bg-white">
            <img 
              src={schoolLogo} 
              alt="School Crest" 
              className="w-full h-full object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = '<div class="text-center font-bold text-[9px] text-indigo-950">SVJY<br/>SCHOOL</div>';
                }
              }}
            />
          </div>

          {/* School Title */}
          <div className="text-center flex-1 pt-1">
            <h1 className="text-[17px] font-black tracking-wide text-slate-950 uppercase font-serif leading-none mb-1">
              {schoolName}
            </h1>
            <p className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">
              {schoolSub}
            </p>
            <p className="text-[9.5px] font-medium text-slate-700">
              {schoolAddress}
            </p>

            {/* ADMISSION FORM Badge */}
            <div className="mt-1.5 inline-block">
              <span className="bg-slate-900 text-white font-black text-[10px] uppercase px-4 py-0.5 rounded tracking-widest border border-slate-900">
                ADMISSION FORM
              </span>
            </div>
          </div>

          {/* Passport Photo Box */}
          <div className="w-[28mm] h-[34mm] border border-slate-800 rounded shrink-0 bg-slate-50 flex flex-col items-center justify-center text-center p-0.5 overflow-hidden">
            {admission.studentImage ? (
              <img 
                src={resolveImg(admission.studentImage)} 
                alt={admission.studentName} 
                className="w-full h-full object-cover rounded" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 p-1">
                <span className="text-[8px] font-semibold text-slate-600 leading-tight">
                  Affix latest<br />Passport Size<br />Photograph
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 13 Numbered Items List */}
        <div className="space-y-1 text-[10.5px]">
          {/* 1. Admn No, Class, Academic Year */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-bold">1. Admn No. : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[90px] inline-block text-center font-mono">
                {regNo}
              </span>
            </div>
            <div>
              <span className="font-bold">Class : </span>
              <span className="font-bold border-b border-slate-700 px-3 min-w-[90px] inline-block text-center uppercase">
                {admission.classApplied || ''}
              </span>
            </div>
            <div>
              <span className="font-bold">Academic Year : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[90px] inline-block text-center">
                {academicYear}
              </span>
            </div>
          </div>

          {/* 2. Date of Joining */}
          <div className="flex items-baseline">
            <span className="font-bold">2. Date of Joining : </span>
            <span className="font-bold border-b border-slate-700 px-2 min-w-[200px] inline-block">
              {regDate}
            </span>
          </div>

          {/* 3. Name of the Student */}
          <div>
            <div className="flex items-baseline">
              <span className="font-bold">3. Name of the Student : </span>
              <span className="font-black border-b border-slate-800 px-2 flex-1 uppercase tracking-wider text-[11px]">
                {admission.studentName || ''}
              </span>
            </div>
            <div className="text-[8.5px] text-slate-500 italic pl-5">(In capital Letters)</div>
          </div>

          {/* 4. Gender */}
          <div className="flex items-center gap-6">
            <span className="font-bold">4. Gender : </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">Boy</span>
              <span className="w-5 h-5 border border-slate-800 inline-flex items-center justify-center font-black text-xs">
                {isBoy ? '✓' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Girl</span>
              <span className="w-5 h-5 border border-slate-800 inline-flex items-center justify-center font-black text-xs">
                {isGirl ? '✓' : ''}
              </span>
            </div>
          </div>

          {/* 5. Date of Birth */}
          <div className="flex items-center gap-3">
            <span className="font-bold">5. Date of Birth : </span>
            <div className="flex items-center gap-1">
              <div className="flex border border-slate-800">
                <span className="w-5 h-5 border-r border-slate-800 inline-flex items-center justify-center font-bold text-xs">{dobDigits[0]}</span>
                <span className="w-5 h-5 inline-flex items-center justify-center font-bold text-xs">{dobDigits[1]}</span>
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="flex border border-slate-800">
                <span className="w-5 h-5 border-r border-slate-800 inline-flex items-center justify-center font-bold text-xs">{dobDigits[2]}</span>
                <span className="w-5 h-5 inline-flex items-center justify-center font-bold text-xs">{dobDigits[3]}</span>
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="flex border border-slate-800">
                <span className="w-5 h-5 border-r border-slate-800 inline-flex items-center justify-center font-bold text-xs">{dobDigits[4]}</span>
                <span className="w-5 h-5 border-r border-slate-800 inline-flex items-center justify-center font-bold text-xs">{dobDigits[5]}</span>
                <span className="w-5 h-5 border-r border-slate-800 inline-flex items-center justify-center font-bold text-xs">{dobDigits[6]}</span>
                <span className="w-5 h-5 inline-flex items-center justify-center font-bold text-xs">{dobDigits[7]}</span>
              </div>
              <span className="text-[9px] text-slate-500 ml-2">(DD / MM / YYYY)</span>
            </div>
          </div>

          {/* 6. Mother Tongue & Aadhaar */}
          <div className="flex items-baseline justify-between">
            <div className="flex-1 flex items-baseline mr-4">
              <span className="font-bold">6. Mother Tongue : </span>
              <span className="font-bold border-b border-slate-700 px-2 flex-1">
                {admission.motherTongue || 'Telugu'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold">Aadhar No : </span>
              <span className="font-bold font-mono border-b border-slate-700 px-2 min-w-[140px] text-center">
                {admission.aadharNo || ''}
              </span>
            </div>
          </div>

          {/* 7. Father's Name & Occupation / Aadhaar & Phone */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex-1 flex items-baseline mr-4">
                <span className="font-bold">7. Father’s Name : </span>
                <span className="font-bold border-b border-slate-700 px-2 flex-1 uppercase">
                  {admission.fatherName || ''}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold">Occupation : </span>
                <span className="font-bold border-b border-slate-700 px-2 min-w-[120px]">
                  {admission.fatherOccupation || ''}
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between pl-5 mt-1">
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800">Aadhar No : </span>
                <span className="font-bold font-mono border-b border-slate-700 px-2 min-w-[140px]">
                  {admission.fatherAadhar || ''}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800">Phone No : </span>
                <span className="font-bold font-mono border-b border-slate-700 px-2 min-w-[140px]">
                  {admission.fatherPhone || admission.phone || ''}
                </span>
              </div>
            </div>
          </div>

          {/* 8. Mother's Name & Occupation / Aadhaar & Phone */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex-1 flex items-baseline mr-4">
                <span className="font-bold">8. Mother’s Name : </span>
                <span className="font-bold border-b border-slate-700 px-2 flex-1 uppercase">
                  {admission.motherName || ''}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold">Occupation : </span>
                <span className="font-bold border-b border-slate-700 px-2 min-w-[120px]">
                  {admission.motherOccupation || ''}
                </span>
              </div>
            </div>
            <div className="flex items-baseline justify-between pl-5 mt-1">
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800">Aadhar No : </span>
                <span className="font-bold font-mono border-b border-slate-700 px-2 min-w-[140px]">
                  {admission.motherAadhar || ''}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="font-bold text-slate-800">Phone No : </span>
                <span className="font-bold font-mono border-b border-slate-700 px-2 min-w-[140px]">
                  {admission.motherPhone || admission.alternatePhone || ''}
                </span>
              </div>
            </div>
          </div>

          {/* 9. Nationality, State, Religion */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="font-bold">9. Nationality : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[80px] text-center">
                {admission.nationality || 'Indian'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold">State : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[100px] text-center">
                {admission.state || 'Andhra Pradesh'}
              </span>
            </div>
            <div className="flex items-baseline">
              <span className="font-bold">Religion : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[90px] text-center">
                {admission.religion || 'Hindu'}
              </span>
            </div>
          </div>

          {/* 10. Caste & Sub-Caste */}
          <div className="flex items-baseline">
            <div className="flex items-baseline mr-6">
              <span className="font-bold">10. Caste : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[120px]">
                {admission.caste || ''}
              </span>
            </div>
            <div className="flex items-baseline flex-1">
              <span className="font-bold">Sub-Caste : </span>
              <span className="font-bold border-b border-slate-700 px-2 flex-1">
                {admission.subCaste || ''}
              </span>
            </div>
          </div>

          {/* 11. Residence */}
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">11. Residence : </span>
            <span className="font-semibold border-b border-slate-700 px-2 flex-1 text-[10px]">
              {fullAddress}
            </span>
          </div>

          {/* 12. Name of the School Previous Studying/ Studied */}
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">12. Name of the School Previous Studying/ Studied : </span>
            <span className="font-semibold border-b border-slate-700 px-2 flex-1">
              {admission.previousSchool || 'N/A (Fresher)'}
            </span>
          </div>

          {/* 13. Annual fee fixed */}
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">13. Annual fee fixed for {academicYear} : </span>
            <span className="font-black border-b border-slate-800 px-3 text-slate-950 min-w-[140px]">
              {feeAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Perforated Divider & ACKNOWLEDGEMENT SLIP */}
      <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-500">
        <div className="text-center font-bold text-[8px] text-slate-400 tracking-widest -mt-3.5 mb-1 bg-white inline-block px-2">
          ✂ CUT HERE / TEAR ALONG PERFORATION ✂
        </div>

        {/* Acknowledgement Header */}
        <div className="text-center mb-2">
          <h2 className="text-[13px] font-black text-slate-950 uppercase tracking-wide">
            {schoolName}
          </h2>
          <div className="inline-block mt-0.5">
            <span className="bg-slate-800 text-white font-bold text-[9px] uppercase px-3 py-0.2 rounded border border-slate-800">
              Acknowledgement
            </span>
          </div>
        </div>

        {/* Acknowledgement Particulars */}
        <div className="space-y-1.5 text-[10px] px-2">
          <div className="flex items-baseline">
            <span className="font-bold shrink-0">Name of the Student : </span>
            <span className="font-bold border-b border-slate-700 px-2 flex-1 uppercase">
              {admission.studentName || ''}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline mr-4">
              <span className="font-bold shrink-0">Class : </span>
              <span className="font-bold border-b border-slate-700 px-2 min-w-[100px] uppercase">
                {admission.classApplied || ''}
              </span>
            </div>
            <div className="flex items-baseline flex-1">
              <span className="font-bold shrink-0">Father’s Name : </span>
              <span className="font-bold border-b border-slate-700 px-2 flex-1 uppercase">
                {admission.fatherName || ''}
              </span>
            </div>
          </div>

          <div className="flex items-baseline">
            <span className="font-bold shrink-0">Annual fee fixed for {academicYear} : </span>
            <span className="font-bold border-b border-slate-700 px-2 flex-1">
              {feeAmount}
            </span>
          </div>
        </div>

        {/* Acknowledgement Signatures */}
        <div className="flex justify-between items-end mt-7 pt-2 px-4">
          <div className="text-center">
            <div className="w-36 border-t border-slate-800 pt-1">
              <span className="font-bold text-[9.5px]">Signature of the Parent</span>
            </div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-slate-800 pt-1">
              <span className="font-bold text-[9.5px]">Signature of the Principal</span>
            </div>
          </div>
        </div>

        <div className="text-[7.5px] text-slate-400 text-right mt-1">
          Page 1 of 2 (Official Admission Form)
        </div>
      </div>
    </div>
  );

  // Render Page 2 - Siblings, Terms, Declaration, Schedule
  const renderPage2 = () => (
    <div className="a4-page bg-white text-slate-950 font-serif text-[11px] leading-[1.35] relative flex flex-col justify-between p-[10mm] box-border border border-slate-300 shadow-sm mx-auto mb-6 print:mb-0 print:border-none print:shadow-none print:p-[8mm]">
      <div>
        {/* SIBLING DETAILS TABLE */}
        <div className="mb-3">
          <div className="border border-slate-900">
            <div className="bg-slate-100 text-center font-black text-[10.5px] py-1 border-b border-slate-900 uppercase tracking-wider">
              SIBLING DETAILS
            </div>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-slate-900 font-bold bg-slate-50">
                  <th className="p-1 w-12 text-center border-r border-slate-900">S.NO</th>
                  <th className="p-1 border-r border-slate-900 text-left pl-2">NAME</th>
                  <th className="p-1 w-24 border-r border-slate-900 text-center">CLASS</th>
                  <th className="p-1 text-left pl-2">Where He/ She Studying</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map((idx) => {
                  const sib = siblingsList[idx];
                  return (
                    <tr key={idx} className="border-b border-slate-400 last:border-b-0 h-[22px]">
                      <td className="p-1 text-center font-bold border-r border-slate-900">{idx + 1}</td>
                      <td className="p-1 pl-2 border-r border-slate-900 font-bold uppercase">
                        {sib ? sib.name : (idx === 0 && siblingsList.length === 0 ? 'NA (No Siblings Recorded)' : '')}
                      </td>
                      <td className="p-1 text-center border-r border-slate-900 font-medium">
                        {sib ? sib.className : ''}
                      </td>
                      <td className="p-1 pl-2">
                        {sib ? sib.schoolName : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED */}
        <div className="mb-3">
          <h3 className="font-black text-[11px] text-center uppercase tracking-wide border-b border-slate-900 pb-1 mb-1.5">
            FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED
          </h3>
          <ol className="space-y-1 text-[9.5px] leading-tight text-justify pr-1 pl-1 list-decimal list-inside font-sans">
            <li>Student should obey the rules and regulations set by the management.</li>
            <li>Student would not be allowed to move around the premises of the school without uniform.</li>
            <li>During school time no visitor is allowed.</li>
            <li>During school time parents should not approach teachers without the permission of the management.</li>
            <li>The management has the right to reject or accept the application. The name of the student will be struck out if the students fail to follow the rules and regulations of the school.</li>
            <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
            <li>In case of the decision of the management would be final and the concerned parties would accept the management's decisions final.</li>
            <li>If the student will remain absent from school for 10 days without information his/her name will be struck out from the school. Parent has to take prior permission for the students absence.</li>
            <li>The students has pay all dues again to be readmitted.</li>
            <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.</li>
            <li className="font-bold text-slate-950">The fee once paid will not be refunded.</li>
          </ol>
        </div>

        {/* DECLARATION BY THE PARENT / GUARDIAN */}
        <div className="mb-3 border border-slate-800 rounded p-2.5 bg-slate-50/50">
          <h3 className="font-black text-[11px] text-center uppercase tracking-wide mb-1 font-serif">
            DECLARATION BY THE PARENT / GUARDIAN
          </h3>
          <p className="text-[9.5px] leading-relaxed text-justify text-slate-900 font-sans">
            I, <span className="font-bold border-b border-slate-800 px-2 inline-block min-w-[140px] text-center uppercase">{admission.fatherName || admission.motherName || '_________________________________'}</span> Parent / Guardian of <span className="font-bold border-b border-slate-800 px-2 inline-block min-w-[140px] text-center uppercase">{admission.studentName || '_________________________________'}</span> do hereby declare that if my child is admitted, I promise to send my child daily to school in time with necessary books and pay the fee regularly. I will follow the rules and regulations of the school and abide by the directions given by the school authority I also state that outside of the school hours it is my responsibility to take care of the child and declare that all the information given above is true to the best of my knowledge and I am aware that if it is found wrong at any state, the admission of my ward will be cancelled.
          </p>

          <div className="flex justify-between items-end mt-4 pt-1">
            <div className="space-y-1 text-[10px]">
              <div><span className="font-bold">Place : </span><span>Narasannapeta</span></div>
              <div><span className="font-bold">Date  : </span><span>{regDate}</span></div>
            </div>
            <div className="text-center">
              <div className="w-44 border-t border-slate-800 pt-1">
                <span className="font-bold text-[9.5px]">Signature of the Parent/Guardian</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEE PAYMENT SCHEDULE */}
        <div className="mb-2">
          <h4 className="font-black text-[10.5px] uppercase tracking-wide mb-1 border-b border-slate-400 pb-0.5">
            FEE PAYMENT SCHEDULE
          </h4>
          <div className="text-[10px] space-y-0.5 font-sans pl-2">
            <div>1st Term ➔ August 1st week</div>
            <div>2nd Term ➔ November 1st week</div>
            <div>3rd Term ➔ Before sankranti holidays</div>
          </div>
        </div>
      </div>

      {/* Page 2 Bottom Signatures */}
      <div className="border-t border-slate-800 pt-3">
        <div className="flex justify-between items-end px-2">
          <div className="text-[10px]">
            <span className="font-bold">Date : </span>
            <span className="font-bold border-b border-slate-700 px-2 min-w-[100px] inline-block">{regDate}</span>
          </div>
          <div className="text-center">
            <div className="w-44 border-t border-slate-800 pt-1">
              <span className="font-bold text-[9.5px]">Signature of the Principal</span>
            </div>
          </div>
        </div>
        <div className="text-[7.5px] text-slate-400 text-right mt-2">
          Page 2 of 2 (Rules & Parent Declaration)
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* Screen Modal Backdrop & Preview Controls */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm no-print">
        <div className="relative w-full max-w-5xl bg-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-wide">Official Student Admission Form (2 Pages)</h2>
                <p className="text-white/70 text-xs">Standard A4 2-Page Official School Registration Dossier</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Both Pages (A4)
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

          {/* Modal Scrollable Preview */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6">
            <div className="text-xs font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-full shadow-sm">
              PAGE 1 PREVIEW: ADMISSION FORM & ACKNOWLEDGEMENT SLIP
            </div>
            <div className="w-[210mm] shadow-xl">
              {renderPage1()}
            </div>

            <div className="text-xs font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-full shadow-sm mt-4">
              PAGE 2 PREVIEW: SIBLING DETAILS, 11 TERMS & PARENT DECLARATION
            </div>
            <div className="w-[210mm] shadow-xl">
              {renderPage2()}
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
              position: static !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .a4-page {
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              min-height: 297mm !important;
              box-sizing: border-box !important;
              padding: 8mm 10mm !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden !important;
            }
            .a4-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
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
