import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface IDCardData {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  bloodGroup: string;
  address: string;
  phone: string;
  photoUrl?: string;
  fatherName?: string;
}

export interface SchoolInfo {
  schoolName: string;
  address: string;
  phone: string;
  logoUrl?: string;
  signatureUrl?: string;
}

export interface TemplateProps {
  data: IDCardData;
  school: SchoolInfo;
  colorPrimary?: string;
  colorSecondary?: string;
}

// 1. Standard Vertical
export const StandardVertical: React.FC<TemplateProps> = ({ data, school, colorPrimary = '#1e3a8a', colorSecondary = '#fbbf24' }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col overflow-hidden relative" style={{ boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center justify-center py-2" style={{ backgroundColor: colorPrimary }}>
      {school.logoUrl ? (
         <img src={school.logoUrl} alt="logo" className="h-10 w-10 object-contain mb-1" />
      ) : (
         <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mb-1"><span className="text-xs font-bold" style={{color: colorPrimary}}>LOGO</span></div>
      )}
      <h2 className="text-white text-[11px] font-bold text-center leading-tight px-1">{school.schoolName}</h2>
    </div>
    
    <div className="flex-1 flex flex-col items-center p-2 pt-3">
      <div className="w-20 h-24 border-2 p-0.5 rounded-sm mb-2" style={{ borderColor: colorSecondary }}>
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px]">No Photo</div>
        )}
      </div>
      <h3 className="text-[13px] font-bold text-gray-800 text-center uppercase leading-tight mb-1">{data.name}</h3>
      <div className="w-full space-y-0.5 mt-1 px-1">
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">Class:</span> <span>{data.className} - {data.section}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">ID No:</span> <span>{data.rollNo}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">Blood:</span> <span className="text-red-600 font-bold">{data.bloodGroup || 'N/A'}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">DOB:</span> <span>{data.phone}</span></p>
      </div>
    </div>

    <div className="h-12 w-full flex items-end justify-between px-3 pb-2 pt-1" style={{ backgroundColor: colorSecondary }}>
      <div className="flex flex-col items-center">
         {school.signatureUrl ? (
           <img src={school.signatureUrl} alt="sign" className="h-6 object-contain" />
         ) : (
           <div className="h-6 flex items-end"><span className="text-[9px] italic text-gray-800 border-t border-gray-800 w-12 text-center">Principal</span></div>
         )}
      </div>
      <div className="bg-white p-0.5 rounded-sm">
        <QRCodeSVG value={data.rollNo} size={28} />
      </div>
    </div>
  </div>
);

// 2. Horizontal Corporate
export const HorizontalCorporate: React.FC<TemplateProps> = ({ data, school, colorPrimary = '#0f172a', colorSecondary = '#38bdf8' }) => (
  <div className="w-[3.375in] h-[2.125in] bg-white border border-gray-300 rounded-lg shadow-sm flex overflow-hidden relative" style={{ boxSizing: 'border-box' }}>
    <div className="w-2" style={{ backgroundColor: colorSecondary }}></div>
    <div className="flex-1 p-2 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold leading-tight" style={{ color: colorPrimary }}>{school.schoolName}</h2>
          <p className="text-[7px] text-gray-500 w-40 leading-tight">{school.address}</p>
        </div>
        {school.logoUrl ? (
           <img src={school.logoUrl} alt="logo" className="h-8 object-contain" />
        ) : (
           <div className="h-8 w-8 bg-gray-200 rounded-sm flex items-center justify-center"><span className="text-[8px] font-bold text-gray-500">LOGO</span></div>
        )}
      </div>
      
      <div className="flex mt-2">
        <div className="w-16 h-20 border border-gray-300 p-0.5 bg-gray-50 mr-3 shrink-0">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-[8px]">Photo</div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-0.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase">{data.name}</h3>
          <p className="text-[8px] text-gray-600 font-semibold" style={{ color: colorSecondary }}>STUDENT</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-[8px] text-gray-700 flex"><span className="font-semibold w-10">ID No:</span> <span>{data.rollNo}</span></p>
            <p className="text-[8px] text-gray-700 flex"><span className="font-semibold w-10">Class:</span> <span>{data.className} - {data.section}</span></p>
            <p className="text-[8px] text-gray-700 flex"><span className="font-semibold w-10">Blood:</span> <span>{data.bloodGroup || 'N/A'}</span></p>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute bottom-2 right-2 flex flex-col items-end">
       <QRCodeSVG value={`ID:${data.rollNo}`} size={30} className="mb-1 opacity-70" />
       {school.signatureUrl ? (
           <img src={school.signatureUrl} alt="sign" className="h-4 object-contain" />
       ) : (
           <div className="border-t border-gray-400 w-12 text-center text-[6px] pt-[1px] text-gray-500 italic mt-2">Auth Sign</div>
       )}
    </div>
  </div>
);

// 3. Gradient Premium
export const GradientPremium: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center pt-3 pb-1 z-10">
      <h2 className="text-white text-[11px] font-bold text-center tracking-wide">{school.schoolName}</h2>
    </div>
    
    <div className="flex-1 bg-white/95 mt-8 rounded-t-[30px] flex flex-col items-center px-3 pt-10 pb-2 relative shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
      <div className="absolute -top-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-md bg-white">
        {data.photoUrl ? (
          <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Photo</div>
        )}
      </div>
      
      <h3 className="text-[13px] font-extrabold text-gray-800 text-center uppercase leading-tight mb-0.5">{data.name}</h3>
      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full mb-2">STUDENT</span>
      
      <div className="w-full space-y-1 mb-auto">
        <div className="flex justify-between items-center bg-gray-50 p-1 rounded">
          <span className="text-[8px] font-bold text-gray-500 uppercase">ID No</span>
          <span className="text-[9px] font-bold text-gray-800">{data.rollNo}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 p-1 rounded">
          <span className="text-[8px] font-bold text-gray-500 uppercase">Class</span>
          <span className="text-[9px] font-bold text-gray-800">{data.className} {data.section}</span>
        </div>
        <div className="flex justify-between items-center bg-gray-50 p-1 rounded">
          <span className="text-[8px] font-bold text-gray-500 uppercase">Blood</span>
          <span className="text-[9px] font-bold text-red-600">{data.bloodGroup || 'N/A'}</span>
        </div>
      </div>

      <div className="flex justify-between w-full items-end mt-2">
         <div className="bg-white p-0.5 border border-gray-200 rounded">
           <QRCodeSVG value={data.rollNo} size={28} />
         </div>
         <div className="text-center">
            {school.signatureUrl ? (
              <img src={school.signatureUrl} alt="sign" className="h-5 object-contain" />
            ) : (
              <div className="border-t border-gray-400 w-14 text-center mt-4">
                <span className="text-[7px] text-gray-500">Principal</span>
              </div>
            )}
         </div>
      </div>
    </div>
  </div>
);

// 4. Backside Template (Universal)
export const BacksideTemplate: React.FC<TemplateProps> = ({ data, school, colorPrimary = '#1e3a8a' }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col overflow-hidden" style={{ boxSizing: 'border-box' }}>
    <div className="py-2 text-center" style={{ backgroundColor: colorPrimary }}>
      <h3 className="text-white text-[10px] font-bold uppercase tracking-wider">Terms & Conditions</h3>
    </div>
    <div className="flex-1 p-3 flex flex-col">
      <ul className="text-[8px] text-gray-700 list-disc pl-3 space-y-1 text-justify flex-1 pr-1">
        <li>This card is the property of {school.schoolName}.</li>
        <li>Must be worn at all times while in the school premises.</li>
        <li>If lost, report immediately to the school administration.</li>
        <li>This card is non-transferable.</li>
        <li>Valid for the current academic year only.</li>
      </ul>
      
      <div className="mt-2 border-t border-dashed border-gray-300 pt-2 text-[8px] text-gray-800 text-center">
        <p className="font-bold mb-1">If found, please return to:</p>
        <p className="font-semibold text-[9px]">{school.schoolName}</p>
        <p className="leading-tight text-gray-600 mt-0.5">{school.address}</p>
        <p className="mt-1">Ph: {school.phone}</p>
      </div>
      
      <div className="mt-2 flex justify-center">
         <QRCodeSVG value={JSON.stringify({id: data.rollNo, name: data.name})} size={35} />
      </div>
    </div>
  </div>
);

// Mapping to access templates easily
export const getTemplateComponent = (id: string) => {
  switch (id) {
    case 'template_1': return StandardVertical;
    case 'template_2': return HorizontalCorporate;
    case 'template_3': return GradientPremium;
    default: return StandardVertical;
  }
}

export const getBacksideComponent = () => {
  return BacksideTemplate;
}

export const TEMPLATES_LIST = [
  { id: 'template_1', name: 'Standard Vertical', isHorizontal: false },
  { id: 'template_2', name: 'Horizontal Corporate', isHorizontal: true },
  { id: 'template_3', name: 'Gradient Premium', isHorizontal: false },
];
