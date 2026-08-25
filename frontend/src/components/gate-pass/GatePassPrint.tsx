import React from 'react';
import { format } from 'date-fns';
import { getPhotoUrl } from '../../utils/photo';

interface GatePassPrintProps {
  gatePass: any;
  schoolName?: string;
}

export const GatePassPrint: React.FC<GatePassPrintProps> = ({ gatePass, schoolName = 'JY SCHOOL' }) => {
  if (!gatePass) return null;

  const isTeacher = gatePass.requestType === 'TEACHER';
  
  // Person details
  const personName = isTeacher ? gatePass.requester?.name : gatePass.student?.user?.name;
  const personRole = isTeacher ? 'Staff' : 'Student';
  const personId = isTeacher ? gatePass.requester?.id?.substring(0, 8) : (gatePass.student?.rollNo || gatePass.student?.id?.substring(0, 8));
  
  // Student specifics
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : 'N/A';
  const fatherName = gatePass.student?.fatherName || 'N/A';
  
  // Staff specifics
  const designation = gatePass.requester?.designation || 'Staff Member';
  
  // Shared specifics
  const mobile = isTeacher ? (gatePass.requester?.phone || 'N/A') : (gatePass.student?.mobileNumber || gatePass.student?.user?.phone || 'N/A');
  const photo = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;
  const slipNo = gatePass.slipNumber || '-';
  
  // Generate QR Code URL based on slip number
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(slipNo)}`;

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; padding: 0; }
          }
        `}
      </style>
      <div className="hidden print:flex flex-row w-[297mm] h-[210mm] mx-auto text-slate-900 bg-white overflow-hidden box-border">
        {/* 2 Copies (Security Copy & Person Copy) */}
        {[ 'STUDENT COPY', 'SECURITY COPY' ].map((copyType, idx) => (
          <div key={copyType} className={`w-[148.5mm] h-[210mm] flex flex-col justify-between p-10 ${idx === 1 ? 'border-l-[3px] border-dashed border-slate-300' : ''}`}>
            
            <div className="w-full h-full border-4 border-slate-900 p-8 rounded-2xl relative flex flex-col bg-white">
              
              {/* Header with Title and Logo */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-slate-900 text-white px-8 py-3 rounded-full mb-4">
                  <h1 className="text-xl font-black uppercase tracking-widest">{schoolName} - {copyType}</h1>
                </div>
              </div>

              {/* Top Row: Photo, Name/Slip, QR Code */}
              <div className="flex justify-between items-start mb-8 gap-6">
                {/* Photo */}
                <div className="w-[140px] h-[170px] border-2 border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden rounded-xl shrink-0">
                  {photo ? (
                    <img src={getPhotoUrl(photo)} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-slate-400">NO PHOTO</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center py-2">
                  <div className="text-2xl font-black text-slate-900 mb-1 leading-tight">{personName || 'N/A'}</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                    {isTeacher ? `Staff | Phone: ${mobile}` : `Student | Phone: ${mobile}`}
                  </div>
                  
                  <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg self-start">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider mr-2">Slip No:</span>
                    <span className="text-lg font-black text-slate-900">{slipNo}</span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="w-[120px] h-[120px] shrink-0 bg-white border-2 border-slate-200 rounded-xl p-2">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Details Grid */}
              <div className="flex-1 grid grid-cols-2 gap-y-6 gap-x-12 text-base">
                {!isTeacher && (
                  <>
                    <div>
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Class / Section</div>
                      <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{className}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Father Name</div>
                      <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg truncate">{fatherName}</div>
                    </div>
                  </>
                )}
                
                {isTeacher && (
                  <>
                    <div>
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Designation</div>
                      <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{designation}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">ID No</div>
                      <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{personId}</div>
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Destination</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{gatePass.destination || 'N/A'}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Reason</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{gatePass.reason || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Time Out</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">{gatePass.exitTime || '--:--'}</div>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Date</div>
                  <div className="font-bold border-b-2 border-slate-300 pb-2 text-lg">
                    {gatePass.createdAt ? format(new Date(gatePass.createdAt), 'dd MMM yyyy') : '--'}
                  </div>
                </div>
              </div>

              {/* Signatures at the bottom */}
              <div className="flex justify-between items-end mt-auto pt-16 px-4">
                <div className="text-center w-[200px]">
                  <div className="text-lg font-black text-slate-800 mb-1">{gatePass.approvedBy?.name || 'Pending'}</div>
                  <div className="w-full border-b-2 border-slate-900 mb-2"></div>
                  <div className="text-xs font-black text-slate-600 uppercase tracking-widest">Authorized Signature</div>
                </div>
                <div className="text-center w-[200px]">
                  <div className="w-full border-b-2 border-slate-900 mb-2 h-8"></div>
                  <div className="text-xs font-black text-slate-600 uppercase tracking-widest">Security Stamp</div>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-[10px] font-bold text-slate-400 italic">Please present this slip at the main gate.</p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </>
  );
};
