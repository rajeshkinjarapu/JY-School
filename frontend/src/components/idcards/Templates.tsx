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

// Reusable helpers
const Photo = ({ url, name, cls = '' }: { url?: string; name: string; cls?: string }) =>
  url ? (
    <img src={url} alt={name} className={`object-cover ${cls}`} />
  ) : (
    <div className={`bg-gray-200 flex items-center justify-center text-gray-400 text-[8px] ${cls}`}>
      Photo
    </div>
  );

const Logo = ({ url, cls = '' }: { url?: string; cls?: string }) =>
  url ? (
    <img src={url} alt="logo" className={`object-contain ${cls}`} />
  ) : (
    <div className={`bg-white/20 flex items-center justify-center rounded-full ${cls}`}>
      <span className="text-white text-[8px] font-bold">LOGO</span>
    </div>
  );

const QR = ({ value, size = 28 }: { value: string; size?: number }) => (
  <div className="bg-white p-0.5 rounded">
    <QRCodeSVG value={value || 'ID'} size={size} />
  </div>
);

const Sign = ({ url, label = 'Principal' }: { url?: string; label?: string }) =>
  url ? (
    <img src={url} alt="sign" className="h-5 object-contain" />
  ) : (
    <div className="border-t border-current w-12 text-center pt-0.5">
      <span className="text-[7px] italic">{label}</span>
    </div>
  );

// ════════════════════════════════════════════
// 1. Standard Vertical (Classic Blue)
// ════════════════════════════════════════════
export const T01_StandardVertical: React.FC<TemplateProps> = ({ data, school, colorPrimary = '#1e3a8a', colorSecondary = '#fbbf24' }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white border border-gray-300 rounded-lg shadow-sm flex flex-col overflow-hidden" style={{ boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center justify-center py-2" style={{ backgroundColor: colorPrimary }}>
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-white text-[10px] font-bold text-center leading-tight px-2">{school.schoolName}</h2>
    </div>
    <div className="flex-1 flex flex-col items-center p-2 pt-3">
      <div className="w-20 h-24 border-2 p-0.5 rounded mb-2" style={{ borderColor: colorSecondary }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[13px] font-bold text-gray-800 text-center uppercase leading-tight mb-1">{data.name}</h3>
      <div className="w-full space-y-0.5 mt-1 px-1">
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">Class:</span><span>{data.className} - {data.section}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">ID No:</span><span>{data.rollNo}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">Blood:</span><span className="text-red-600 font-bold">{data.bloodGroup || 'N/A'}</span></p>
        <p className="text-[9px] text-gray-700 flex justify-between"><span className="font-semibold">Phone:</span><span>{data.phone}</span></p>
      </div>
    </div>
    <div className="h-12 flex items-end justify-between px-3 pb-2" style={{ backgroundColor: colorSecondary }}>
      <Sign url={school.signatureUrl} />
      <QR value={data.rollNo} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 2. Horizontal Corporate
// ════════════════════════════════════════════
export const T02_HorizontalCorporate: React.FC<TemplateProps> = ({ data, school, colorPrimary = '#0f172a', colorSecondary = '#38bdf8' }) => (
  <div className="w-[3.375in] h-[2.125in] bg-white border border-gray-300 rounded-lg shadow-sm flex overflow-hidden" style={{ boxSizing: 'border-box' }}>
    <div className="w-2" style={{ backgroundColor: colorSecondary }} />
    <div className="flex-1 p-2 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-bold leading-tight" style={{ color: colorPrimary }}>{school.schoolName}</h2>
          <p className="text-[7px] text-gray-500 w-40 leading-tight">{school.address}</p>
        </div>
        <Logo url={school.logoUrl} cls="h-8 w-8" />
      </div>
      <div className="flex mt-1">
        <div className="w-16 h-20 border border-gray-300 p-0.5 mr-3 shrink-0">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-0.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase">{data.name}</h3>
          <p className="text-[8px] font-semibold" style={{ color: colorSecondary }}>STUDENT</p>
          <p className="text-[8px] text-gray-700"><span className="font-semibold">ID:</span> {data.rollNo}</p>
          <p className="text-[8px] text-gray-700"><span className="font-semibold">Class:</span> {data.className} - {data.section}</p>
          <p className="text-[8px] text-gray-700"><span className="font-semibold">Blood:</span> <span className="text-red-600">{data.bloodGroup}</span></p>
        </div>
        <div className="flex flex-col items-end justify-end">
          <QR value={data.rollNo} size={30} />
        </div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 3. Gradient Premium
// ════════════════════════════════════════════
export const T03_GradientPremium: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #7e22ce 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center pt-3 pb-1">
      <h2 className="text-white text-[10px] font-bold text-center tracking-wide px-2">{school.schoolName}</h2>
    </div>
    <div className="flex-1 bg-white/95 mt-6 rounded-t-[28px] flex flex-col items-center px-3 pt-10 pb-2 relative">
      <div className="absolute -top-8 w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-md">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-gray-800 text-center uppercase leading-tight mb-0.5">{data.name}</h3>
      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[7px] font-bold px-2 py-0.5 rounded-full mb-2">STUDENT</span>
      <div className="w-full space-y-1 mb-auto">
        {[['ID No', data.rollNo], ['Class', `${data.className} ${data.section}`], ['Blood', data.bloodGroup || 'N/A']].map(([k, v]) => (
          <div key={k} className="flex justify-between items-center bg-gray-50 px-1.5 py-1 rounded">
            <span className="text-[7px] font-bold text-gray-500 uppercase">{k}</span>
            <span className="text-[8px] font-bold text-gray-800">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 4. Royal Gold
// ════════════════════════════════════════════
export const T04_RoyalGold: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-lg" style={{ background: 'linear-gradient(180deg, #1a0a00 0%, #3d1f00 40%, #1a0a00 100%)', boxSizing: 'border-box', border: '2px solid #c9a84c' }}>
    <div className="flex flex-col items-center py-2" style={{ borderBottom: '1px solid #c9a84c' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-[10px] font-bold text-center px-1" style={{ color: '#c9a84c' }}>{school.schoolName}</h2>
      <div className="text-[6px] tracking-widest mt-0.5" style={{ color: '#c9a84c80' }}>✦ STUDENT IDENTITY CARD ✦</div>
    </div>
    <div className="flex flex-col items-center py-2 flex-1">
      <div className="w-16 h-20 rounded mb-2 overflow-hidden" style={{ border: '2px solid #c9a84c' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#c9a84c' }}>{data.name}</h3>
      <div className="w-full px-3 mt-2 space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <p key={k} className="text-[8px] flex justify-between" style={{ color: '#d4b896', borderBottom: '1px solid #c9a84c30' }}>
            <span style={{ color: '#c9a84c80' }}>{k}</span><span>{v}</span>
          </p>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-2" style={{ borderTop: '1px solid #c9a84c', backgroundColor: '#c9a84c15' }}>
      <Sign url={school.signatureUrl} label="Principal" />
      <QR value={data.rollNo} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 5. Ocean Wave
// ════════════════════════════════════════════
export const T05_OceanWave: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(160deg, #0077b6 0%, #00b4d8 50%, #90e0ef 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-2">
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex-1 bg-white rounded-t-[24px] mx-1 flex flex-col items-center pt-2 px-2 pb-1" style={{ marginTop: '4px' }}>
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-md mb-1" style={{ borderColor: '#0077b6' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <span className="text-[7px] font-bold px-2 py-0.5 rounded-full text-white mb-1" style={{ backgroundColor: '#0077b6' }}>STUDENT</span>
      <h3 className="text-[12px] font-extrabold text-center uppercase" style={{ color: '#0077b6' }}>{data.name}</h3>
      <div className="w-full mt-2 space-y-1">
        {[['🆔', data.rollNo], ['🏫', `${data.className} - ${data.section}`], ['🩸', data.bloodGroup || 'N/A'], ['📞', data.phone]].map(([icon, val]) => (
          <div key={icon} className="flex items-center gap-1 bg-blue-50 rounded px-1.5 py-0.5">
            <span className="text-[9px]">{icon}</span>
            <span className="text-[8px] text-gray-700 font-semibold">{val}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-center mt-2">
        <Sign url={school.signatureUrl} />
        <QR value={data.rollNo} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 6. Emerald Nature
// ════════════════════════════════════════════
export const T06_EmeraldNature: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-lg" style={{ background: 'linear-gradient(160deg, #064e3b 0%, #065f46 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-2 px-2">
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-emerald-200 text-[10px] font-bold text-center">{school.schoolName}</h2>
      <div className="text-[6px] text-emerald-400 tracking-widest">● STUDENT ID CARD ●</div>
    </div>
    <div className="flex-1 bg-white/90 mx-2 mb-2 rounded-xl flex flex-col items-center pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-emerald-600 shadow mb-1">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-emerald-800 text-center uppercase">{data.name}</h3>
      <div className="w-full mt-2 space-y-0.5 px-1">
        {[['Class', `${data.className} - ${data.section}`], ['ID No', data.rollNo], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-emerald-50 px-1.5 py-0.5 rounded">
            <span className="font-semibold text-emerald-700">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 7. Neon Dark
// ════════════════════════════════════════════
export const T07_NeonDark: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: '#0a0a1a', boxSizing: 'border-box', border: '1px solid #00f5d4' }}>
    <div className="flex flex-col items-center py-2 px-2" style={{ borderBottom: '1px solid #00f5d440' }}>
      <h2 className="text-[10px] font-bold text-center" style={{ color: '#00f5d4' }}>{school.schoolName}</h2>
      <div className="text-[6px] tracking-widest mt-0.5" style={{ color: '#7c3aed' }}>STUDENT IDENTITY</div>
    </div>
    <div className="flex flex-col items-center py-3 flex-1 px-2">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-2" style={{ border: '2px solid #00f5d4', boxShadow: '0 0 12px #00f5d460' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold uppercase mb-1" style={{ color: '#00f5d4', textShadow: '0 0 8px #00f5d460' }}>{data.name}</h3>
      <div className="w-full space-y-1 mt-1">
        {[['ID', data.rollNo, '#00f5d4'], ['Class', `${data.className}-${data.section}`, '#a78bfa'], ['Blood', data.bloodGroup, '#f43f5e'], ['Ph', data.phone, '#34d399']].map(([k, v, c]) => (
          <div key={k} className="flex justify-between items-center px-2 py-0.5 rounded text-[8px]" style={{ backgroundColor: '#ffffff0a', border: `1px solid ${c}30` }}>
            <span style={{ color: c as string, fontWeight: 700 }}>{k}</span>
            <span className="text-gray-300">{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-2" style={{ borderTop: '1px solid #00f5d440' }}>
      <QR value={data.rollNo} size={26} />
      <div className="text-[6px] text-right" style={{ color: '#00f5d480' }}>
        <p>AUTHORIZED</p>
        <p>SIGNATURE</p>
        <div className="border-t mt-1 w-10" style={{ borderColor: '#00f5d460' }} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 8. Rose Elegance
// ════════════════════════════════════════════
export const T08_RoseElegance: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', boxSizing: 'border-box', border: '1.5px solid #fda4af' }}>
    <div className="flex flex-col items-center py-2" style={{ background: 'linear-gradient(90deg, #be123c 0%, #e11d48 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2 leading-tight">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-3">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow-md mb-1" style={{ borderColor: '#e11d48' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-center uppercase" style={{ color: '#be123c' }}>{data.name}</h3>
      <span className="text-[7px] px-2 py-0.5 rounded-full text-white mt-0.5 mb-2" style={{ background: '#e11d48' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-white rounded px-1.5 py-0.5 shadow-sm">
            <span className="font-semibold text-rose-700">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-2 mt-auto">
      <QR value={data.rollNo} size={26} />
      <Sign url={school.signatureUrl} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 9. Sky Minimal
// ════════════════════════════════════════════
export const T09_SkyMinimal: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', border: '2px solid #0ea5e9', borderRadius: '12px' }}>
    <div style={{ height: '40px', background: '#0ea5e9' }} className="flex items-center justify-center">
      <h2 className="text-white text-[10px] font-bold px-2 text-center">{school.schoolName}</h2>
    </div>
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#f0f9ff' }}>
      <div className="w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: '#0ea5e9' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <div>
        <h3 className="text-[11px] font-bold uppercase" style={{ color: '#0c4a6e' }}>{data.name}</h3>
        <p className="text-[8px] text-sky-600 font-semibold">STUDENT</p>
      </div>
    </div>
    <div className="flex-1 px-3 pt-2 space-y-1.5">
      {[['ID Number', data.rollNo], ['Class & Section', `${data.className} - ${data.section}`], ['Blood Group', data.bloodGroup || 'N/A'], ['Mobile', data.phone]].map(([k, v]) => (
        <div key={k} style={{ borderBottom: '1px solid #e0f2fe' }}>
          <p className="text-[7px] text-sky-500 font-semibold uppercase">{k}</p>
          <p className="text-[9px] text-gray-800 font-semibold">{v}</p>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center px-3 py-2">
      <Sign url={school.signatureUrl} />
      <QR value={data.rollNo} size={26} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 10. Sunset Orange
// ════════════════════════════════════════════
export const T10_SunsetOrange: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-2 px-2">
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-white text-[10px] font-bold text-center leading-tight">{school.schoolName}</h2>
      <div className="w-8 h-0.5 bg-white/40 rounded-full mt-1" />
    </div>
    <div className="flex-1 bg-white rounded-t-3xl mx-0 flex flex-col items-center pt-10 px-3 pb-2 relative" style={{ marginTop: '10px' }}>
      <div className="absolute -top-8 w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-center uppercase text-orange-700">{data.name}</h3>
      <span className="bg-orange-100 text-orange-700 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded bg-orange-50">
            <span className="font-bold text-orange-600">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 11. Purple Mystic
// ════════════════════════════════════════════
export const T11_PurpleMystic: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(160deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-3 px-2">
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1">
        <Logo url={school.logoUrl} cls="h-6 w-6" />
      </div>
      <h2 className="text-white text-[10px] font-bold text-center leading-tight">{school.schoolName}</h2>
    </div>
    <div className="flex-1 bg-white/10 mx-2 mb-2 rounded-2xl flex flex-col items-center pt-2 px-2 pb-2 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/60 shadow-lg mb-1">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-white text-center uppercase">{data.name}</h3>
      <span className="bg-white/20 text-white text-[7px] font-semibold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
            <span className="text-purple-200 font-semibold">{k}</span>
            <span className="text-white">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <div className="text-right text-[6px] text-white/60">
          <div className="border-t border-white/30 w-12 mt-4 text-center pt-0.5">Principal</div>
        </div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 12. Steel Corporate (Horizontal)
// ════════════════════════════════════════════
export const T12_SteelCorporate: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden rounded-lg" style={{ background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', boxSizing: 'border-box' }}>
    <div className="w-[1in] flex flex-col items-center justify-center bg-slate-900 px-2 py-2 gap-1.5">
      <Logo url={school.logoUrl} cls="h-10 w-10" />
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={24} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-3">
      <div>
        <p className="text-cyan-400 text-[7px] font-bold uppercase tracking-widest">{school.schoolName}</p>
        <h3 className="text-white text-sm font-bold uppercase leading-tight mt-0.5">{data.name}</h3>
        <p className="text-slate-400 text-[8px]">STUDENT</p>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="bg-white/5 px-1.5 py-0.5 rounded">
            <p className="text-[6px] text-cyan-400 font-bold uppercase">{k}</p>
            <p className="text-[8px] text-white font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-end">
        <div className="border-t border-slate-500 w-14 text-center pt-0.5">
          <p className="text-[6px] text-slate-400 italic">Principal</p>
        </div>
        <p className="text-[7px] text-slate-500">{school.phone}</p>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 13. Floral Pastel
// ════════════════════════════════════════════
export const T13_FloralPastel: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #fdf4ff 0%, #f5f0ff 100%)', boxSizing: 'border-box', border: '2px solid #c084fc', borderRadius: '16px' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center leading-tight">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#c084fc' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-purple-800 text-center uppercase">{data.name}</h3>
      <span className="bg-purple-100 text-purple-700 text-[7px] px-2 py-0.5 rounded-full font-bold mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo, 'bg-purple-50 text-purple-700'], ['Class', `${data.className} - ${data.section}`, 'bg-pink-50 text-pink-700'], ['Blood', data.bloodGroup, 'bg-red-50 text-red-600'], ['Phone', data.phone, 'bg-purple-50 text-purple-700']].map(([k, v, c]) => (
          <div key={k} className={`flex justify-between text-[8px] px-1.5 py-0.5 rounded ${c}`}>
            <span className="font-bold">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 14. Tech Blueprint
// ════════════════════════════════════════════
export const T14_TechBlueprint: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#0d1b2a', boxSizing: 'border-box', border: '1px solid #1e6091', borderRadius: '10px' }}>
    <div className="flex items-center gap-2 px-2 py-1.5" style={{ borderBottom: '1px solid #1e6091', background: '#0d1b2a' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7" />
      <div>
        <h2 className="text-[9px] font-bold leading-tight" style={{ color: '#48cae4' }}>{school.schoolName}</h2>
        <p className="text-[6px]" style={{ color: '#1e6091' }}>STUDENT IDENTITY CARD</p>
      </div>
    </div>
    <div className="flex justify-center py-2">
      <div className="w-16 h-16 overflow-hidden" style={{ border: '2px solid #48cae4', clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
    </div>
    <div className="flex-1 px-2 space-y-1.5">
      <h3 className="text-[12px] font-bold text-center uppercase" style={{ color: '#48cae4' }}>{data.name}</h3>
      <div className="w-full space-y-1">
        {[['ID NUMBER', data.rollNo, '#48cae4'], ['CLASS', `${data.className} / ${data.section}`, '#90e0ef'], ['BLOOD TYPE', data.bloodGroup, '#f43f5e'], ['PHONE', data.phone, '#90e0ef']].map(([k, v, c]) => (
          <div key={k} className="px-1.5 py-0.5" style={{ borderLeft: `2px solid ${c}`, background: '#0a2238' }}>
            <p className="text-[6px] font-bold uppercase" style={{ color: c as string }}>{k}</p>
            <p className="text-[8px] text-white">{v}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #1e6091' }}>
      <QR value={data.rollNo} size={26} />
      <div className="text-[6px] text-right" style={{ color: '#48cae4' }}>
        <div className="border-t mt-3 w-12 text-center pt-0.5" style={{ borderColor: '#48cae4' }}>SIGN</div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 15. Sunshine Yellow
// ════════════════════════════════════════════
export const T15_SunshineYellow: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: '#fefce8', boxSizing: 'border-box', border: '2px solid #eab308' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #ca8a04 0%, #eab308 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center leading-tight">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#eab308' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-yellow-900 text-center uppercase">{data.name}</h3>
      <span className="text-[7px] px-2 py-0.5 rounded-full font-bold mt-0.5 mb-2 text-white" style={{ background: '#ca8a04' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
            <span className="font-bold text-yellow-800">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 16. Crimson Banner (Horizontal)
// ════════════════════════════════════════════
export const T16_CrimsonBanner: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden rounded-xl" style={{ background: '#fff', boxSizing: 'border-box', border: '1.5px solid #dc2626' }}>
    <div className="w-[0.7in] flex flex-col items-center justify-center gap-1" style={{ background: 'linear-gradient(160deg, #dc2626 0%, #991b1b 100%)' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={22} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-2.5">
      <div>
        <h2 className="text-[8px] font-bold text-red-700 uppercase tracking-wider">{school.schoolName}</h2>
        <h3 className="text-sm font-extrabold text-gray-800 uppercase leading-tight mt-0.5">{data.name}</h3>
        <div className="text-[8px] text-red-600 font-semibold">STUDENT IDENTITY</div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <p key={k} className="text-[8px] flex gap-1">
            <span className="font-bold text-red-700">{k}:</span>
            <span className="text-gray-700">{v}</span>
          </p>
        ))}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-[6px] text-gray-400 leading-tight">{school.address}</p>
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 17. Aurora Borealis
// ════════════════════════════════════════════
export const T17_AuroraBorealis: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-2 px-2">
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex-1 flex flex-col items-center" style={{ background: 'linear-gradient(180deg, #ffffff00 0%, #ffffffee 30%, #ffffffff 100%)' }}>
      <div className="flex flex-col items-center pt-6 px-3 pb-2 w-full">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-xl mb-1">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <h3 className="text-[12px] font-bold uppercase" style={{ color: '#134e5e' }}>{data.name}</h3>
        <span className="text-[7px] px-2 py-0.5 rounded-full font-bold text-white mb-2" style={{ background: 'linear-gradient(90deg, #134e5e, #71b280)' }}>STUDENT</span>
        <div className="w-full space-y-1">
          {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#13566e15', borderLeft: '2px solid #71b280' }}>
              <span className="font-bold text-teal-700">{k}</span>
              <span className="text-gray-700">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between w-full items-end mt-2">
          <QR value={data.rollNo} size={26} />
          <Sign url={school.signatureUrl} />
        </div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 18. Geometric Modern
// ════════════════════════════════════════════
export const T18_GeometricModern: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
    <div className="relative h-16 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #2563eb 0%, #7c3aed 100%)' }} />
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -left-3 w-12 h-12 bg-white/10 rounded-full" />
      <div className="absolute inset-0 flex flex-col justify-center items-center">
        <h2 className="text-white text-[9px] font-bold text-center px-2">{school.schoolName}</h2>
      </div>
    </div>
    <div className="flex flex-col items-center -mt-6 z-10">
      <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-white shadow-lg">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
    </div>
    <div className="flex flex-col items-center px-3 pt-1 pb-2 flex-1">
      <h3 className="text-[12px] font-extrabold text-gray-800 text-center uppercase mt-1">{data.name}</h3>
      <div className="flex gap-1 mt-0.5 mb-2">
        <span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">STUDENT</span>
        <span className="text-[7px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">{data.bloodGroup}</span>
      </div>
      <div className="w-full space-y-1">
        {[['ID Number', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px]" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '3px' }}>
            <span className="font-semibold text-blue-600">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-auto">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 19. Classic Maroon
// ════════════════════════════════════════════
export const T19_ClassicMaroon: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #7f1d1d' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: '#7f1d1d' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-[10px] font-bold text-yellow-300 text-center leading-tight">{school.schoolName}</h2>
      <p className="text-[7px] text-red-300 text-center mt-0.5">STUDENT IDENTITY CARD</p>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-3 pb-2">
      <div className="w-20 h-20 overflow-hidden border-2 mb-2" style={{ borderColor: '#7f1d1d' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[13px] font-bold text-center uppercase" style={{ color: '#7f1d1d' }}>{data.name}</h3>
      <div className="w-full mt-2 space-y-1">
        {[['Class', `${data.className} - ${data.section}`], ['ID No', data.rollNo], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <p key={k} className="text-[8px] flex justify-between py-0.5" style={{ borderBottom: '1px solid #fca5a5' }}>
            <span className="font-bold" style={{ color: '#7f1d1d' }}>{k}:</span>
            <span className="text-gray-700">{v}</span>
          </p>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-2" style={{ background: '#fef2f2' }}>
      <QR value={data.rollNo} size={26} />
      <Sign url={school.signatureUrl} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 20. Glassmorphism
// ════════════════════════════════════════════
export const T20_Glassmorphism: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-2xl relative" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxSizing: 'border-box' }}>
    <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/10" />
    <div className="absolute bottom-8 right-3 w-8 h-8 rounded-full bg-white/10" />
    <div className="relative z-10 mx-2 mt-2 mb-1 rounded-2xl flex flex-col items-center px-3 pt-3 pb-2" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
      <h2 className="text-white text-[9px] font-bold text-center mb-2">{school.schoolName}</h2>
      <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-white/60 shadow-lg mb-1">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-white text-[12px] font-bold text-center uppercase">{data.name}</h3>
      <span className="bg-white/20 text-white text-[7px] px-2 py-0.5 rounded-full font-bold mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Ph', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <span className="text-white/70 font-semibold">{k}</span>
            <span className="text-white">{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-1.5 mx-2 mb-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
      <QR value={data.rollNo} size={24} />
      <div className="text-[6px] text-white/70 border-t border-white/30 w-12 text-center pt-0.5">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 21. Indigo Stripe (Horizontal)
// ════════════════════════════════════════════
export const T21_IndigoStripe: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] bg-white flex overflow-hidden rounded-lg" style={{ boxSizing: 'border-box', border: '1.5px solid #4f46e5' }}>
    <div style={{ width: '6px', background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)' }} />
    <div className="p-2 flex flex-col justify-between flex-1">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[9px] font-bold text-indigo-700">{school.schoolName}</h2>
          <p className="text-[6px] text-gray-400 mt-0.5">STUDENT IDENTITY CARD</p>
        </div>
        <Logo url={school.logoUrl} cls="h-7 w-7" />
      </div>
      <div className="flex gap-2 items-center">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-400 shrink-0">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase">{data.name}</h3>
          <p className="text-[8px] text-indigo-500 font-semibold">STUDENT</p>
          <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0">
            {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
              <p key={k} className="text-[7px] text-gray-600"><span className="font-bold text-indigo-600">{k}:</span> {v}</p>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between h-full">
          <QR value={data.rollNo} size={28} />
          <Sign url={school.signatureUrl} />
        </div>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 22. Teal Waves
// ════════════════════════════════════════════
export const T22_TealWaves: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#f0fdfa', boxSizing: 'border-box', borderRadius: '12px', border: '2px solid #14b8a6' }}>
    <div className="relative" style={{ height: '70px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' }}>
      <svg viewBox="0 0 200 30" className="absolute bottom-0 w-full" style={{ height: '20px' }}>
        <path d="M0,15 C50,0 150,30 200,15 L200,30 L0,30 Z" fill="#f0fdfa" />
      </svg>
      <div className="flex flex-col items-center pt-1.5">
        <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
      </div>
    </div>
    <div className="flex flex-col items-center px-3 pb-2 flex-1" style={{ marginTop: '-4px' }}>
      <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-md mb-1" style={{ borderColor: '#14b8a6' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-teal-800 text-center uppercase">{data.name}</h3>
      <span className="text-[7px] text-white font-bold px-2 py-0.5 rounded-full mb-2" style={{ background: '#0f766e' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-teal-50 px-1.5 py-0.5 rounded border-l-2 border-teal-400">
            <span className="font-bold text-teal-700">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-auto pt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 23. Midnight Blue
// ════════════════════════════════════════════
export const T23_MidnightBlue: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', boxSizing: 'border-box', border: '1px solid #1d4ed8' }}>
    <div className="flex items-center gap-2 px-2 py-2" style={{ borderBottom: '1px solid #1d4ed850' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <h2 className="text-[9px] font-bold leading-tight" style={{ color: '#93c5fd' }}>{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center pt-3 px-3 flex-1">
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[6px] font-bold px-1 rounded">{data.bloodGroup}</div>
      </div>
      <h3 className="text-[12px] font-bold text-white text-center uppercase mt-2">{data.name}</h3>
      <div className="bg-blue-900/50 text-blue-300 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</div>
      <div className="w-full space-y-1">
        {[['ID NUMBER', data.rollNo], ['CLASS & SEC', `${data.className} - ${data.section}`], ['PHONE', data.phone]].map(([k, v]) => (
          <div key={k} className="px-1.5 py-0.5 rounded" style={{ background: '#1d4ed815', border: '1px solid #1d4ed840' }}>
            <p className="text-[6px] font-bold text-blue-400">{k}</p>
            <p className="text-[8px] text-white">{v}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #1d4ed830' }}>
      <QR value={data.rollNo} size={26} />
      <div className="border-t border-blue-600/50 w-12 text-center pt-0.5 text-[6px] text-blue-400 italic">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 24. Copper & Cream
// ════════════════════════════════════════════
export const T24_CopperCream: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#fdf8f0', boxSizing: 'border-box', borderRadius: '10px', border: '2px solid #b87333' }}>
    <div className="py-2 px-3 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #b87333 0%, #d4956a 50%, #b87333 100%)' }}>
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
      <p className="text-[6px] text-amber-100 tracking-widest mt-0.5">STUDENT IDENTITY CARD</p>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-20 overflow-hidden border-2 mb-2" style={{ borderColor: '#b87333' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-center uppercase" style={{ color: '#7c4a1a' }}>{data.name}</h3>
      <div className="w-full mt-2 space-y-1">
        {[['Class', `${data.className} - ${data.section}`], ['ID No', data.rollNo], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#fef3e2', border: '1px solid #e8c99a' }}>
            <span className="font-bold" style={{ color: '#b87333' }}>{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 25. Vivid Diagonal (Horizontal)
// ════════════════════════════════════════════
export const T25_VividDiagonal: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] relative overflow-hidden rounded-xl" style={{ background: '#fff', boxSizing: 'border-box' }}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, transparent 50%)', width: '55%' }} />
    <div className="relative flex h-full">
      <div className="w-[45%] flex flex-col items-center justify-center gap-1 p-2">
        <Logo url={school.logoUrl} cls="h-8 w-8" />
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/70">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <QR value={data.rollNo} size={24} />
      </div>
      <div className="flex-1 flex flex-col justify-between p-2.5">
        <div>
          <p className="text-[7px] font-bold text-purple-600">{school.schoolName}</p>
          <h3 className="text-sm font-extrabold text-gray-800 uppercase leading-tight">{data.name}</h3>
          <p className="text-[7px] text-blue-600 font-semibold">STUDENT</p>
        </div>
        <div className="space-y-0.5">
          {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Ph', data.phone]].map(([k, v]) => (
            <p key={k} className="text-[8px]"><span className="font-bold text-blue-600">{k}:</span> <span className="text-gray-700">{v}</span></p>
          ))}
        </div>
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 26. Warm Peach
// ════════════════════════════════════════════
export const T26_WarmPeach: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 100%)', boxSizing: 'border-box', border: '2px solid #f97316' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#fb923c' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold mt-1 text-center uppercase" style={{ color: '#c2410c' }}>{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#ea580c' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
            <span className="font-bold text-orange-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 27. Slate Professional (Horizontal)
// ════════════════════════════════════════════
export const T27_SlateProfessional: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] bg-white flex overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #94a3b8' }}>
    <div className="flex flex-col items-center justify-between py-2 px-2" style={{ width: '0.9in', background: '#1e293b' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-12 h-12 rounded overflow-hidden border border-slate-500">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={26} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-2.5">
      <div>
        <h2 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{school.schoolName}</h2>
        <h3 className="text-[13px] font-extrabold text-slate-800 uppercase mt-0.5">{data.name}</h3>
        <div className="w-8 h-0.5 bg-slate-300 mt-0.5" />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {[['ID Number', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood Group', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k}>
            <p className="text-[6px] text-slate-400 uppercase font-bold">{k}</p>
            <p className="text-[8px] text-slate-700 font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-[6px] text-slate-400 leading-tight max-w-[100px]">{school.address}</p>
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 28. Vibrant Lime
// ════════════════════════════════════════════
export const T28_VibrantLime: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(160deg, #f7fee7 0%, #ecfccb 100%)', boxSizing: 'border-box', border: '2px solid #84cc16' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #4d7c0f 0%, #65a30d 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#84cc16' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold mt-1 text-center uppercase text-lime-900">{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#65a30d' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-lime-50 px-1.5 py-0.5 rounded border border-lime-200">
            <span className="font-bold text-lime-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 29. Olive Military
// ════════════════════════════════════════════
export const T29_OliveMilitary: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#3d4a1e', boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #6b7c2b' }}>
    <div className="flex flex-col items-center py-2 px-2" style={{ borderBottom: '2px solid #6b7c2b' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-[10px] font-bold text-center" style={{ color: '#d4e157' }}>{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center pt-2 px-2 flex-1">
      <div className="w-16 h-16 overflow-hidden border-2 mb-2" style={{ borderColor: '#6b7c2b' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-center uppercase" style={{ color: '#d4e157' }}>{data.name}</h3>
      <div className="w-full mt-2 space-y-1 px-1">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5" style={{ background: '#2d3714', border: '1px solid #6b7c2b', borderRadius: '4px' }}>
            <span style={{ color: '#d4e157', fontWeight: 700 }}>{k}</span>
            <span style={{ color: '#c5d5a0' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #6b7c2b' }}>
      <QR value={data.rollNo} size={26} />
      <div style={{ color: '#d4e157', fontSize: '7px', borderTop: '1px solid #6b7c2b', paddingTop: '2px', width: '48px', textAlign: 'center' }}>Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 30. Platinum Luxury (Horizontal)
// ════════════════════════════════════════════
export const T30_PlatinumLuxury: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 100%)', boxSizing: 'border-box', borderRadius: '12px', border: '1px solid #9ca3af' }}>
    <div className="flex flex-col items-center justify-between py-2 px-2 shrink-0" style={{ width: '0.9in', borderRight: '1px solid #374151' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: '#c0c0c0' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={26} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-3">
      <div>
        <p className="text-[7px] tracking-widest uppercase" style={{ color: '#9ca3af' }}>{school.schoolName}</p>
        <h3 className="text-sm font-bold uppercase mt-0.5" style={{ color: '#e5e7eb' }}>{data.name}</h3>
        <div style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, #c0c0c0, transparent)', marginTop: '3px' }} />
      </div>
      <div className="space-y-0.5">
        {[['ID', data.rollNo, '#c0c0c0'], ['CLASS', `${data.className}-${data.section}`, '#a0a0a0'], ['BLOOD', data.bloodGroup, '#ef4444'], ['PHONE', data.phone, '#a0a0a0']].map(([k, v, c]) => (
          <p key={k} className="text-[8px]"><span className="font-bold tracking-wider" style={{ color: c as string }}>{k}:</span> <span style={{ color: '#d1d5db' }}>{v}</span></p>
        ))}
      </div>
      <p className="text-[6px] tracking-widest" style={{ color: '#6b7280' }}>{school.phone}</p>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 31. Candy Pink
// ════════════════════════════════════════════
export const T31_CandyPink: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', boxSizing: 'border-box', border: '2px solid #ec4899' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #be185d 0%, #ec4899 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#f472b6' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase text-pink-800">{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#be185d' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
            <span className="font-bold text-pink-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 32. Cobalt Shield
// ════════════════════════════════════════════
export const T32_CobaltShield: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#fff', boxSizing: 'border-box', borderRadius: '10px', border: '2px solid #1d4ed8' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: '#1d4ed8' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
      <div className="flex gap-1 mt-0.5">
        <div className="w-6 h-0.5 bg-yellow-300 rounded-full" />
        <div className="w-6 h-0.5 bg-yellow-300 rounded-full" />
      </div>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-blue-200 shadow-md mb-1">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-center uppercase text-blue-900">{data.name}</h3>
      <span className="bg-blue-100 text-blue-800 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-blue-50 px-1.5 py-0.5 rounded">
            <span className="font-bold text-blue-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 33. Forest Brown
// ════════════════════════════════════════════
export const T33_ForestBrown: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: '#fdf6ec', boxSizing: 'border-box', borderRadius: '10px', border: '2px solid #92400e' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #78350f 0%, #92400e 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-yellow-200 text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded overflow-hidden border-2 mb-2" style={{ borderColor: '#92400e' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-center uppercase" style={{ color: '#78350f' }}>{data.name}</h3>
      <span className="text-[7px] px-2 py-0.5 rounded-full font-bold text-white mb-2 mt-0.5" style={{ background: '#92400e' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', border: '1px solid #d97706' }}>
            <span className="font-bold" style={{ color: '#92400e' }}>{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 34. Lavender Dreams
// ════════════════════════════════════════════
export const T34_LavenderDreams: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%)', boxSizing: 'border-box', border: '2px solid #8b5cf6' }}>
    <div className="py-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#a78bfa' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase text-violet-900">{data.name}</h3>
      <span className="bg-violet-100 text-violet-700 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
            <span className="font-bold text-violet-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 35. Arctic Frost
// ════════════════════════════════════════════
export const T35_ArcticFrost: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 100%)', boxSizing: 'border-box', borderRadius: '12px', border: '2px solid #00acc1' }}>
    <div className="py-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #006064 0%, #00838f 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#00acc1' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase" style={{ color: '#006064' }}>{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#006064' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
            <span className="font-bold text-cyan-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 36. Ruby Red (Horizontal)
// ════════════════════════════════════════════
export const T36_RubyRed: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden" style={{ background: '#fff', boxSizing: 'border-box', borderRadius: '12px', border: '2px solid #be123c' }}>
    <div className="flex flex-col items-center justify-between py-2 px-2 shrink-0" style={{ background: 'linear-gradient(160deg, #9f1239 0%, #be123c 100%)', width: '0.85in' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-200">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={26} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-2.5">
      <div>
        <p className="text-[7px] font-bold text-rose-600 uppercase tracking-widest">{school.schoolName}</p>
        <h3 className="text-sm font-extrabold text-gray-800 uppercase">{data.name}</h3>
        <div className="w-full h-0.5 bg-rose-100 mt-0.5" />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="bg-rose-50 rounded px-1 py-0.5">
            <p className="text-[6px] font-bold text-rose-600">{k}</p>
            <p className="text-[8px] text-gray-700 font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-[6px] text-gray-400 leading-tight">{school.phone}</p>
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 37. Monochrome
// ════════════════════════════════════════════
export const T37_Monochrome: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '8px', border: '2px solid #111' }}>
    <div className="py-2 px-2 flex flex-col items-center" style={{ background: '#111' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center uppercase tracking-wide">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 overflow-hidden border-2 border-black mb-2">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[13px] font-bold text-center uppercase tracking-wider">{data.name}</h3>
      <div className="w-full h-0.5 bg-black mt-1 mb-2" />
      <div className="w-full space-y-1">
        {[['ID No', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px]" style={{ borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>
            <span className="font-extrabold uppercase tracking-wider">{k}</span>
            <span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-auto pt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 38. Tri-Color Flag
// ════════════════════════════════════════════
export const T38_TriColorFlag: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
    <div style={{ height: '8px', background: '#FF9933' }} />
    <div style={{ height: '8px', background: '#FFFFFF', border: '1px solid #e2e8f0' }} className="flex items-center justify-center">
      <div style={{ width: '6px', height: '6px', background: '#000080', borderRadius: '50%' }} />
    </div>
    <div style={{ height: '8px', background: '#138808' }} />
    <div className="flex flex-col items-center py-1 px-2" style={{ background: '#00008060' }}>
      <h2 className="text-white text-[9px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-2 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 mb-1" style={{ borderColor: '#000080' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-center uppercase" style={{ color: '#000080' }}>{data.name}</h3>
      <span className="text-[7px] px-2 py-0.5 rounded-full font-bold text-white mb-2 mt-0.5" style={{ background: '#138808' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo, '#000080'], ['Class', `${data.className} - ${data.section}`, '#138808'], ['Blood', data.bloodGroup, '#DC143C'], ['Phone', data.phone, '#000080']].map(([k, v, c]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded bg-gray-50">
            <span className="font-bold" style={{ color: c as string }}>{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 39. Gradient Cyan
// ════════════════════════════════════════════
export const T39_GradientCyan: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-2 px-2">
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex-1 bg-white rounded-t-3xl mx-0 flex flex-col items-center pt-10 px-3 pb-2 relative" style={{ marginTop: '8px' }}>
      <div className="absolute -top-8 w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-center uppercase text-cyan-800">{data.name}</h3>
      <span className="bg-cyan-100 text-cyan-700 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
            <span className="font-bold text-cyan-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 40. Sunset Gradient (Horizontal)
// ════════════════════════════════════════════
export const T40_SunsetHorizontal: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center justify-between py-2 px-2 shrink-0" style={{ width: '0.85in' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/70">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={24} />
    </div>
    <div className="flex-1 bg-white/90 rounded-l-3xl flex flex-col justify-between p-3">
      <div>
        <p className="text-[7px] font-bold text-orange-600">{school.schoolName}</p>
        <h3 className="text-sm font-extrabold text-gray-800 uppercase">{data.name}</h3>
        <span className="text-[7px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">STUDENT</span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <p key={k} className="text-[8px]"><span className="font-bold text-red-500">{k}:</span> <span className="text-gray-700">{v}</span></p>
        ))}
      </div>
      <Sign url={school.signatureUrl} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 41. Sapphire Diamond
// ════════════════════════════════════════════
export const T41_SapphireDiamond: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #1e40af 0%, #1d4ed8 60%, #2563eb 100%)', boxSizing: 'border-box', borderRadius: '12px', border: '1px solid #93c5fd' }}>
    <div className="flex flex-col items-center py-2 px-2 relative">
      <div className="absolute top-1 right-2 opacity-20">
        <div style={{ width: '20px', height: '20px', background: 'white', transform: 'rotate(45deg)' }} />
      </div>
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-1" />
      <h2 className="text-white text-[9px] font-bold text-center tracking-wide">{school.schoolName}</h2>
    </div>
    <div className="flex-1 bg-white/95 rounded-t-[30px] mt-1 flex flex-col items-center px-2 pt-10 pb-2 relative">
      <div className="absolute -top-8 w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-xl">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[11px] font-extrabold text-center uppercase text-blue-900">{data.name}</h3>
      <span className="bg-blue-600 text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-blue-50 px-1.5 py-0.5 rounded border-l-2 border-blue-400">
            <span className="font-bold text-blue-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 42. Flame Warrior
// ════════════════════════════════════════════
export const T42_FlameWarrior: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #1a0000 0%, #300000 50%, #1a0000 100%)', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #dc2626' }}>
    <div className="flex flex-col items-center py-2 px-2" style={{ borderBottom: '1px solid #dc262640' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8 mb-0.5" />
      <h2 className="text-red-400 text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center pt-2 px-2 flex-1">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-600 shadow mb-1" style={{ boxShadow: '0 0 15px #dc262640' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-red-400 text-center uppercase">{data.name}</h3>
      <div className="text-[7px] text-red-600 font-bold tracking-widest mb-2">STUDENT</div>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo, '#f87171'], ['Class', `${data.className}-${data.section}`, '#fca5a5'], ['Blood', data.bloodGroup, '#dc2626'], ['Phone', data.phone, '#f87171']].map(([k, v, c]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#ffffff0a', border: '1px solid #dc262630' }}>
            <span style={{ color: c as string, fontWeight: 700 }}>{k}</span>
            <span style={{ color: '#fca5a5' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #dc262640' }}>
      <QR value={data.rollNo} size={26} />
      <div className="text-[6px] text-red-600/60 border-t border-red-600/30 w-12 text-center pt-0.5">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 43. Marine Navy (Horizontal)
// ════════════════════════════════════════════
export const T43_MarineNavy: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden" style={{ background: '#fff', boxSizing: 'border-box', borderRadius: '10px', border: '2px solid #1e3a8a' }}>
    <div style={{ width: '4px', background: 'linear-gradient(180deg, #1e3a8a 0%, #60a5fa 100%)' }} />
    <div className="flex-1 p-2 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[9px] font-bold text-blue-900">{school.schoolName}</h2>
          <p className="text-[6px] text-gray-400">OFFICIAL STUDENT ID</p>
        </div>
        <Logo url={school.logoUrl} cls="h-8 w-8" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-800 shrink-0">
          <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase">{data.name}</h3>
          <div className="grid grid-cols-2 gap-x-2 mt-0.5">
            {[['ID', data.rollNo], ['Class', `${data.className}-${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
              <p key={k} className="text-[7px]"><span className="font-bold text-blue-800">{k}:</span> <span className="text-gray-600">{v}</span></p>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <QR value={data.rollNo} size={28} />
          <Sign url={school.signatureUrl} />
        </div>
      </div>
      <p className="text-[6px] text-gray-400">{school.phone}</p>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 44. Arctic Sunrise
// ════════════════════════════════════════════
export const T44_ArcticSunrise: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #fff 0%, #f0fdf4 100%)', boxSizing: 'border-box', borderRadius: '12px', border: '2px solid #22c55e' }}>
    <div className="py-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #15803d 0%, #22c55e 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#22c55e' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase text-green-900">{data.name}</h3>
      <span className="bg-green-100 text-green-700 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
            <span className="font-bold text-green-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 45. Silver Minimal
// ════════════════════════════════════════════
export const T45_SilverMinimal: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
    <div style={{ height: '4px', background: 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%)' }} />
    <div className="flex items-center gap-2 px-3 py-2">
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div>
        <h2 className="text-[9px] font-bold text-slate-700">{school.schoolName}</h2>
        <p className="text-[6px] text-slate-400 uppercase tracking-wider">Student Identity</p>
      </div>
    </div>
    <div className="flex flex-col items-center px-3 py-2 flex-1">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 shadow mb-1">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-slate-800 text-center uppercase">{data.name}</h3>
      <span className="bg-slate-100 text-slate-600 text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2">STUDENT</span>
      <div className="w-full space-y-1.5">
        {[['ID Number', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '3px' }}>
            <p className="text-[6px] text-slate-400 uppercase font-bold">{k}</p>
            <p className="text-[9px] text-slate-700 font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-2 border-t border-slate-100">
      <QR value={data.rollNo} size={26} />
      <Sign url={school.signatureUrl} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 46. Cosmic Purple (Horizontal)
// ════════════════════════════════════════════
export const T46_CosmicPurple: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[3.375in] h-[2.125in] flex overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #0f0a2e 0%, #1e1a4e 100%)', boxSizing: 'border-box', border: '1px solid #7c3aed' }}>
    <div className="flex flex-col items-center justify-between py-2 px-2 shrink-0" style={{ width: '0.9in', borderRight: '1px solid #7c3aed30' }}>
      <Logo url={school.logoUrl} cls="h-8 w-8" />
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500" style={{ boxShadow: '0 0 10px #7c3aed40' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <QR value={data.rollNo} size={26} />
    </div>
    <div className="flex-1 flex flex-col justify-between p-3">
      <div>
        <p className="text-[7px] font-bold tracking-widest" style={{ color: '#a78bfa' }}>{school.schoolName}</p>
        <h3 className="text-sm font-bold text-white uppercase">{data.name}</h3>
        <span className="text-[7px] bg-purple-900/60 text-purple-300 font-bold px-1.5 py-0.5 rounded-full border border-purple-700">STUDENT</span>
      </div>
      <div className="space-y-1">
        {[['ID', data.rollNo, '#a78bfa'], ['CLASS', `${data.className}-${data.section}`, '#c4b5fd'], ['BLOOD', data.bloodGroup, '#f43f5e'], ['PHONE', data.phone, '#c4b5fd']].map(([k, v, c]) => (
          <p key={k} className="text-[8px]"><span className="font-bold" style={{ color: c as string }}>{k}:</span> <span className="text-gray-300">{v}</span></p>
        ))}
      </div>
      <div className="border-t border-purple-800/50 w-14 text-center pt-0.5 text-[6px] text-purple-400 italic">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 47. Aquamarine
// ════════════════════════════════════════════
export const T47_Aquamarine: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(160deg, #e0f2f1 0%, #b2dfdb 100%)', boxSizing: 'border-box', border: '2px solid #00897b' }}>
    <div className="py-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #004d40 0%, #00897b 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#00897b' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase" style={{ color: '#004d40' }}>{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#00897b' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
            <span className="font-bold" style={{ color: '#00897b' }}>{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 48. Carbon Fiber
// ════════════════════════════════════════════
export const T48_CarbonFiber: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 4px, #222 4px, #222 8px)', boxSizing: 'border-box', borderRadius: '10px', border: '1px solid #444' }}>
    <div className="flex flex-col items-center py-2 px-2" style={{ background: '#111111cc', borderBottom: '1px solid #444' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-gray-200 text-[10px] font-bold text-center uppercase tracking-wide">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center pt-2 px-2 flex-1" style={{ background: '#111111aa' }}>
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-500 mb-1 shadow">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-gray-200 text-center uppercase">{data.name}</h3>
      <span className="text-gray-400 text-[7px] font-bold px-2 py-0.5 rounded border border-gray-600 mb-2 mt-0.5 uppercase tracking-widest">STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo, '#60a5fa'], ['Class', `${data.className}-${data.section}`, '#94a3b8'], ['Blood', data.bloodGroup, '#f87171'], ['Phone', data.phone, '#94a3b8']].map(([k, v, c]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#ffffff08', border: '1px solid #333' }}>
            <span style={{ color: c as string, fontWeight: 700 }}>{k}</span>
            <span style={{ color: '#d1d5db' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #444', background: '#111111cc' }}>
      <QR value={data.rollNo} size={26} />
      <div className="text-[6px] text-gray-500 border-t border-gray-600 w-12 text-center pt-0.5">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 49. Spring Blossom
// ════════════════════════════════════════════
export const T49_SpringBlossom: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #fce7f3 50%, #fff0f3 100%)', boxSizing: 'border-box', border: '2px solid #f472b6' }}>
    <div className="py-1.5 px-2 flex flex-col items-center relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #9d174d 0%, #db2777 100%)' }}>
      <div className="absolute top-0 right-0 text-[20px] opacity-20">🌸</div>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded-full overflow-hidden border-4 shadow" style={{ borderColor: '#f472b6' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold mt-1 text-center uppercase text-pink-900">{data.name}</h3>
      <div className="flex gap-1 mt-0.5 mb-2 items-center">
        <span className="text-[8px]">🌸</span>
        <span className="bg-pink-100 text-pink-700 text-[7px] font-bold px-1.5 py-0.5 rounded-full">STUDENT</span>
        <span className="text-[8px]">🌸</span>
      </div>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
            <span className="font-bold text-pink-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 50. Retro Classic
// ════════════════════════════════════════════
export const T50_RetroClassic: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] bg-white flex flex-col overflow-hidden" style={{ boxSizing: 'border-box', borderRadius: '4px', border: '3px double #1e3a8a' }}>
    <div className="text-center py-1" style={{ background: '#1e3a8a' }}>
      <p className="text-yellow-300 text-[7px] font-bold tracking-widest uppercase">✦ Student Identity Card ✦</p>
    </div>
    <div className="py-1 flex flex-col items-center" style={{ background: '#1e3a8a' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-2 px-3 pb-2">
      <div className="w-16 h-20 border-2 border-blue-900 mb-1 overflow-hidden">
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <div className="w-full h-0.5 my-1" style={{ background: 'repeating-linear-gradient(90deg, #1e3a8a 0px, #1e3a8a 4px, transparent 4px, transparent 8px)' }} />
      <h3 className="text-[13px] font-bold text-center uppercase text-blue-900">{data.name}</h3>
      <div className="w-full h-0.5 my-1" style={{ background: 'repeating-linear-gradient(90deg, #1e3a8a 0px, #1e3a8a 4px, transparent 4px, transparent 8px)' }} />
      <div className="w-full mt-1 space-y-0.5">
        {[['Class', `${data.className} - ${data.section}`], ['ID No', data.rollNo], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <p key={k} className="text-[8px] flex justify-between">
            <span className="font-bold text-blue-900">{k}:</span><span className="text-gray-700">{v}</span>
          </p>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-3 py-1.5" style={{ background: '#f8faff', borderTop: '2px solid #1e3a8a' }}>
      <QR value={data.rollNo} size={26} />
      <Sign url={school.signatureUrl} />
    </div>
  </div>
);

// ════════════════════════════════════════════
// 51. Holographic Foil
// ════════════════════════════════════════════
export const T51_HolographicFoil: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)', boxSizing: 'border-box' }}>
    <div className="flex flex-col items-center py-1.5 px-2">
      <h2 className="text-white text-[10px] font-bold text-center" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{school.schoolName}</h2>
    </div>
    <div className="flex-1 mx-1.5 mb-1.5 rounded-xl flex flex-col items-center px-2 pt-2 pb-2" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 mb-1" style={{ borderColor: '#764ba2', boxShadow: '0 0 15px rgba(118,75,162,0.4)' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-extrabold text-center uppercase" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.name}</h3>
      <span className="text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2 text-white" style={{ background: 'linear-gradient(135deg, #667eea, #f5576c)' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'linear-gradient(90deg, #667eea10, #f5576c10)', border: '1px solid #764ba220' }}>
            <span className="font-bold" style={{ color: '#764ba2' }}>{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 52. Electric Green
// ════════════════════════════════════════════
export const T52_ElectricGreen: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden rounded-xl" style={{ background: '#050f05', boxSizing: 'border-box', border: '1px solid #22c55e' }}>
    <div className="flex flex-col items-center py-2 px-2" style={{ borderBottom: '1px solid #22c55e40' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-green-400 text-[10px] font-bold text-center" style={{ textShadow: '0 0 8px #22c55e60' }}>{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center pt-2 px-2 flex-1">
      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500 mb-1" style={{ boxShadow: '0 0 12px #22c55e40' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-green-400 text-[12px] font-bold text-center uppercase">{data.name}</h3>
      <div className="text-[7px] text-green-600 font-bold tracking-widest mb-2">STUDENT</div>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo, '#4ade80'], ['Class', `${data.className}-${data.section}`, '#86efac'], ['Blood', data.bloodGroup, '#f87171'], ['Phone', data.phone, '#86efac']].map(([k, v, c]) => (
          <div key={k} className="flex justify-between text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#22c55e08', border: '1px solid #22c55e30' }}>
            <span style={{ color: c as string, fontWeight: 700 }}>{k}</span>
            <span style={{ color: '#86efac' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex justify-between items-center px-2 py-2" style={{ borderTop: '1px solid #22c55e40' }}>
      <QR value={data.rollNo} size={26} />
      <div className="text-[6px] text-green-600/60 border-t border-green-600/30 w-12 text-center pt-0.5">Principal</div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// 53. Desert Sand
// ════════════════════════════════════════════
export const T53_DesertSand: React.FC<TemplateProps> = ({ data, school }) => (
  <div className="w-[2.125in] h-[3.375in] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #fefce8 0%, #fef9c3 100%)', boxSizing: 'border-box', borderRadius: '10px', border: '2px solid #d97706' }}>
    <div className="py-2 flex flex-col items-center" style={{ background: 'linear-gradient(90deg, #92400e 0%, #d97706 100%)' }}>
      <Logo url={school.logoUrl} cls="h-7 w-7 mb-0.5" />
      <h2 className="text-white text-[10px] font-bold text-center px-2">{school.schoolName}</h2>
    </div>
    <div className="flex flex-col items-center flex-1 pt-3 px-2 pb-2">
      <div className="w-16 h-16 rounded overflow-hidden border-2 mb-2 shadow" style={{ borderColor: '#d97706' }}>
        <Photo url={data.photoUrl} name={data.name} cls="w-full h-full" />
      </div>
      <h3 className="text-[12px] font-bold text-center uppercase text-amber-900">{data.name}</h3>
      <span className="text-white text-[7px] font-bold px-2 py-0.5 rounded-full mt-0.5 mb-2" style={{ background: '#d97706' }}>STUDENT</span>
      <div className="w-full space-y-1">
        {[['ID', data.rollNo], ['Class', `${data.className} - ${data.section}`], ['Blood', data.bloodGroup], ['Phone', data.phone]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[8px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            <span className="font-bold text-amber-700">{k}</span><span className="text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full items-end mt-2">
        <QR value={data.rollNo} size={26} />
        <Sign url={school.signatureUrl} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// BACKSIDE TEMPLATE (Universal)
// ════════════════════════════════════════════
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
        <QRCodeSVG value={JSON.stringify({ id: data.rollNo, name: data.name })} size={35} />
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════════
// TEMPLATE REGISTRY & MAPPING
// ════════════════════════════════════════════

export const TEMPLATES_LIST = [
  { id: 'template_01', name: 'Standard Vertical', category: 'Classic', isHorizontal: false },
  { id: 'template_02', name: 'Horizontal Corporate', category: 'Corporate', isHorizontal: true },
  { id: 'template_03', name: 'Gradient Premium', category: 'Premium', isHorizontal: false },
  { id: 'template_04', name: 'Royal Gold', category: 'Luxury', isHorizontal: false },
  { id: 'template_05', name: 'Ocean Wave', category: 'Nature', isHorizontal: false },
  { id: 'template_06', name: 'Emerald Nature', category: 'Nature', isHorizontal: false },
  { id: 'template_07', name: 'Neon Dark', category: 'Dark', isHorizontal: false },
  { id: 'template_08', name: 'Rose Elegance', category: 'Pastel', isHorizontal: false },
  { id: 'template_09', name: 'Sky Minimal', category: 'Minimal', isHorizontal: false },
  { id: 'template_10', name: 'Sunset Orange', category: 'Vibrant', isHorizontal: false },
  { id: 'template_11', name: 'Purple Mystic', category: 'Premium', isHorizontal: false },
  { id: 'template_12', name: 'Steel Corporate', category: 'Corporate', isHorizontal: true },
  { id: 'template_13', name: 'Floral Pastel', category: 'Pastel', isHorizontal: false },
  { id: 'template_14', name: 'Tech Blueprint', category: 'Dark', isHorizontal: false },
  { id: 'template_15', name: 'Sunshine Yellow', category: 'Vibrant', isHorizontal: false },
  { id: 'template_16', name: 'Crimson Banner', category: 'Corporate', isHorizontal: true },
  { id: 'template_17', name: 'Aurora Borealis', category: 'Nature', isHorizontal: false },
  { id: 'template_18', name: 'Geometric Modern', category: 'Modern', isHorizontal: false },
  { id: 'template_19', name: 'Classic Maroon', category: 'Classic', isHorizontal: false },
  { id: 'template_20', name: 'Glassmorphism', category: 'Premium', isHorizontal: false },
  { id: 'template_21', name: 'Indigo Stripe', category: 'Corporate', isHorizontal: true },
  { id: 'template_22', name: 'Teal Waves', category: 'Nature', isHorizontal: false },
  { id: 'template_23', name: 'Midnight Blue', category: 'Dark', isHorizontal: false },
  { id: 'template_24', name: 'Copper & Cream', category: 'Luxury', isHorizontal: false },
  { id: 'template_25', name: 'Vivid Diagonal', category: 'Modern', isHorizontal: true },
  { id: 'template_26', name: 'Warm Peach', category: 'Pastel', isHorizontal: false },
  { id: 'template_27', name: 'Slate Professional', category: 'Corporate', isHorizontal: true },
  { id: 'template_28', name: 'Vibrant Lime', category: 'Vibrant', isHorizontal: false },
  { id: 'template_29', name: 'Olive Military', category: 'Dark', isHorizontal: false },
  { id: 'template_30', name: 'Platinum Luxury', category: 'Luxury', isHorizontal: true },
  { id: 'template_31', name: 'Candy Pink', category: 'Pastel', isHorizontal: false },
  { id: 'template_32', name: 'Cobalt Shield', category: 'Classic', isHorizontal: false },
  { id: 'template_33', name: 'Forest Brown', category: 'Nature', isHorizontal: false },
  { id: 'template_34', name: 'Lavender Dreams', category: 'Pastel', isHorizontal: false },
  { id: 'template_35', name: 'Arctic Frost', category: 'Nature', isHorizontal: false },
  { id: 'template_36', name: 'Ruby Red', category: 'Corporate', isHorizontal: true },
  { id: 'template_37', name: 'Monochrome', category: 'Minimal', isHorizontal: false },
  { id: 'template_38', name: 'Tri-Color Flag', category: 'Classic', isHorizontal: false },
  { id: 'template_39', name: 'Gradient Cyan', category: 'Premium', isHorizontal: false },
  { id: 'template_40', name: 'Sunset Horizontal', category: 'Vibrant', isHorizontal: true },
  { id: 'template_41', name: 'Sapphire Diamond', category: 'Premium', isHorizontal: false },
  { id: 'template_42', name: 'Flame Warrior', category: 'Dark', isHorizontal: false },
  { id: 'template_43', name: 'Marine Navy', category: 'Corporate', isHorizontal: true },
  { id: 'template_44', name: 'Arctic Sunrise', category: 'Nature', isHorizontal: false },
  { id: 'template_45', name: 'Silver Minimal', category: 'Minimal', isHorizontal: false },
  { id: 'template_46', name: 'Cosmic Purple', category: 'Dark', isHorizontal: true },
  { id: 'template_47', name: 'Aquamarine', category: 'Nature', isHorizontal: false },
  { id: 'template_48', name: 'Carbon Fiber', category: 'Dark', isHorizontal: false },
  { id: 'template_49', name: 'Spring Blossom', category: 'Pastel', isHorizontal: false },
  { id: 'template_50', name: 'Retro Classic', category: 'Classic', isHorizontal: false },
  { id: 'template_51', name: 'Holographic Foil', category: 'Premium', isHorizontal: false },
  { id: 'template_52', name: 'Electric Green', category: 'Dark', isHorizontal: false },
  { id: 'template_53', name: 'Desert Sand', category: 'Vibrant', isHorizontal: false },
];

export const TEMPLATE_CATEGORIES = ['All', 'Classic', 'Corporate', 'Premium', 'Luxury', 'Nature', 'Dark', 'Pastel', 'Minimal', 'Modern', 'Vibrant'];

const COMPONENT_MAP: Record<string, React.FC<TemplateProps>> = {
  template_01: T01_StandardVertical,
  template_02: T02_HorizontalCorporate,
  template_03: T03_GradientPremium,
  template_04: T04_RoyalGold,
  template_05: T05_OceanWave,
  template_06: T06_EmeraldNature,
  template_07: T07_NeonDark,
  template_08: T08_RoseElegance,
  template_09: T09_SkyMinimal,
  template_10: T10_SunsetOrange,
  template_11: T11_PurpleMystic,
  template_12: T12_SteelCorporate,
  template_13: T13_FloralPastel,
  template_14: T14_TechBlueprint,
  template_15: T15_SunshineYellow,
  template_16: T16_CrimsonBanner,
  template_17: T17_AuroraBorealis,
  template_18: T18_GeometricModern,
  template_19: T19_ClassicMaroon,
  template_20: T20_Glassmorphism,
  template_21: T21_IndigoStripe,
  template_22: T22_TealWaves,
  template_23: T23_MidnightBlue,
  template_24: T24_CopperCream,
  template_25: T25_VividDiagonal,
  template_26: T26_WarmPeach,
  template_27: T27_SlateProfessional,
  template_28: T28_VibrantLime,
  template_29: T29_OliveMilitary,
  template_30: T30_PlatinumLuxury,
  template_31: T31_CandyPink,
  template_32: T32_CobaltShield,
  template_33: T33_ForestBrown,
  template_34: T34_LavenderDreams,
  template_35: T35_ArcticFrost,
  template_36: T36_RubyRed,
  template_37: T37_Monochrome,
  template_38: T38_TriColorFlag,
  template_39: T39_GradientCyan,
  template_40: T40_SunsetHorizontal,
  template_41: T41_SapphireDiamond,
  template_42: T42_FlameWarrior,
  template_43: T43_MarineNavy,
  template_44: T44_ArcticSunrise,
  template_45: T45_SilverMinimal,
  template_46: T46_CosmicPurple,
  template_47: T47_Aquamarine,
  template_48: T48_CarbonFiber,
  template_49: T49_SpringBlossom,
  template_50: T50_RetroClassic,
  template_51: T51_HolographicFoil,
  template_52: T52_ElectricGreen,
  template_53: T53_DesertSand,
};

export const getTemplateComponent = (id: string): React.FC<TemplateProps> => {
  return COMPONENT_MAP[id] || T01_StandardVertical;
};

export const getBacksideComponent = () => BacksideTemplate;
