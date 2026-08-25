import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Standard ID Card Dimensions (CR80) - approx 2.125" x 3.375" (54mm x 86mm)
// Using pixels for standard web rendering: 204px x 324px at 96 DPI
const cardStyle: React.CSSProperties = {
  width: '2.125in',
  height: '3.375in',
  backgroundColor: '#fff',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  border: '1px solid #e2e8f0',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif'
};

const horizontalCardStyle: React.CSSProperties = {
  ...cardStyle,
  width: '3.375in',
  height: '2.125in',
};

const defaultLogo = 'https://ui-avatars.com/api/?name=School+Logo&background=0D8ABC&color=fff&rounded=true';
const defaultAvatar = 'https://ui-avatars.com/api/?name=Student&background=f1f5f9&color=64748b';

export interface IDCardProps {
  student: any;
  schoolName: string;
  schoolLogo?: string;
  showQR?: boolean;
}

// 1. Standard Vertical
export const StandardVertical: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo, showQR }) => (
  <div style={cardStyle} className="print-card">
    <div className="h-16 bg-blue-600 flex items-center justify-center px-2">
      <img src={schoolLogo} alt="Logo" className="w-8 h-8 rounded-full mr-2 bg-white p-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center leading-tight">{schoolName}</h2>
    </div>
    <div className="flex flex-col items-center mt-4">
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-20 h-20 rounded border-2 border-blue-600 object-cover" />
      <h3 className="text-[14px] font-bold mt-2 uppercase text-gray-800">{student.user?.name}</h3>
      <p className="text-[10px] text-blue-600 font-semibold mb-2">{student.rollNo}</p>
      
      <div className="w-full px-4 text-[9px] text-gray-700 space-y-1">
        <div className="flex justify-between"><span className="font-bold">Class:</span> <span>{student.class?.name || 'N/A'} - {student.class?.section || 'N/A'}</span></div>
        <div className="flex justify-between"><span className="font-bold">DOB:</span> <span>{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</span></div>
        <div className="flex justify-between"><span className="font-bold">Blood:</span> <span>{student.bloodGroup || 'N/A'}</span></div>
        <div className="flex justify-between"><span className="font-bold">Phone:</span> <span>{student.user?.phone || 'N/A'}</span></div>
      </div>
    </div>
    <div className="absolute bottom-0 w-full h-8 bg-blue-600 flex justify-between items-center px-4">
      {showQR && <QRCodeSVG value={student.rollNo} size={20} bgColor="#ffffff" fgColor="#000000" level="L" />}
      <div className="text-[8px] text-white ml-auto">Principal Sign</div>
    </div>
  </div>
);

// 2. Horizontal Corporate
export const HorizontalCorporate: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo, showQR }) => (
  <div style={horizontalCardStyle} className="print-card flex flex-col">
    <div className="flex-1 flex">
      <div className="w-[30%] bg-indigo-900 flex flex-col items-center py-3 relative">
        <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-16 h-16 rounded-full border-2 border-white object-cover" />
        {showQR && <div className="mt-auto mb-2"><QRCodeSVG value={student.rollNo} size={35} bgColor="#ffffff" fgColor="#000000" level="L" className="p-0.5 bg-white rounded-sm" /></div>}
      </div>
      <div className="w-[70%] p-3 bg-white relative">
        <div className="flex items-center mb-2">
          <img src={schoolLogo} alt="Logo" className="w-6 h-6 mr-2 rounded-full" />
          <h2 className="text-[10px] font-bold text-indigo-900 uppercase">{schoolName}</h2>
        </div>
        <div className="w-full h-0.5 bg-indigo-100 mb-2"></div>
        <h3 className="text-[14px] font-bold text-gray-800 uppercase">{student.user?.name}</h3>
        <p className="text-[10px] text-indigo-600 font-semibold mb-2">{student.rollNo}</p>
        <div className="text-[9px] text-gray-700 grid grid-cols-2 gap-1">
          <div><span className="font-bold text-gray-900">Class:</span> {student.class?.name || 'N/A'}</div>
          <div><span className="font-bold text-gray-900">Section:</span> {student.class?.section || 'N/A'}</div>
          <div><span className="font-bold text-gray-900">DOB:</span> {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
          <div><span className="font-bold text-gray-900">Blood:</span> <span className="text-red-600 font-bold">{student.bloodGroup || 'N/A'}</span></div>
        </div>
        <div className="absolute bottom-2 right-3 text-[8px] border-t border-gray-300 pt-0.5">Authorized Signatory</div>
      </div>
    </div>
    <div className="h-4 bg-indigo-900 w-full"></div>
  </div>
);

// 3. Gradient Premium
export const GradientPremium: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card">
    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 opacity-90 z-0"></div>
    <div className="relative z-10 p-3 h-full flex flex-col items-center text-white">
      <img src={schoolLogo} alt="Logo" className="w-10 h-10 rounded-full bg-white p-0.5 mb-1 shadow-lg" />
      <h2 className="text-[11px] font-bold text-center leading-tight mb-3">{schoolName}</h2>
      
      <div className="bg-white p-1 rounded-xl shadow-xl mb-2">
        <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-20 h-20 rounded-lg object-cover" />
      </div>
      
      <h3 className="text-[14px] font-bold uppercase text-center">{student.user?.name}</h3>
      <div className="bg-white/20 px-3 py-0.5 rounded-full mt-1 mb-2">
        <p className="text-[9px] font-semibold">{student.rollNo}</p>
      </div>
      
      <div className="w-full bg-white/10 rounded-lg p-2 text-[9px] space-y-1 backdrop-blur-sm mt-auto">
        <div className="flex justify-between"><span>Class:</span> <span className="font-bold">{student.class?.name || 'N/A'} {student.class?.section}</span></div>
        <div className="flex justify-between"><span>DOB:</span> <span className="font-bold">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</span></div>
        <div className="flex justify-between"><span>Blood Group:</span> <span className="font-bold text-red-300">{student.bloodGroup || 'N/A'}</span></div>
      </div>
    </div>
  </div>
);

// 4. Minimalist Clean
export const MinimalistClean: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card bg-white p-3 border-2 border-gray-100 flex flex-col items-center">
    <img src={schoolLogo} alt="Logo" className="w-8 h-8 rounded-full mb-2 opacity-80" />
    <h2 className="text-[10px] font-medium text-center text-gray-500 uppercase tracking-widest mb-4">{schoolName}</h2>
    
    <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-24 h-24 rounded-full border border-gray-200 object-cover mb-3" />
    
    <h3 className="text-[15px] font-light uppercase text-gray-900 tracking-wider mb-1">{student.user?.name}</h3>
    <div className="h-[1px] w-12 bg-gray-300 mb-2"></div>
    <p className="text-[11px] text-gray-500 tracking-widest mb-4">{student.rollNo}</p>
    
    <div className="w-full text-center text-[9px] text-gray-400 font-light mt-auto">
      <p>CLASS {student.class?.name || 'N/A'} • SEC {student.class?.section || 'N/A'}</p>
      <p>DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</p>
    </div>
  </div>
);

// 5. QR Code Smart Card
export const QrCodeSmart: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card bg-[#f8fafc] relative">
    <div className="h-20 bg-teal-600 rounded-b-[40px] absolute top-0 w-full z-0"></div>
    <div className="relative z-10 flex flex-col items-center pt-4 px-3 h-full">
      <h2 className="text-[11px] font-bold text-white text-center mb-2">{schoolName}</h2>
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-sm mb-2" />
      
      <h3 className="text-[14px] font-bold text-teal-900">{student.user?.name}</h3>
      <p className="text-[10px] text-teal-600 font-medium mb-3">{student.rollNo}</p>
      
      <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 mb-3">
        <QRCodeSVG value={JSON.stringify({ id: student.rollNo, name: student.user?.name })} size={50} />
      </div>
      
      <div className="w-full text-[8.5px] text-gray-600 mt-auto bg-white p-2 rounded-t-lg border border-b-0 border-gray-200">
        <div className="flex justify-between"><span>Class:</span> <span className="font-bold text-gray-800">{student.class?.name || 'N/A'}</span></div>
        <div className="flex justify-between"><span>Phone:</span> <span className="font-bold text-gray-800">{student.user?.phone || 'N/A'}</span></div>
      </div>
    </div>
  </div>
);

// 6. Dual Tone Pattern
export const DualTonePattern: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card relative">
    <div className="absolute inset-0 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 60%)' }}></div>
    <div className="absolute inset-0 bg-gray-900" style={{ clipPath: 'polygon(0 60%, 100% 40%, 100% 100%, 0 100%)' }}></div>
    
    <div className="relative z-10 flex flex-col items-center h-full p-3">
      <div className="flex items-center w-full mb-3">
        <img src={schoolLogo} alt="Logo" className="w-6 h-6 rounded bg-white p-0.5" />
        <h2 className="text-[10px] font-bold text-white ml-2 leading-tight">{schoolName}</h2>
      </div>
      
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-24 h-24 rounded border-4 border-white object-cover shadow-lg mb-4" />
      
      <h3 className="text-[14px] font-bold text-white uppercase text-center">{student.user?.name}</h3>
      <p className="text-[11px] text-red-500 font-bold mb-3">{student.rollNo}</p>
      
      <div className="w-full bg-gray-800 p-2 rounded text-[9px] text-gray-300 border border-gray-700 mt-auto">
        <div className="flex justify-between"><span>Class/Sec:</span> <span className="text-white">{student.class?.name} - {student.class?.section}</span></div>
        <div className="flex justify-between"><span>Blood:</span> <span className="text-red-500 font-bold">{student.bloodGroup || 'N/A'}</span></div>
      </div>
    </div>
  </div>
);

// 7. Wave Design
export const WaveDesign: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card relative bg-blue-50">
    <svg className="absolute top-0 w-full h-24 text-blue-500" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
    </svg>
    <div className="relative z-10 flex flex-col items-center pt-2 px-3 h-full">
      <h2 className="text-[10px] font-bold text-white text-center w-full mb-3">{schoolName}</h2>
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-20 h-20 rounded-full border-2 border-white object-cover shadow-md mb-2" />
      
      <h3 className="text-[14px] font-bold text-blue-900">{student.user?.name}</h3>
      <p className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full mb-2">{student.rollNo}</p>
      
      <div className="w-full text-[9px] text-gray-700 mt-2 space-y-1">
        <div className="flex border-b border-blue-200 pb-1">
          <span className="w-1/3 font-bold">Class:</span> <span>{student.class?.name} {student.class?.section}</span>
        </div>
        <div className="flex border-b border-blue-200 pb-1">
          <span className="w-1/3 font-bold">DOB:</span> <span>{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="flex border-b border-blue-200 pb-1">
          <span className="w-1/3 font-bold">Phone:</span> <span>{student.user?.phone || 'N/A'}</span>
        </div>
      </div>
      <div className="mt-auto w-full text-[8px] text-center text-gray-500 pb-1">Valid for 2024-2025</div>
    </div>
  </div>
);

// 8. Dark Mode Elite
export const DarkModeElite: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card bg-[#111827] flex flex-col items-center p-3 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
    
    <div className="flex items-center justify-center w-full mb-4 z-10">
      <img src={schoolLogo} alt="Logo" className="w-8 h-8 rounded-full border border-amber-500/50 mr-2" />
      <h2 className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">{schoolName}</h2>
    </div>
    
    <div className="p-0.5 bg-gradient-to-br from-amber-300 to-amber-700 rounded-lg mb-3 z-10">
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-20 h-20 rounded-lg object-cover" />
    </div>
    
    <h3 className="text-[14px] font-bold text-white uppercase text-center z-10">{student.user?.name}</h3>
    <p className="text-[10px] text-amber-500 tracking-widest mb-4 z-10">{student.rollNo}</p>
    
    <div className="w-full grid grid-cols-2 gap-2 text-[8px] text-gray-400 z-10 mt-auto bg-white/5 p-2 rounded border border-white/10">
      <div><span className="block text-gray-500">CLASS</span><span className="text-white font-medium">{student.class?.name}</span></div>
      <div><span className="block text-gray-500">SECTION</span><span className="text-white font-medium">{student.class?.section}</span></div>
      <div><span className="block text-gray-500">DOB</span><span className="text-white font-medium">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</span></div>
      <div><span className="block text-gray-500">BLOOD</span><span className="text-red-400 font-medium">{student.bloodGroup || 'N/A'}</span></div>
    </div>
  </div>
);

// 9. Lanyard Overlay
export const LanyardOverlay: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo }) => (
  <div style={cardStyle} className="print-card bg-white relative">
    <div className="h-6 w-full flex justify-center pt-1 border-b-2 border-dashed border-gray-300">
      <div className="w-12 h-2 rounded-full bg-gray-200 border border-gray-300"></div>
    </div>
    <div className="flex flex-col items-center p-3 h-full border-x-4 border-green-600">
      <img src={schoolLogo} alt="Logo" className="w-8 h-8 mb-1" />
      <h2 className="text-[10px] font-bold text-green-800 text-center mb-2">{schoolName}</h2>
      
      <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="w-24 h-24 rounded border-2 border-green-600 object-cover mb-2" />
      
      <h3 className="text-[15px] font-bold uppercase text-gray-900">{student.user?.name}</h3>
      <p className="text-[11px] text-green-700 font-bold mb-2">{student.rollNo}</p>
      
      <div className="w-full text-[9px] text-gray-800 space-y-1 bg-green-50 p-2 rounded border border-green-100">
        <div className="flex justify-between"><b>Class:</b> <span>{student.class?.name} - {student.class?.section}</span></div>
        <div className="flex justify-between"><b>Father:</b> <span>{student.fatherName || 'N/A'}</span></div>
        <div className="flex justify-between"><b>Phone:</b> <span>{student.user?.phone || 'N/A'}</span></div>
      </div>
      <div className="mt-auto w-full flex justify-between items-end px-2">
        <div className="text-[7px] text-gray-500 w-1/2">Holder's Sign</div>
        <div className="text-[7px] text-gray-500 w-1/2 text-right">Principal Sign</div>
      </div>
    </div>
  </div>
);

// 10. Geometric Shapes
export const GeometricShapes: React.FC<IDCardProps> = ({ student, schoolName, schoolLogo = defaultLogo, showQR }) => (
  <div style={cardStyle} className="print-card relative bg-white overflow-hidden">
    <div className="absolute top-[-20px] left-[-20px] w-24 h-24 rounded-full bg-yellow-400 opacity-20"></div>
    <div className="absolute bottom-[20px] right-[-20px] w-32 h-32 rounded-full bg-cyan-400 opacity-20"></div>
    <div className="absolute top-[40%] right-[10%] w-16 h-16 bg-pink-400 opacity-20 rotate-45"></div>
    
    <div className="relative z-10 flex flex-col items-center h-full">
      <div className="bg-gray-900 w-full py-2 flex flex-col items-center rounded-b-xl shadow-md">
        <img src={schoolLogo} alt="Logo" className="w-7 h-7 rounded-full bg-white p-0.5 mb-1" />
        <h2 className="text-[9px] font-bold text-white tracking-widest uppercase">{schoolName}</h2>
      </div>
      
      <div className="mt-4 mb-2 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-sm transform scale-105"></div>
        <img src={student.user?.photoUrl || defaultAvatar} alt="Photo" className="relative w-20 h-20 rounded-full border-2 border-white object-cover" />
      </div>
      
      <h3 className="text-[14px] font-black uppercase text-gray-800 text-center px-2">{student.user?.name}</h3>
      <p className="text-[10px] text-gray-500 font-medium mb-2">{student.rollNo}</p>
      
      <div className="flex w-full px-3 gap-2 mt-auto pb-3">
        {showQR && (
          <div className="w-1/3 flex justify-center items-center">
             <QRCodeSVG value={student.rollNo} size={30} />
          </div>
        )}
        <div className={`${showQR ? 'w-2/3' : 'w-full'} text-[8px] text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-200`}>
          <div className="font-bold text-gray-900 mb-0.5">CLASS {student.class?.name} - {student.class?.section}</div>
          <div>DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</div>
          <div className="text-red-500 font-bold">BLOOD: {student.bloodGroup || 'N/A'}</div>
          <div className="truncate">PH: {student.user?.phone || 'N/A'}</div>
        </div>
      </div>
    </div>
  </div>
);

export const templates = [
  { id: '1', name: 'Standard Vertical', component: StandardVertical },
  { id: '2', name: 'Horizontal Corporate', component: HorizontalCorporate },
  { id: '3', name: 'Gradient Premium', component: GradientPremium },
  { id: '4', name: 'Minimalist Clean', component: MinimalistClean },
  { id: '5', name: 'QR Code Smart', component: QrCodeSmart },
  { id: '6', name: 'Dual Tone Pattern', component: DualTonePattern },
  { id: '7', name: 'Wave Design', component: WaveDesign },
  { id: '8', name: 'Dark Mode Elite', component: DarkModeElite },
  { id: '9', name: 'Lanyard Overlay', component: LanyardOverlay },
  { id: '10', name: 'Geometric Shapes', component: GeometricShapes },
];
