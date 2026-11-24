import React from 'react';
import { format } from 'date-fns';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photo';

interface GatePassPrintProps {
  gatePass: any;
  schoolName?: string;
  onClose?: () => void;
}

/**
 * Generates self-contained HTML for the Gate Pass slip (2 copies on A4 landscape).
 */
export function buildGatePassHtml(gatePass: any, schoolName = 'JY SCHOOL'): string {
  if (!gatePass) return '';

  const isTeacher = gatePass.requestType === 'TEACHER';
  const personName = isTeacher ? gatePass.requester?.name : (gatePass.student?.user?.name || gatePass.requester?.name || 'N/A');
  const personRole = isTeacher ? 'Staff Member' : 'Student';
  const personId = isTeacher ? (gatePass.requester?.id?.substring(0, 8) || 'STAFF') : (gatePass.student?.rollNo || 'N/A');
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : (isTeacher ? (gatePass.requester?.designation || 'Staff') : 'N/A');
  const fatherName = gatePass.student?.fatherName || 'N/A';
  const designation = gatePass.requester?.designation || 'Staff Member';
  const mobile = isTeacher ? (gatePass.requester?.phone || 'N/A') : (gatePass.student?.mobileNumber || gatePass.student?.user?.phone || 'N/A');
  const photo = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;
  const resolvedPhotoUrl = getPhotoUrl(photo);
  const slipNo = gatePass.slipNumber || `GP-${(gatePass.id || '').substring(0, 6).toUpperCase() || '001'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(slipNo)}`;
  const dateFormatted = gatePass.createdAt 
    ? format(new Date(gatePass.createdAt), 'dd MMM yyyy') 
    : (gatePass.requestedDate ? format(new Date(gatePass.requestedDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy'));
  const approvedByName = gatePass.approvedBy?.name || 'Authorized Signatory';
  const reason = gatePass.reason || 'N/A';
  const destination = gatePass.destination || 'N/A';
  const exitTime = gatePass.exitTime || '--:--';
  const returnTime = gatePass.returnTime || '--:--';

  const renderSingleCopy = (copyTitle: string, isRight: boolean) => `
    <div class="slip-half ${isRight ? 'right' : ''}">
      <div class="slip-card">
        <!-- Header -->
        <div class="header-badge">
          <div class="school-info">
            <h1>${schoolName}</h1>
            <p>Official Campus Gate Pass Slip</p>
          </div>
          <div class="copy-pill">${copyTitle}</div>
        </div>

        <!-- Top Profile Row -->
        <div class="top-row">
          <div class="photo-box">
            ${resolvedPhotoUrl ? `<img src="${resolvedPhotoUrl}" alt="Photo" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span style="display:none;">PHOTO</span>` : `<span>NO PHOTO</span>`}
          </div>

          <div class="person-info">
            <div class="person-name">${personName}</div>
            <div class="person-role">${personRole} ${mobile !== 'N/A' ? `• Ph: ${mobile}` : ''}</div>
            <div class="slip-pill">Slip No: <b>${slipNo}</b></div>
          </div>

          <div class="qr-box">
            <img src="${qrCodeUrl}" alt="QR" />
          </div>
        </div>

        <!-- Details Grid -->
        <table class="details-table">
          <tbody>
            ${!isTeacher ? `
              <tr>
                <td class="label">Class & Section</td>
                <td class="value">${className}</td>
                <td class="label">Roll Number</td>
                <td class="value">${personId}</td>
              </tr>
              <tr>
                <td class="label">Father / Guardian</td>
                <td class="value" colspan="3">${fatherName}</td>
              </tr>
            ` : `
              <tr>
                <td class="label">Designation</td>
                <td class="value">${designation}</td>
                <td class="label">Staff ID</td>
                <td class="value">${personId}</td>
              </tr>
            `}
            <tr>
              <td class="label">Destination</td>
              <td class="value" colspan="3">${destination}</td>
            </tr>
            <tr>
              <td class="label">Reason</td>
              <td class="value" colspan="3" style="color:#b91c1c; font-weight:900;">${reason}</td>
            </tr>
            <tr>
              <td class="label">Exit Time</td>
              <td class="value" style="font-size:9.5pt; color:#0f172a;"><b>${exitTime}</b></td>
              <td class="label">Expected Return</td>
              <td class="value" style="font-size:9.5pt; color:#0f172a;"><b>${returnTime}</b></td>
            </tr>
            <tr>
              <td class="label">Date of Issue</td>
              <td class="value">${dateFormatted}</td>
              <td class="label">Pass Status</td>
              <td class="value" style="color:#059669; font-weight:900;">APPROVED</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures & Disclaimer -->
        <div>
          <div class="footer-signatures">
            <div class="sig-block">
              <div class="sig-name">${approvedByName}</div>
              <div class="sig-line"></div>
              <div class="sig-title">Authorized Signature</div>
            </div>
            <div class="sig-block">
              <div class="sig-name" style="min-height:16px;"></div>
              <div class="sig-line"></div>
              <div class="sig-title">Security Gate Stamp</div>
            </div>
          </div>
          <div class="disclaimer">
            * Valid only for the date & times specified. Present this slip to security at the gate upon exit & return.
          </div>
        </div>

      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gate Pass - ${slipNo}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      overflow: hidden;
    }
    .print-sheet {
      width: 297mm;
      height: 210mm;
      display: flex;
      flex-direction: row;
      background: #ffffff;
      overflow: hidden;
    }
    .slip-half {
      width: 148.5mm;
      height: 210mm;
      padding: 6mm 7mm;
      display: flex;
      flex-direction: column;
    }
    .slip-half.right {
      border-left: 2px dashed #94a3b8;
    }
    .slip-card {
      width: 100%;
      height: 100%;
      border: 2.5px solid #0f172a;
      border-radius: 12px;
      padding: 5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #ffffff;
    }
    .header-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 2.5mm;
      margin-bottom: 2.5mm;
    }
    .school-info h1 {
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      line-height: 1.1;
      letter-spacing: 0.5px;
    }
    .school-info p {
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .copy-pill {
      background: #0f172a;
      color: #ffffff;
      padding: 2mm 4.5mm;
      border-radius: 20px;
      font-size: 7.5pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .top-row {
      display: flex;
      align-items: center;
      gap: 3.5mm;
      margin-bottom: 2.5mm;
    }
    .photo-box {
      width: 25mm;
      height: 30mm;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-box span {
      font-size: 7pt;
      font-weight: 700;
      color: #94a3b8;
      text-align: center;
    }
    .person-info {
      flex: 1;
      min-width: 0;
    }
    .person-name {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 1mm;
    }
    .person-role {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 1.5mm;
    }
    .slip-pill {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1.2mm 3mm;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 800;
      color: #0f172a;
    }
    .qr-box {
      width: 25mm;
      height: 25mm;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 1mm;
      background: #ffffff;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2mm;
    }
    .details-table td {
      padding: 1.8mm 2mm;
      font-size: 8.5pt;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
    }
    .details-table td.label {
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      font-size: 7.5pt;
      width: 25%;
      letter-spacing: 0.3px;
    }
    .details-table td.value {
      font-weight: 700;
      color: #0f172a;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 2.5mm;
      margin-top: auto;
    }
    .sig-block {
      text-align: center;
      width: 44mm;
    }
    .sig-name {
      font-size: 8.5pt;
      font-weight: 800;
      color: #1e293b;
      min-height: 4mm;
    }
    .sig-line {
      border-bottom: 1.5px solid #0f172a;
      margin: 1.5mm 0;
    }
    .sig-title {
      font-size: 7pt;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .disclaimer {
      text-align: center;
      font-size: 6.5pt;
      font-weight: 600;
      color: #94a3b8;
      font-style: italic;
      margin-top: 1.5mm;
    }
  </style>
</head>
<body>
  <div class="print-sheet">
    ${renderSingleCopy(isTeacher ? 'STAFF COPY' : 'STUDENT COPY', false)}
    ${renderSingleCopy('SECURITY GATE COPY', true)}
  </div>
</body>
</html>`;
}

/**
 * Robust iframe printing method: Isolates the slip completely from the app's DOM
 * and Tailwind styles, preventing blank pages and multi-sheet overflow.
 */
export async function printGatePassSlip(gatePass: any, schoolName = 'JY SCHOOL') {
  if (!gatePass) return;

  const existing = document.getElementById('gate-pass-print-iframe');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'gate-pass-print-iframe';
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:297mm;height:100vh;border:0;opacity:0;pointer-events:none;z-index:-9999;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;

  const html = buildGatePassHtml(gatePass, schoolName);
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images (photo, QR code) to load
  await new Promise((resolve) => {
    const images = Array.from(doc.images);
    if (images.length === 0) {
      setTimeout(resolve, 300);
      return;
    }
    let loaded = 0;
    const onImgComplete = () => {
      loaded++;
      if (loaded >= images.length) resolve(true);
    };
    images.forEach(img => {
      if (img.complete) onImgComplete();
      else {
        img.onload = onImgComplete;
        img.onerror = onImgComplete;
      }
    });
    setTimeout(resolve, 600); // safety fallback timeout
  });

  if (doc.fonts) {
    try {
      await doc.fonts.ready;
    } catch {}
  }

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => iframe.remove(), 2500);
}

/**
 * GatePassPrint: Renders an interactive modal preview on screen and provides direct print buttons.
 */
export const GatePassPrint: React.FC<GatePassPrintProps> = ({ gatePass, schoolName = 'JY SCHOOL', onClose }) => {
  if (!gatePass) return null;

  const isTeacher = gatePass.requestType === 'TEACHER';
  const personName = isTeacher ? gatePass.requester?.name : (gatePass.student?.user?.name || gatePass.requester?.name || 'N/A');
  const personRole = isTeacher ? 'Staff Member' : 'Student';
  const personId = isTeacher ? (gatePass.requester?.id?.substring(0, 8) || 'STAFF') : (gatePass.student?.rollNo || 'N/A');
  const className = gatePass.student?.class ? `${gatePass.student.class.name} - ${gatePass.student.class.section}` : (isTeacher ? (gatePass.requester?.designation || 'Staff') : 'N/A');
  const fatherName = gatePass.student?.fatherName || 'N/A';
  const designation = gatePass.requester?.designation || 'Staff Member';
  const mobile = isTeacher ? (gatePass.requester?.phone || 'N/A') : (gatePass.student?.mobileNumber || gatePass.student?.user?.phone || 'N/A');
  const photo = isTeacher ? gatePass.requester?.photoUrl : gatePass.student?.user?.photoUrl;
  const resolvedPhotoUrl = getPhotoUrl(photo);
  const slipNo = gatePass.slipNumber || `GP-${(gatePass.id || '').substring(0, 6).toUpperCase() || '001'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(slipNo)}`;
  const dateFormatted = gatePass.createdAt 
    ? format(new Date(gatePass.createdAt), 'dd MMM yyyy') 
    : (gatePass.requestedDate ? format(new Date(gatePass.requestedDate), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy'));
  const approvedByName = gatePass.approvedBy?.name || 'Authorized Signatory';
  const reason = gatePass.reason || 'N/A';
  const destination = gatePass.destination || 'N/A';
  const exitTime = gatePass.exitTime || '--:--';
  const returnTime = gatePass.returnTime || '--:--';

  const handlePrint = () => {
    printGatePassSlip(gatePass, schoolName);
  };

  const renderCard = (copyTitle: string) => (
    <div className="bg-white border-2 border-slate-900 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1 min-w-[320px] max-w-[420px] h-[480px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{schoolName}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campus Gate Pass Slip</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
            {copyTitle}
          </span>
        </div>

        {/* Profile Row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
            {resolvedPhotoUrl ? (
              <img src={resolvedPhotoUrl} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-slate-400">NO PHOTO</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-black text-slate-900 text-sm truncate">{personName}</h4>
            <p className="text-xs font-semibold text-slate-500">{personRole} {mobile !== 'N/A' && `• ${mobile}`}</p>
            <div className="inline-block mt-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-black text-slate-800">
              Slip No: {slipNo}
            </div>
          </div>

          <div className="w-14 h-14 border border-slate-200 rounded-lg p-1 bg-white shrink-0">
            <img src={qrCodeUrl} alt="QR" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
          {!isTeacher ? (
            <>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Class / Roll</span>
                <span className="font-black text-slate-800">{className} {personId !== 'N/A' ? `(${personId})` : ''}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Father / Guardian</span>
                <span className="font-black text-slate-800 truncate max-w-[200px]">{fatherName}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Designation / ID</span>
              <span className="font-black text-slate-800">{designation} ({personId})</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Destination</span>
            <span className="font-black text-slate-800 truncate max-w-[200px]">{destination}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Reason</span>
            <span className="font-black text-rose-600 truncate max-w-[200px]">{reason}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-1">
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Exit:</span>
              <span className="font-black text-slate-800">{exitTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Return:</span>
              <span className="font-black text-slate-800">{returnTime}</span>
            </div>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Date of Issue</span>
            <span className="font-black text-slate-800">{dateFormatted}</span>
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-end text-center">
          <div className="w-28">
            <p className="text-[10px] font-black text-slate-800 mb-0.5 truncate">{approvedByName}</p>
            <div className="border-b border-slate-900 mb-1" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">Auth Signature</span>
          </div>
          <div className="w-28">
            <div className="h-3 border-b border-slate-900 mb-1" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">Security Stamp</span>
          </div>
        </div>
        <p className="text-[9px] text-center text-slate-400 italic mt-2">
          * Present slip at main gate upon exit & return
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Gate Pass Slip Preview
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {slipNo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official A4 Landscape Layout (Student Copy + Security Copy)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip (A4)</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Side-by-side slips */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full">
            {renderCard(isTeacher ? 'STAFF COPY' : 'STUDENT COPY')}
            {renderCard('SECURITY COPY')}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Ready to print on standard A4 paper in Landscape orientation.
          </p>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Gate Pass</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
