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
  const schoolSub = '(IIT-JEE / NEET Foundation – Olympiads)';
  const schoolAddress = schoolSettings?.address || 'Near Axis Bank, Old Bus Stand, Narasannapeta';
  const schoolLogo = schoolSettings?.logoUrl || '/logo.png';

  const currentYear = new Date().getFullYear();
  const academicYear = admission.academicYear || `${currentYear}-${currentYear + 1}`;
  const regNo = admission.regNo || `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;

  const regDate = admission.createdAt
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // DOB formatted for boxes
  let dobBoxes = ['', '', '', '', '', '', '', ''];
  if (admission.dob) {
    try {
      const d = new Date(admission.dob);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dobBoxes = [dd[0], dd[1], mm[0], mm[1], yyyy[0], yyyy[1], yyyy[2], yyyy[3]];
    } catch (_) {}
  }

  const genderUpper = (admission.gender || '').toUpperCase();
  const isBoy = genderUpper === 'MALE' || genderUpper === 'BOY';
  const isGirl = genderUpper === 'FEMALE' || genderUpper === 'GIRL';

  let siblingsList: any[] = [];
  if (admission.siblingsData && admission.siblingsData !== 'NA') {
    try {
      siblingsList = typeof admission.siblingsData === 'string'
        ? JSON.parse(admission.siblingsData)
        : admission.siblingsData;
    } catch (e) {}
  }
  
  // Fill empty rows to make it 4 rows total
  const displaySiblings = [...siblingsList];
  while (displaySiblings.length < 4) {
    displaySiblings.push(null);
  }

  const feeAmount = admission.admissionFee
    ? `₹ ${Number(admission.admissionFee).toLocaleString('en-IN')}`
    : '';

  const resolveImg = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const base = import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998';
    return `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  };

  const handlePrint = () => window.print();

  // Helper component for dotted/solid underlines
  const Line = ({ width = '100px', children, className = '' }: { width?: string, children?: React.ReactNode, className?: string }) => (
    <span 
      className={`inline-block border-b border-black text-center font-bold px-2 ${className}`} 
      style={{ minWidth: width }}
    >
      {children}
    </span>
  );

  const DottedLine = ({ width = '100%', children }: { width?: string, children?: React.ReactNode }) => (
    <span 
      className="inline-block border-b-2 border-dotted border-black text-center font-bold px-2" 
      style={{ minWidth: width }}
    >
      {children}
    </span>
  );

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          
          /* Force background colors and borders to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* MODAL OVERLAY */}
      <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col no-print">
        
        {/* MODAL HEADER */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Print Admission Form</h2>
              <p className="text-slate-400 text-xs">A4 Size (2 Pages)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center pb-24 custom-scrollbar">
          
          {/* PRINT AREA (This is what actually prints, and we also scale it for preview) */}
          <div id="print-area" className="flex flex-col gap-[20px] print:gap-0 origin-top bg-transparent print:bg-white" style={{
             // In preview, scale down slightly on smaller screens, but keep exact dimensions for print
             width: '210mm',
          }}>
            
            {/* ================= PAGE 1 ================= */}
            <div className="w-[210mm] h-[297mm] bg-white text-black p-[10mm] relative mx-auto shadow-2xl print:shadow-none print:p-0 page-break shrink-0 font-serif box-border overflow-hidden flex flex-col">
              
              {/* Outer Double Border */}
              <div className="absolute inset-[6mm] border-[3px] border-black pointer-events-none z-10 print:inset-[5mm]"></div>
              <div className="absolute inset-[7mm] border border-black pointer-events-none z-10 print:inset-[6mm]"></div>

              {/* Main Content Wrapper (padding accounts for borders) */}
              <div className="relative z-20 flex-1 flex flex-col px-[8mm] py-[6mm]">
                
                {/* Header Section */}
                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="w-[18%] flex justify-center">
                    <img src={schoolLogo} alt="Logo" className="w-[70px] h-[70px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div className="w-[82%] text-center pr-[10%]">
                    <h1 className="text-[26px] font-black tracking-wide uppercase leading-tight">
                      {schoolName}
                    </h1>
                    <p className="text-[13px] font-semibold mt-1">
                      {schoolSub}
                    </p>
                    <p className="text-[12px] mt-1">
                      {schoolAddress}
                    </p>
                  </div>
                </div>

                {/* Admission Form Badge */}
                <div className="text-center my-4 relative">
                  <div className="inline-block bg-[#444] border-2 border-black rounded-md px-6 py-1.5 shadow-sm">
                     <span className="text-white text-[15px] font-bold uppercase tracking-[2px]">Admission Form</span>
                  </div>
                  
                  {/* Photo Box */}
                  <div className="absolute -top-12 right-0 w-[30mm] h-[38mm] border border-black flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
                    {admission.studentImage ? (
                      <img src={resolveImg(admission.studentImage)} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] text-center text-gray-500 leading-tight px-2">
                        Affix latest<br />Passport Size<br />Photograph
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Fields Section */}
                <div className="text-[14px] leading-[2.6] mt-4 flex-1">
                  
                  <div className="flex items-end">
                    <span className="w-6">1.</span>
                    <span className="mr-2">Admn No. :</span>
                    <Line width="120px">{regNo}</Line>
                    <span className="ml-4 mr-2">Class</span>
                    <Line width="80px">{admission.classApplied || ''}</Line>
                    <span className="ml-4 mr-2">Academic Year</span>
                    <Line width="100px">{academicYear}</Line>
                  </div>

                  <div className="flex items-end">
                    <span className="w-6">2.</span>
                    <span className="mr-2">Date of Joining</span>
                    <span className="mr-2">:</span>
                    <Line width="200px">{regDate}</Line>
                  </div>

                  <div className="flex items-end">
                    <span className="w-6">3.</span>
                    <span className="mr-2">Name of the Student :</span>
                    <Line width="400px" className="uppercase tracking-wide">{admission.studentName || ''}</Line>
                  </div>
                  <div className="pl-6 text-[12px] text-gray-600 leading-tight -mt-1 mb-2">(In capital Letters)</div>

                  <div className="flex items-center mt-1">
                    <span className="w-6">4.</span>
                    <span className="mr-2">Gender</span>
                    <span className="mr-4">:</span>
                    <span className="mr-4">Boy</span>
                    <div className="w-8 h-5 border border-black flex items-center justify-center font-bold text-sm">
                      {isBoy ? '✓' : ''}
                    </div>
                    <span className="ml-12 mr-4">Girl</span>
                    <div className="w-8 h-5 border border-black flex items-center justify-center font-bold text-sm">
                      {isGirl ? '✓' : ''}
                    </div>
                  </div>

                  <div className="flex items-center mt-3">
                    <span className="w-6">5.</span>
                    <span className="mr-2">Date of Birth</span>
                    <span className="mr-4">:</span>
                    <div className="flex border border-black">
                      {dobBoxes.map((digit, i) => (
                        <div key={i} className={`w-6 h-6 flex items-center justify-center font-bold text-[13px] ${i < 7 ? 'border-r border-black' : ''}`}>
                          {digit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">6.</span>
                    <span className="mr-2">Mother Tongue</span>
                    <span className="mr-2">:</span>
                    <Line width="180px">{admission.motherTongue || 'Telugu'}</Line>
                    <span className="ml-6 mr-2">Aadhar No :</span>
                    <Line width="200px">{admission.aadharNo || ''}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">7.</span>
                    <span className="mr-2">Father's Name</span>
                    <span className="mr-2">:</span>
                    <Line width="220px" className="uppercase">{admission.fatherName || ''}</Line>
                    <span className="ml-6 mr-2">Occupation :</span>
                    <Line width="150px">{admission.fatherOccupation || ''}</Line>
                  </div>
                  <div className="flex items-end pl-6">
                    <span className="mr-2">Aadhar No</span>
                    <span className="mr-2">:</span>
                    <Line width="240px">{admission.fatherAadhar || ''}</Line>
                    <span className="ml-6 mr-2">Phone No :</span>
                    <Line width="168px">{admission.fatherPhone || admission.phone || ''}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">8.</span>
                    <span className="mr-2">Mother's Name</span>
                    <span className="mr-2">:</span>
                    <Line width="215px" className="uppercase">{admission.motherName || ''}</Line>
                    <span className="ml-6 mr-2">Occupation :</span>
                    <Line width="150px">{admission.motherOccupation || 'Home Maker'}</Line>
                  </div>
                  <div className="flex items-end pl-6">
                    <span className="mr-2">Aadhar No</span>
                    <span className="mr-2">:</span>
                    <Line width="240px">{admission.motherAadhar || ''}</Line>
                    <span className="ml-6 mr-2">Phone No :</span>
                    <Line width="168px">{admission.motherPhone || admission.alternatePhone || ''}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">9.</span>
                    <span className="mr-2">Nationality</span>
                    <span className="mr-2">:</span>
                    <Line width="120px">{admission.nationality || 'Indian'}</Line>
                    <span className="ml-4 mr-2">State:</span>
                    <Line width="140px">{admission.state || 'Andhra Pradesh'}</Line>
                    <span className="ml-4 mr-2">Religion :</span>
                    <Line width="120px">{admission.religion || 'Hindu'}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">10.</span>
                    <span className="mr-2">Caste</span>
                    <span className="mr-2">:</span>
                    <Line width="200px">{admission.caste || ''}</Line>
                    <span className="ml-10 mr-2">Sub-Caste:</span>
                    <Line width="200px">{admission.subCaste || ''}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">11.</span>
                    <span className="mr-2">Residence</span>
                    <span className="mr-2">:</span>
                    <Line width="500px" className="truncate">
                      {[admission.doorNo ? `D.No: ${admission.doorNo}` : null, admission.village, admission.mandal ? `Mandal: ${admission.mandal}` : null, admission.district ? `${admission.district} Dist` : null].filter(Boolean).join(', ') || admission.address || ''}
                    </Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">12.</span>
                    <span className="mr-2">Name of the School Previous Studying/ Studied :</span>
                    <Line width="250px">{admission.previousSchool || ''}</Line>
                  </div>

                  <div className="flex items-end mt-3">
                    <span className="w-6">13.</span>
                    <span className="mr-2">Annual fee fixed for {academicYear}</span>
                    <Line width="380px" className="font-bold">{feeAmount}</Line>
                  </div>

                </div>

                {/* Acknowledgement Section (Bottom of Page 1) */}
                <div className="mt-8 pt-6">
                   <h2 className="text-[20px] font-black text-center uppercase tracking-wide">
                     {schoolName}
                   </h2>
                   <div className="text-center mt-1 mb-6">
                     <div className="inline-block bg-[#444] text-white border-2 border-black rounded-md px-6 py-0.5 text-[14px] font-bold shadow-sm">
                        Acknowledgement
                     </div>
                   </div>

                   <div className="text-[14px] leading-[2.5] space-y-2">
                     <div className="flex items-end w-full">
                       <span className="whitespace-nowrap mr-2">Name of the Student</span>
                       <DottedLine>{admission.studentName || ''}</DottedLine>
                     </div>
                     <div className="flex items-end w-full">
                       <span className="whitespace-nowrap mr-2">Class</span>
                       <DottedLine width="150px">{admission.classApplied || ''}</DottedLine>
                       <span className="whitespace-nowrap ml-4 mr-2">Father's Name</span>
                       <DottedLine>{admission.fatherName || ''}</DottedLine>
                     </div>
                     <div className="flex items-end w-full">
                       <span className="whitespace-nowrap mr-2">Annual fee fixed for {academicYear}</span>
                       <DottedLine>{feeAmount}</DottedLine>
                     </div>
                   </div>

                   <div className="flex justify-between mt-12 text-[14px]">
                      <div>Signature of the Parent</div>
                      <div>Signature of the Principal</div>
                   </div>
                </div>

              </div>
            </div>

            {/* ================= PAGE 2 ================= */}
            <div className="w-[210mm] h-[297mm] bg-white text-black p-[10mm] relative mx-auto shadow-2xl print:shadow-none print:p-0 page-break shrink-0 font-serif box-border overflow-hidden flex flex-col">
              
              {/* Outer Double Border */}
              <div className="absolute inset-[6mm] border-[3px] border-black pointer-events-none z-10 print:inset-[5mm]"></div>
              <div className="absolute inset-[7mm] border border-black pointer-events-none z-10 print:inset-[6mm]"></div>

              {/* Main Content Wrapper */}
              <div className="relative z-20 flex-1 flex flex-col px-[8mm] py-[8mm]">
                
                {/* Sibling Details */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-black text-[13px]">
                    <thead>
                      <tr>
                        <th colSpan={4} className="border border-black p-1 text-center font-bold tracking-wide">
                          SIBILING DETAILS
                        </th>
                      </tr>
                      <tr>
                        <th className="border border-black p-1.5 w-12 text-center">S.NO</th>
                        <th className="border border-black p-1.5 w-[35%] text-center">NAME</th>
                        <th className="border border-black p-1.5 w-24 text-center">CLASS</th>
                        <th className="border border-black p-1.5 text-center">Where He/ She Studying</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySiblings.map((sib, i) => (
                        <tr key={i} className="h-10">
                          <td className="border border-black text-center font-bold">{i + 1}</td>
                          <td className="border border-black px-2 uppercase">{sib?.name || (i === 0 && siblingsList.length === 0 ? 'NA (ONLY CHILD)' : '')}</td>
                          <td className="border border-black px-2 text-center">{sib?.className || ''}</td>
                          <td className="border border-black px-2">{sib?.schoolName || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                  <h3 className="text-[14px] font-bold text-center underline tracking-wide mb-3">
                    FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED
                  </h3>
                  <ol className="list-decimal pl-8 text-[13px] space-y-1.5 leading-relaxed text-justify">
                    <li>Student should obey the rules and regulations set by the management.</li>
                    <li>Student would not be allowed to move around the premises of the school without uniform.</li>
                    <li>During school time no visitor is allowed.</li>
                    <li>During school time parents should not approach teachers without the permission of the management.</li>
                    <li>
                      The management has the right to reject or accept the application. <br/>
                      The name of the student will be struck out if the students fail to follow the rules and regulations of the school.
                    </li>
                    <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
                    <li>In case of the decision of the management would be final and the concerned parties would accept the management's decisions final.</li>
                    <li>If the student will remain absent from school for 10 days without information his/her name will be struck out from the school. Parent has to take prior permission for the students absence.</li>
                    <li>The students has pay all dues again to be readmitted.</li>
                    <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed</li>
                    <li>The fee once paid will not be refunded.</li>
                  </ol>
                </div>

                {/* Declaration */}
                <div className="mb-6">
                   <h3 className="text-[14px] font-bold text-center underline mb-3">
                     DECLARATION BY THE PARENT / GUARDIAN
                   </h3>
                   <div className="text-[14px] leading-loose text-justify px-2">
                     <span className="ml-8">I,</span> 
                     <Line width="200px" className="uppercase">{admission.fatherName || admission.motherName || ''}</Line> 
                     Parent / Guardian of 
                     <Line width="200px" className="uppercase">{admission.studentName || ''}</Line> 
                     do hereby declare that if my child is admitted, I promise to send my child daily to school in time with necessary books and pay the fee regularly. I will follow the rules and regulations of the school and abide by the directions given by the school authority I also state that outside of the school hours it is my responsibility to take care of the child and declare that all the information given above is true to the best of my knowledge and I am aware that if it is found wrong at any state, the admission of my ward will be cancelled.
                   </div>
                   
                   <div className="flex justify-between items-end mt-8 px-2">
                     <div>
                       <div className="mb-2">Place &nbsp;&nbsp;&nbsp;: <span className="font-semibold ml-2">Narasannapeta</span></div>
                       <div>Date &nbsp;&nbsp;&nbsp;&nbsp;: <span className="font-semibold ml-2">{regDate}</span></div>
                     </div>
                     <div className="text-[14px]">
                       Signature of the Parent/Guardian
                     </div>
                   </div>
                </div>

                {/* Fee Schedule */}
                <div className="mt-auto flex flex-col justify-between pt-6">
                  <div className="mb-8">
                    <h4 className="font-bold text-[14px] underline mb-2">FEE PAYMENT SCHEDULE</h4>
                    <ul className="text-[13px] space-y-1">
                      <li>1st Term → August 1st week</li>
                      <li>2nd Term → November 1st week</li>
                      <li>3rd Term → Before sankranti holidays</li>
                    </ul>
                  </div>

                  <div className="flex justify-between items-end text-[15px]">
                    <div>
                       Date : <Line width="150px">{regDate}</Line>
                    </div>
                    <div>
                       Signature of the Principal
                    </div>
                  </div>
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

export default AdmissionPrintModal;
