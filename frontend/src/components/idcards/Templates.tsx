import React from 'react';

const QRCodeSVG: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 28,
  className = '',
}) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(size * 2)}x${Math.round(size * 2)}&data=${encodeURIComponent(value || 'ID')}`;
  return (
    <img
      src={qrUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
};

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
  dob?: string;
  roleLabel?: string; // e.g. 'STUDENT', 'TEACHER', 'ADMIN', 'ACCOUNTANT', 'TRANSPORT MGR', 'SECURITY'
  designation?: string; // e.g. Qualification / Specialization for Staff
  academicYear?: string;
}

export interface SchoolInfo {
  schoolName: string;
  address: string;
  phone: string;
  logoUrl?: string;
  signatureUrl?: string;
  academicYear?: string;
}

export interface IDCardDisplayOptions {
  showQr?: boolean;
  showBloodGroup?: boolean;
  showFatherName?: boolean;
  showPhone?: boolean;
}

export interface TemplateProps {
  data: IDCardData;
  school: SchoolInfo;
  colorPrimary?: string;
  colorSecondary?: string;
  options?: IDCardDisplayOptions;
  isHorizontal?: boolean;
}

export const ID_COLOR_THEMES = [
  { id: 'royal', name: 'Royal Navy & Gold', primary: '#1e3a8a', secondary: '#f59e0b' },
  { id: 'indigo', name: 'Scholar Indigo', primary: '#4338ca', secondary: '#0ea5e9' },
  { id: 'emerald', name: 'Campus Emerald', primary: '#065f46', secondary: '#10b981' },
  { id: 'crimson', name: 'Heritage Crimson', primary: '#9f1239', secondary: '#f97316' },
];

const getRoleBadgeText = (data: IDCardData) =>
  (data.roleLabel || 'STUDENT').toUpperCase();

const isStaffCard = (data: IDCardData) =>
  Boolean(data.roleLabel && data.roleLabel.toUpperCase() !== 'STUDENT');

// 1. Standard Vertical (CR-80 Portrait)
export const StandardVertical: React.FC<TemplateProps> = ({
  data,
  school,
  colorPrimary = '#1e3a8a',
  colorSecondary = '#f59e0b',
  options = {},
}) => {
  const showQr = options.showQr !== false;
  const showBlood = options.showBloodGroup !== false;
  const showFather = options.showFatherName !== false;
  const showPhone = options.showPhone !== false;
  const staffMode = isStaffCard(data);

  return (
    <div
      className="w-[2.125in] h-[3.375in] bg-white border border-slate-300 rounded-xl shadow-sm flex flex-col overflow-hidden relative"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="flex flex-col items-center justify-center py-2 px-2" style={{ backgroundColor: colorPrimary }}>
        <div className="flex items-center gap-1.5 justify-center w-full">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt="logo" className="h-7 w-7 object-contain rounded bg-white p-0.5 shrink-0" />
          ) : (
            <div className="h-7 w-7 bg-white rounded-full flex items-center justify-center shrink-0">
              <span className="text-[8px] font-black" style={{ color: colorPrimary }}>JY</span>
            </div>
          )}
          <h2 className="text-white text-[10px] font-extrabold text-center leading-tight line-clamp-2 uppercase">
            {school.schoolName}
          </h2>
        </div>
        {(data.academicYear || school.academicYear) && (
          <span className="text-[7px] font-bold tracking-widest uppercase text-white/85 mt-0.5">
            Session {data.academicYear || school.academicYear}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center px-2.5 pt-2 pb-1">
        <div className="w-[68px] h-[78px] border-2 p-0.5 rounded-md mb-1.5 bg-slate-50" style={{ borderColor: colorSecondary }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover rounded-sm" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[9px] font-bold">
              No Photo
            </div>
          )}
        </div>

        <h3 className="text-[11px] font-black text-slate-900 text-center uppercase leading-tight line-clamp-1">
          {data.name}
        </h3>
        <span
          className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white mt-0.5 mb-1"
          style={{ backgroundColor: colorPrimary }}
        >
          {getRoleBadgeText(data)}
        </span>

        <div className="w-full space-y-0.5 mt-0.5 text-[8.5px] text-slate-700">
          <p className="flex justify-between gap-1">
            <span className="font-bold text-slate-500">{staffMode ? 'Emp ID:' : 'Roll No:'}</span>
            <span className="font-extrabold text-slate-900 truncate">{data.rollNo}</span>
          </p>
          <p className="flex justify-between gap-1">
            <span className="font-bold text-slate-500">{staffMode ? 'Dept:' : 'Class:'}</span>
            <span className="font-bold truncate">
              {staffMode ? (data.designation || data.className || 'Faculty') : `${data.className}${data.section ? ` - ${data.section}` : ''}`}
            </span>
          </p>
          {showFather && !staffMode && data.fatherName && (
            <p className="flex justify-between gap-1">
              <span className="font-bold text-slate-500">Father:</span>
              <span className="font-semibold truncate">{data.fatherName}</span>
            </p>
          )}
          {data.dob && (
            <p className="flex justify-between gap-1">
              <span className="font-bold text-slate-500">DOB:</span>
              <span className="font-semibold">{data.dob}</span>
            </p>
          )}
          {showBlood && (
            <p className="flex justify-between gap-1">
              <span className="font-bold text-slate-500">Blood:</span>
              <span className="text-rose-600 font-black">{data.bloodGroup || 'N/A'}</span>
            </p>
          )}
          {showPhone && (
            <p className="flex justify-between gap-1">
              <span className="font-bold text-slate-500">Phone:</span>
              <span className="font-semibold">{data.phone || 'N/A'}</span>
            </p>
          )}
        </div>
      </div>

      <div className="h-10 w-full flex items-center justify-between px-2.5 py-1" style={{ backgroundColor: colorSecondary }}>
        <div className="flex flex-col items-center">
          {school.signatureUrl ? (
            <img src={school.signatureUrl} alt="sign" className="h-5 object-contain" />
          ) : (
            <div className="h-5 flex items-end">
              <span className="text-[7px] font-bold text-slate-900 border-t border-slate-800 w-12 text-center">Principal</span>
            </div>
          )}
        </div>
        {showQr && (
          <div className="bg-white p-0.5 rounded shadow-xs">
            <QRCodeSVG value={data.rollNo} size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Horizontal Corporate (CR-80 Landscape)
export const HorizontalCorporate: React.FC<TemplateProps> = ({
  data,
  school,
  colorPrimary = '#1e3a8a',
  colorSecondary = '#0ea5e9',
  options = {},
}) => {
  const showQr = options.showQr !== false;
  const showBlood = options.showBloodGroup !== false;
  const showPhone = options.showPhone !== false;
  const staffMode = isStaffCard(data);

  return (
    <div
      className="w-[3.375in] h-[2.125in] bg-white border border-slate-300 rounded-xl shadow-sm flex overflow-hidden relative"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="w-2.5 shrink-0" style={{ backgroundColor: colorSecondary }} />
      <div className="flex-1 p-2.5 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-1.5">
          <div className="min-w-0">
            <h2 className="text-[11px] font-black leading-tight uppercase truncate" style={{ color: colorPrimary }}>
              {school.schoolName}
            </h2>
            <p className="text-[7px] text-slate-500 w-44 leading-tight line-clamp-1 mt-0.5">{school.address}</p>
          </div>
          {school.logoUrl ? (
            <img src={school.logoUrl} alt="logo" className="h-7 w-7 object-contain shrink-0" />
          ) : (
            <div className="h-7 w-7 bg-slate-100 rounded flex items-center justify-center shrink-0">
              <span className="text-[7px] font-black text-slate-500">LOGO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 my-auto pt-1">
          <div className="w-16 h-[74px] border border-slate-200 p-0.5 bg-slate-50 rounded-md shrink-0">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover rounded-sm" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[8px] font-bold">
                Photo
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="text-[11px] font-black text-slate-900 uppercase truncate">{data.name}</h3>
            <p className="text-[7.5px] font-black uppercase tracking-wider mb-1" style={{ color: colorPrimary }}>
              {getRoleBadgeText(data)} {data.academicYear || school.academicYear ? `• ${data.academicYear || school.academicYear}` : ''}
            </p>
            <div className="space-y-0.5 text-[8px] text-slate-700">
              <p className="flex"><span className="font-bold text-slate-500 w-11">{staffMode ? 'Emp ID:' : 'ID No:'}</span> <span className="font-extrabold truncate">{data.rollNo}</span></p>
              <p className="flex"><span className="font-bold text-slate-500 w-11">{staffMode ? 'Role:' : 'Class:'}</span> <span className="font-bold truncate">{staffMode ? (data.designation || data.className) : `${data.className}${data.section ? ` - ${data.section}` : ''}`}</span></p>
              {showPhone && <p className="flex"><span className="font-bold text-slate-500 w-11">Phone:</span> <span className="font-semibold">{data.phone || 'N/A'}</span></p>}
              {showBlood && <p className="flex"><span className="font-bold text-slate-500 w-11">Blood:</span> <span className="font-black text-rose-600">{data.bloodGroup || 'N/A'}</span></p>}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 right-2.5 flex flex-col items-end">
        {showQr && <QRCodeSVG value={`ID:${data.rollNo}`} size={28} className="mb-1" />}
        {school.signatureUrl ? (
          <img src={school.signatureUrl} alt="sign" className="h-4 object-contain" />
        ) : (
          <div className="border-t border-slate-400 w-12 text-center text-[6px] pt-[1px] text-slate-500 italic mt-1">
            Principal
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Gradient Premium (CR-80 Portrait)
export const GradientPremium: React.FC<TemplateProps> = ({
  data,
  school,
  colorPrimary = '#1e3a8a',
  colorSecondary = '#7e22ce',
  options = {},
}) => {
  const showQr = options.showQr !== false;
  const showBlood = options.showBloodGroup !== false;
  const showPhone = options.showPhone !== false;
  const staffMode = isStaffCard(data);

  return (
    <div
      className="w-[2.125in] h-[3.375in] border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorSecondary} 100%)`, boxSizing: 'border-box' }}
    >
      <div className="flex items-center justify-center gap-1.5 pt-2.5 px-2 z-10">
        {school.logoUrl && (
          <img src={school.logoUrl} alt="logo" className="h-5 w-5 object-contain rounded bg-white p-0.5 shrink-0" />
        )}
        <h2 className="text-white text-[10px] font-extrabold text-center tracking-wide uppercase line-clamp-1">
          {school.schoolName}
        </h2>
      </div>

      <div className="flex-1 bg-white mt-7 rounded-t-[26px] flex flex-col items-center px-3 pt-9 pb-2 relative shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="absolute -top-9 w-[72px] h-[72px] rounded-full border-4 border-white overflow-hidden shadow-md bg-slate-50">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">Photo</div>
          )}
        </div>

        <h3 className="text-[11.5px] font-black text-slate-900 text-center uppercase leading-tight line-clamp-1 mb-0.5">
          {data.name}
        </h3>
        <span
          className="text-white text-[7px] font-black px-2.5 py-0.5 rounded-full mb-1.5 uppercase tracking-wider"
          style={{ background: `linear-gradient(90deg, ${colorPrimary}, ${colorSecondary})` }}
        >
          {getRoleBadgeText(data)}
        </span>

        <div className="w-full space-y-1 mb-auto">
          <div className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase">{staffMode ? 'Emp ID' : 'Roll No'}</span>
            <span className="text-[8.5px] font-extrabold text-slate-900">{data.rollNo}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded">
            <span className="text-[7.5px] font-bold text-slate-500 uppercase">{staffMode ? 'Dept' : 'Class'}</span>
            <span className="text-[8.5px] font-bold text-slate-900 truncate max-w-[95px]">
              {staffMode ? (data.designation || data.className) : `${data.className}${data.section ? ` - ${data.section}` : ''}`}
            </span>
          </div>
          {showBlood && (
            <div className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase">Blood</span>
              <span className="text-[8.5px] font-black text-rose-600">{data.bloodGroup || 'N/A'}</span>
            </div>
          )}
          {showPhone && (
            <div className="flex justify-between items-center bg-slate-50 px-1.5 py-0.5 rounded">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase">Phone</span>
              <span className="text-[8.5px] font-bold text-slate-800">{data.phone || 'N/A'}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between w-full items-end mt-1.5">
          {showQr ? (
            <div className="bg-white p-0.5 border border-slate-200 rounded">
              <QRCodeSVG value={data.rollNo} size={24} />
            </div>
          ) : <div />}
          <div className="text-center">
            {school.signatureUrl ? (
              <img src={school.signatureUrl} alt="sign" className="h-5 object-contain" />
            ) : (
              <div className="border-t border-slate-400 w-14 text-center mt-3">
                <span className="text-[7px] text-slate-500 font-semibold">Principal</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Modern Academic Lanyard (CR-80 Portrait)
export const ModernLanyard: React.FC<TemplateProps> = ({
  data,
  school,
  colorPrimary = '#065f46',
  colorSecondary = '#10b981',
  options = {},
}) => {
  const showQr = options.showQr !== false;
  const showBlood = options.showBloodGroup !== false;
  const showFather = options.showFatherName !== false;
  const showPhone = options.showPhone !== false;
  const staffMode = isStaffCard(data);

  return (
    <div
      className="w-[2.125in] h-[3.375in] bg-white border border-slate-300 rounded-xl shadow-sm flex flex-col overflow-hidden relative"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Lanyard slot + accent header */}
      <div className="pt-2 pb-2.5 px-2.5 text-white text-center relative" style={{ backgroundColor: colorPrimary }}>
        <div className="w-8 h-1.5 bg-white/35 rounded-full mx-auto mb-1.5" />
        <div className="flex items-center justify-center gap-1.5">
          {school.logoUrl && (
            <img src={school.logoUrl} alt="logo" className="h-6 w-6 object-contain rounded bg-white p-0.5 shrink-0" />
          )}
          <h2 className="text-[9.5px] font-black uppercase leading-tight line-clamp-1">{school.schoolName}</h2>
        </div>
        <p className="text-[7px] font-bold tracking-widest uppercase text-white/80 mt-0.5">
          Official Identity Card • {data.academicYear || school.academicYear || '2026-27'}
        </p>
      </div>

      <div className="h-1 w-full" style={{ backgroundColor: colorSecondary }} />

      <div className="flex-1 flex flex-col items-center px-3 pt-2.5 pb-2">
        <div className="w-[66px] h-[74px] rounded-xl border-2 overflow-hidden bg-slate-50 shadow-xs mb-1.5" style={{ borderColor: colorPrimary }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400">Photo</div>
          )}
        </div>

        <h3 className="text-[11px] font-black text-slate-900 uppercase text-center leading-tight line-clamp-1">
          {data.name}
        </h3>
        <span
          className="text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 mt-0.5 mb-1.5"
          style={{ color: colorPrimary }}
        >
          {getRoleBadgeText(data)}
        </span>

        <div className="w-full space-y-0.5 text-[8px] text-slate-700 border-t border-slate-100 pt-1">
          <p className="flex justify-between"><span className="font-bold text-slate-500">{staffMode ? 'Emp ID' : 'Roll No'}</span><span className="font-black text-slate-900">{data.rollNo}</span></p>
          <p className="flex justify-between"><span className="font-bold text-slate-500">{staffMode ? 'Dept' : 'Class'}</span><span className="font-bold truncate max-w-[100px]">{staffMode ? (data.designation || data.className) : `${data.className}${data.section ? ` - ${data.section}` : ''}`}</span></p>
          {showFather && !staffMode && data.fatherName && (
            <p className="flex justify-between"><span className="font-bold text-slate-500">Parent</span><span className="font-semibold truncate max-w-[100px]">{data.fatherName}</span></p>
          )}
          {showPhone && <p className="flex justify-between"><span className="font-bold text-slate-500">Contact</span><span className="font-semibold">{data.phone || 'N/A'}</span></p>}
          {showBlood && <p className="flex justify-between"><span className="font-bold text-slate-500">Blood</span><span className="font-black text-rose-600">{data.bloodGroup || 'N/A'}</span></p>}
        </div>

        <div className="mt-auto w-full flex items-end justify-between pt-1">
          <div>
            {school.signatureUrl ? (
              <img src={school.signatureUrl} alt="sign" className="h-4 object-contain" />
            ) : (
              <span className="text-[6.5px] font-bold text-slate-500 border-t border-slate-300 px-1 pt-0.5">Principal</span>
            )}
          </div>
          {showQr && <QRCodeSVG value={data.rollNo} size={24} />}
        </div>
      </div>
    </div>
  );
};

// 5. Backside Template (Adapts to Portrait OR Landscape!)
export const BacksideTemplate: React.FC<TemplateProps> = ({
  data,
  school,
  colorPrimary = '#1e3a8a',
  isHorizontal = false,
}) => {
  if (isHorizontal) {
    return (
      <div
        className="w-[3.375in] h-[2.125in] bg-white border border-slate-300 rounded-xl shadow-sm flex flex-col overflow-hidden"
        style={{ boxSizing: 'border-box' }}
      >
        <div className="py-1.5 px-3 flex items-center justify-between text-white" style={{ backgroundColor: colorPrimary }}>
          <h3 className="text-[9px] font-black uppercase tracking-wider">Emergency &amp; Campus Instructions</h3>
          <span className="text-[8px] font-bold opacity-90">{data.rollNo}</span>
        </div>
        <div className="flex-1 p-2.5 flex gap-3 items-center">
          <div className="flex-1 space-y-1.5 text-[7.5px] text-slate-700">
            <ul className="list-disc pl-3 space-y-0.5 leading-snug">
              <li>This card is property of <strong>{school.schoolName}</strong> &amp; non-transferable.</li>
              <li>Must be displayed visibly inside campus &amp; school buses.</li>
              <li>If found, kindly return to the school office or call emergency helpline.</li>
            </ul>
            {data.address && (
              <p className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[7px] text-slate-700 line-clamp-2">
                <strong>Residence:</strong> {data.address}
              </p>
            )}
            <div className="pt-0.5 border-t border-dashed border-slate-300 text-[7px] text-slate-700">
              <p className="font-bold text-slate-900">{school.schoolName}</p>
              <p className="line-clamp-1 text-slate-500">{school.address}</p>
              <p className="font-bold" style={{ color: colorPrimary }}>Office Ph: {school.phone}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <QRCodeSVG value={JSON.stringify({ id: data.rollNo, name: data.name })} size={46} />
            <span className="text-[6.5px] font-bold text-slate-500 mt-1 uppercase">Scan Verify</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[2.125in] h-[3.375in] bg-white border border-slate-300 rounded-xl shadow-sm flex flex-col overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="py-2 text-center" style={{ backgroundColor: colorPrimary }}>
        <h3 className="text-white text-[9.5px] font-black uppercase tracking-wider">Terms &amp; Return Info</h3>
      </div>
      <div className="flex-1 p-3 flex flex-col">
        <ul className="text-[7.5px] text-slate-700 list-disc pl-3 space-y-1 text-justify pr-1">
          <li>This card is official property of <strong>{school.schoolName}</strong>.</li>
          <li>Must be worn at all times inside campus &amp; transport vehicles.</li>
          <li>If lost, report immediately to the school administration office.</li>
          <li>This card is strictly non-transferable.</li>
        </ul>

        {data.address && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-[7px] text-slate-700">
            <p className="font-bold text-slate-500 uppercase text-[6.5px]">Holder Address</p>
            <p className="line-clamp-2 leading-tight">{data.address}</p>
          </div>
        )}

        <div className="mt-auto border-t border-dashed border-slate-300 pt-2 text-[7.5px] text-slate-800 text-center">
          <p className="font-bold text-slate-500 uppercase text-[6.5px] mb-0.5">If found, return to:</p>
          <p className="font-black text-[8.5px] leading-tight">{school.schoolName}</p>
          <p className="leading-tight text-slate-500 mt-0.5 line-clamp-2">{school.address}</p>
          <p className="mt-1 font-bold" style={{ color: colorPrimary }}>Ph: {school.phone}</p>
        </div>

        <div className="mt-2 flex justify-center">
          <QRCodeSVG value={JSON.stringify({ id: data.rollNo, name: data.name })} size={34} />
        </div>
      </div>
    </div>
  );
};

// Mapping to access templates easily
export const getTemplateComponent = (id: string) => {
  switch (id) {
    case 'template_1':
      return StandardVertical;
    case 'template_2':
      return HorizontalCorporate;
    case 'template_3':
      return GradientPremium;
    case 'template_4':
      return ModernLanyard;
    default:
      return StandardVertical;
  }
};

export const getBacksideComponent = () => {
  return BacksideTemplate;
};

export const TEMPLATES_LIST = [
  { id: 'template_1', name: 'Classic Royal Vertical', badge: 'Most Popular', isHorizontal: false },
  { id: 'template_2', name: 'Horizontal Corporate', badge: 'Landscape CR-80', isHorizontal: true },
  { id: 'template_3', name: 'Gradient Scholar', badge: 'Modern Curve', isHorizontal: false },
  { id: 'template_4', name: 'Campus Lanyard Pro', badge: 'Session Strip', isHorizontal: false },
];
