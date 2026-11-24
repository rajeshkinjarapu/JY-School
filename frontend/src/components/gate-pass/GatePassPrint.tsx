import React from 'react';
import { format } from 'date-fns';
import { getPhotoUrl } from '../../utils/photo';

export interface GatePassPrintData {
  id: string;
  slipNumber?: string;
  reason: string;
  destination?: string;
  exitTime?: string;
  returnTime?: string;
  notes?: string;
  requestType: string;
  status: string;
  requestedDate?: string;
  createdAt?: string;
  requester?: {
    id?: string;
    name?: string;
    role?: string;
    phone?: string;
    photoUrl?: string;
    designation?: string;
  };
  student?: {
    id?: string;
    rollNo?: string;
    fatherName?: string;
    mobileNumber?: string;
    user?: {
      name?: string;
      phone?: string;
      photoUrl?: string;
    };
    class?: {
      name?: string;
      section?: string;
    };
  };
  approvedBy?: {
    name?: string;
  };
}

export interface SchoolSettingsData {
  schoolName?: string;
  schoolSubtitle?: string;
  address?: string;
  logoUrl?: string;
  principalSignatureUrl?: string;
}

/**
 * printGatePassSlip
 * 100% Rock-Solid Iframe-Based Printing for Gate Pass (A4 Landscape, 2 Equal Copies)
 * Completely isolated from Tailwind, overflow constraints, dark mode, or DashboardLayout.
 * Guarantees EXACTLY 1 page on any printer or PDF export.
 */
export function printGatePassSlip(gatePass: GatePassPrintData, schoolSettings?: SchoolSettingsData) {
  if (!gatePass) return;

  const isTeacher = gatePass.requestType === 'TEACHER';
  const personName = isTeacher ? (gatePass.requester?.name || 'Staff Member') : (gatePass.student?.user?.name || 'Student Name');
  const personRole = isTeacher ? 'Staff Member' : 'Student';
  const personId = isTeacher ? (gatePass.requester?.id?.substring(0, 8) || 'N/A') : (gatePass.student?.rollNo || 'N/A');
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : 'N/A';
  const fatherName = gatePass.student?.fatherName || 'N/A';
  const mobile = isTeacher 
    ? (gatePass.requester?.phone || 'N/A') 
    : (gatePass.student?.mobileNumber || gatePass.student?.user?.phone || 'N/A');
  
  const rawPhoto = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;
  const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : '';
  const slipNo = gatePass.slipNumber || `GP-${gatePass.id?.substring(0, 6).toUpperCase()}`;

  const dateObj = gatePass.createdAt ? new Date(gatePass.createdAt) : new Date();
  const dateStr = format(dateObj, 'dd MMM yyyy');
  const timeStr = format(dateObj, 'hh:mm a');

  const exitTime = gatePass.exitTime || '--:--';
  const returnTime = gatePass.returnTime || '--:--';
  const reason = gatePass.reason || 'Official / Permitted Departure';
  const destination = gatePass.destination || 'Not Specified';
  const notes = gatePass.notes || '';
  const approverName = gatePass.approvedBy?.name || 'Authorized Signatory';

  const schoolName = schoolSettings?.schoolName || 'SRI VENKATESWARA JY SCHOOL';
  const schoolSubtitle = schoolSettings?.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)';
  const campusAddress = schoolSettings?.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta';
  const logoUrl = schoolSettings?.logoUrl ? getPhotoUrl(schoolSettings.logoUrl) : '/logo.png';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(slipNo)}`;

  const generateSingleCopyHtml = (copyTitle: string, isSecurityCopy: boolean) => `
    <div class="copy-box ${isSecurityCopy ? 'security-copy' : 'student-copy'}">
      <!-- Watermark Background -->
      <div class="watermark-text">${schoolName}</div>

      <!-- Top Header -->
      <div class="header-container">
        <div class="header-logo">
          <img src="${logoUrl}" onerror="this.style.display='none'" alt="Logo" />
        </div>
        <div class="header-titles">
          <h1 class="school-name">${schoolName}</h1>
          <p class="school-sub">${schoolSubtitle}</p>
          <p class="school-addr">${campusAddress}</p>
        </div>
        <div class="header-badge">
          <div class="slip-type-badge">${copyTitle}</div>
          <div class="slip-no-badge">PASS: <strong>#${slipNo}</strong></div>
        </div>
      </div>

      <!-- Meta Bar -->
      <div class="meta-strip">
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>Issued At:</strong> ${timeStr}</div>
        <div><strong>Type:</strong> <span class="role-tag">${personRole.toUpperCase()}</span></div>
        <div><strong>Status:</strong> <span class="status-tag">${gatePass.status || 'APPROVED'}</span></div>
      </div>

      <!-- Main Profile Section -->
      <div class="profile-section">
        <div class="photo-frame">
          ${photoUrl ? `<img src="${photoUrl}" onerror="this.src='/logo.png'" alt="Photo" />` : `<div class="no-photo">PHOTO</div>`}
        </div>
        <div class="profile-details">
          <div class="person-name">${personName}</div>
          <div class="profile-grid">
            ${!isTeacher ? `
              <div class="detail-item"><span class="label">Roll Number:</span> <span class="val font-mono">${personId}</span></div>
              <div class="detail-item"><span class="label">Class / Section:</span> <span class="val">${className}</span></div>
              <div class="detail-item"><span class="label">Father's Name:</span> <span class="val">${fatherName}</span></div>
              <div class="detail-item"><span class="label">Contact Phone:</span> <span class="val font-mono">${mobile}</span></div>
            ` : `
              <div class="detail-item"><span class="label">Employee ID:</span> <span class="val font-mono">${personId}</span></div>
              <div class="detail-item"><span class="label">Designation:</span> <span class="val">${gatePass.requester?.designation || 'Staff'}</span></div>
              <div class="detail-item"><span class="label">Contact Phone:</span> <span class="val font-mono">${mobile}</span></div>
              <div class="detail-item"><span class="label">Department:</span> <span class="val">Teaching Staff</span></div>
            `}
          </div>
        </div>
        <div class="qr-frame">
          <img src="${qrCodeUrl}" alt="QR" />
          <div class="qr-caption">${slipNo}</div>
        </div>
      </div>

      <!-- Movement Details Box -->
      <div class="movement-card">
        <div class="movement-row">
          <div class="movement-cell flex-2">
            <span class="m-label">Destination / Place of Visit:</span>
            <span class="m-val">${destination}</span>
          </div>
          <div class="movement-cell flex-1">
            <span class="m-label">Exit (Out) Time:</span>
            <span class="m-val highlight-time">${exitTime}</span>
          </div>
          <div class="movement-cell flex-1">
            <span class="m-label">Expected Return:</span>
            <span class="m-val highlight-time">${returnTime}</span>
          </div>
        </div>
        <div class="movement-row border-top">
          <div class="movement-cell flex-full">
            <span class="m-label">Reason for Departure / Notes:</span>
            <span class="m-val">${reason}${notes ? ` (${notes})` : ''}</span>
          </div>
        </div>
      </div>

      <!-- Signatures Footer -->
      <div class="signature-section">
        <div class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-title">Class Teacher / Parent</div>
        </div>
        <div class="sig-col">
          <div class="approver-name">${approverName}</div>
          <div class="sig-line"></div>
          <div class="sig-title">Principal / Admin Sign</div>
        </div>
        <div class="sig-col">
          <div class="stamp-box">SECURITY STAMP / TIME OUT</div>
          <div class="sig-title">Gate Security Guard</div>
        </div>
      </div>

      <!-- Footer Disclaimer -->
      <div class="card-footer">
        <span>* Valid only for the date and time specified. Security must retain the Security Copy at gate entrance.</span>
      </div>
    </div>
  `;

  // Create isolated iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:297mm;height:210mm;border:0;opacity:0;pointer-events:none;z-index:-9999;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gate Pass - ${slipNo}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 6mm 8mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff !important;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-sheet {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 281mm;
      height: 196mm;
      margin: 0 auto;
      gap: 6mm;
    }
    .copy-box {
      flex: 1;
      width: 137mm;
      height: 196mm;
      border: 2px solid #0f172a;
      border-radius: 10px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #ffffff;
      overflow: hidden;
    }
    .cut-divider {
      width: 0;
      border-left: 2px dashed #94a3b8;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .scissor-label {
      position: absolute;
      background: #ffffff;
      padding: 6px 2px;
      color: #64748b;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      transform: rotate(90deg);
      white-space: nowrap;
    }
    .watermark-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 26px;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.035);
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }
    .header-container {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      position: relative;
      z-index: 1;
    }
    .header-logo {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .header-titles {
      flex: 1;
      line-height: 1.2;
    }
    .school-name {
      font-size: 13px;
      font-weight: 900;
      color: #0b1a33;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .school-sub {
      font-size: 8.5px;
      font-weight: 700;
      color: #b45309;
    }
    .school-addr {
      font-size: 7.5px;
      font-weight: 600;
      color: #475569;
    }
    .header-badge {
      text-align: right;
      flex-shrink: 0;
    }
    .slip-type-badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 8px;
      font-weight: 900;
      padding: 3px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .slip-no-badge {
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .meta-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 8.5px;
      color: #334155;
      font-weight: 600;
      margin-top: 4px;
      border: 1px solid #e2e8f0;
      position: relative;
      z-index: 1;
    }
    .role-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 800;
      font-size: 7.5px;
    }
    .status-tag {
      background: #dcfce7;
      color: #166534;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 800;
      font-size: 7.5px;
    }
    .profile-section {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 6px;
      position: relative;
      z-index: 1;
    }
    .photo-frame {
      width: 68px;
      height: 82px;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .no-photo {
      font-size: 8px;
      font-weight: 800;
      color: #94a3b8;
    }
    .profile-details {
      flex: 1;
    }
    .person-name {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 6px;
      font-size: 8.5px;
    }
    .detail-item {
      display: flex;
      gap: 4px;
    }
    .detail-item .label {
      color: #64748b;
      font-weight: 700;
      font-size: 8px;
    }
    .detail-item .val {
      color: #0f172a;
      font-weight: 800;
    }
    .qr-frame {
      width: 62px;
      flex-shrink: 0;
      text-align: center;
    }
    .qr-frame img {
      width: 54px;
      height: 54px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 1px;
    }
    .qr-caption {
      font-size: 7px;
      font-weight: 800;
      color: #475569;
      font-family: monospace;
      margin-top: 1px;
    }
    .movement-card {
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      background: #fafafa;
      margin-top: 6px;
      overflow: hidden;
      font-size: 8.5px;
      position: relative;
      z-index: 1;
    }
    .movement-row {
      display: flex;
      padding: 4px 8px;
    }
    .movement-row.border-top {
      border-top: 1px solid #e2e8f0;
    }
    .movement-cell {
      display: flex;
      flex-direction: column;
    }
    .movement-cell.flex-1 { flex: 1; }
    .movement-cell.flex-2 { flex: 2; }
    .movement-cell.flex-full { flex: 100%; }
    .m-label {
      font-size: 7px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .m-val {
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
    }
    .highlight-time {
      color: #b91c1c;
      font-weight: 900;
      font-size: 9.5px;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 8px;
      padding: 0 4px;
      position: relative;
      z-index: 1;
    }
    .sig-col {
      text-align: center;
      width: 30%;
    }
    .sig-line {
      border-bottom: 1.5px solid #0f172a;
      margin-bottom: 2px;
      height: 12px;
    }
    .approver-name {
      font-size: 8px;
      font-weight: 800;
      color: #0b1a33;
      margin-bottom: 1px;
    }
    .stamp-box {
      border: 1px dashed #64748b;
      border-radius: 3px;
      padding: 4px;
      font-size: 7px;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 2px;
      background: #f8fafc;
    }
    .sig-title {
      font-size: 7.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
    }
    .card-footer {
      text-align: center;
      font-size: 6.5px;
      color: #64748b;
      font-weight: 600;
      margin-top: 4px;
      border-top: 1px solid #e2e8f0;
      padding-top: 2px;
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    ${generateSingleCopyHtml('STUDENT / PARENT COPY', false)}
    <div class="cut-divider">
      <div class="scissor-label">✂ CUT HERE ✂</div>
    </div>
    ${generateSingleCopyHtml('SECURITY GATE COPY', true)}
  </div>
</body>
</html>`);
  doc.close();

  // Wait for images and fonts to settle, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print error:', e);
    } finally {
      setTimeout(() => {
        try {
          iframe.remove();
        } catch (_) {}
      }, 3000);
    }
  }, 400);
}

/**
 * GatePassPrint Component
 * Renders an exact preview modal on screen
 */
export const GatePassPrint: React.FC<{
  gatePass: GatePassPrintData;
  schoolSettings?: SchoolSettingsData;
  onPrint?: () => void;
  onClose?: () => void;
}> = ({ gatePass, schoolSettings, onPrint, onClose }) => {
  if (!gatePass) return null;

  const isTeacher = gatePass.requestType === 'TEACHER';
  const personName = isTeacher ? (gatePass.requester?.name || 'Staff Member') : (gatePass.student?.user?.name || 'Student Name');
  const personRole = isTeacher ? 'Staff' : 'Student';
  const personId = isTeacher ? (gatePass.requester?.id?.substring(0, 8) || 'N/A') : (gatePass.student?.rollNo || 'N/A');
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : 'N/A';
  const fatherName = gatePass.student?.fatherName || 'N/A';
  const mobile = isTeacher 
    ? (gatePass.requester?.phone || 'N/A') 
    : (gatePass.student?.mobileNumber || gatePass.student?.user?.phone || 'N/A');
  
  const rawPhoto = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;
  const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : '';
  const slipNo = gatePass.slipNumber || `GP-${gatePass.id?.substring(0, 6).toUpperCase()}`;

  const schoolName = schoolSettings?.schoolName || 'SRI VENKATESWARA JY SCHOOL';
  const schoolSubtitle = schoolSettings?.schoolSubtitle || '(IIT-JEE / NEET Foundation – Olympiads)';
  const campusAddress = schoolSettings?.address || 'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta';

  const renderSinglePreview = (copyTitle: string) => (
    <div className="flex-1 border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between bg-white shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">{schoolName}</h2>
          <p className="text-[10px] font-bold text-amber-600">{schoolSubtitle}</p>
          <p className="text-[9px] text-slate-500 font-semibold">{campusAddress}</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
            {copyTitle}
          </span>
          <div className="text-[10px] font-black text-slate-900 mt-1">#{slipNo}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] my-2 font-bold text-slate-600">
        <div>Date: {gatePass.createdAt ? format(new Date(gatePass.createdAt), 'dd MMM yyyy') : '--'}</div>
        <div>Role: <span className="text-indigo-600 uppercase">{personRole}</span></div>
        <div>Status: <span className="text-emerald-600">{gatePass.status}</span></div>
      </div>

      {/* Profile */}
      <div className="flex gap-3 my-2 items-start">
        <div className="w-16 h-20 border border-slate-300 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-slate-400">NO PHOTO</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-slate-900 uppercase truncate">{personName}</div>
          <div className="grid grid-cols-2 gap-1 text-[10px] mt-1.5 font-semibold text-slate-600">
            <div><span className="text-slate-400">Roll:</span> <strong className="text-slate-800">{personId}</strong></div>
            <div><span className="text-slate-400">Class:</span> <strong className="text-slate-800">{className}</strong></div>
            <div><span className="text-slate-400">Father:</span> <strong className="text-slate-800 truncate">{fatherName}</strong></div>
            <div><span className="text-slate-400">Phone:</span> <strong className="text-slate-800">{mobile}</strong></div>
          </div>
        </div>
      </div>

      {/* Movement Details */}
      <div className="border border-slate-200 rounded-xl bg-slate-50/80 p-2.5 text-[10px] space-y-1 my-2">
        <div className="flex justify-between">
          <div><span className="text-slate-400">Destination:</span> <strong className="text-slate-800 ml-1">{gatePass.destination || 'N/A'}</strong></div>
          <div className="flex gap-3">
            <div><span className="text-slate-400">Out:</span> <strong className="text-rose-600 font-black ml-1">{gatePass.exitTime || '--:--'}</strong></div>
            <div><span className="text-slate-400">Return:</span> <strong className="text-rose-600 font-black ml-1">{gatePass.returnTime || '--:--'}</strong></div>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-1">
          <span className="text-slate-400">Reason:</span> <strong className="text-slate-800 ml-1">{gatePass.reason}</strong>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-600 text-center">
        <div>
          <div className="border-b border-slate-400 w-20 mb-1"></div>
          <span>Class Teacher</span>
        </div>
        <div>
          <div className="text-slate-800 text-[8px] font-black">{gatePass.approvedBy?.name || 'Administrator'}</div>
          <div className="border-b border-slate-900 w-24 mb-1"></div>
          <span>Principal / Admin</span>
        </div>
        <div>
          <div className="border border-dashed border-slate-300 rounded px-2 py-1 text-[8px] mb-1">STAMP / EXIT</div>
          <span>Security Gate</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto bg-slate-100 p-4 rounded-3xl border border-slate-200">
        {renderSinglePreview('STUDENT / PARENT COPY')}
        <div className="hidden lg:flex flex-col justify-center items-center">
          <div className="h-full border-l-2 border-dashed border-slate-400 relative">
            <span className="absolute top-1/2 -left-3 bg-white px-1 py-1 rounded text-[10px] font-bold text-slate-500 transform -translate-y-1/2 rotate-90 whitespace-nowrap">
              ✂ CUT HERE ✂
            </span>
          </div>
        </div>
        {renderSinglePreview('SECURITY GATE COPY')}
      </div>
    </div>
  );
};
