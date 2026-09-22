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

  // ─── DATA ────────────────────────────────────────────────────────────────
  const schoolName  = schoolSettings?.schoolName || 'SRI VENKATESWARA JY SCHOOL';
  const schoolSub   = '(IIT-JEE / NEET Foundation – Olympiads)';
  const schoolAddr  = schoolSettings?.address || 'Near Axis Bank, Old Bus Stand, Narasannapeta';
  const schoolLogo  = schoolSettings?.logoUrl  || '/logo.png';

  const yr          = new Date().getFullYear();
  const academicYear = admission.academicYear || `${yr}-${yr + 1}`;
  const regNo        = admission.regNo || `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${(admission.id?.slice(0, 6) || '001').toUpperCase()}`;

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const regDate = admission.createdAt ? fmt(new Date(admission.createdAt)) : fmt(new Date());

  // DOB boxes  DD / MM / YYYY
  let dobBoxes = Array(8).fill('');
  if (admission.dob) {
    try {
      const d = new Date(admission.dob);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dobBoxes = [...dd, ...mm, ...yyyy];
    } catch (_) {}
  }

  const g      = (admission.gender || '').toUpperCase();
  const isBoy  = g === 'MALE'   || g === 'BOY';
  const isGirl = g === 'FEMALE' || g === 'GIRL';

  // Siblings – show only real rows; if none, show exactly 1 "NA - Only Child" row
  let siblingsList: any[] = [];
  if (admission.siblingsData && admission.siblingsData !== 'NA') {
    try {
      siblingsList = typeof admission.siblingsData === 'string'
        ? JSON.parse(admission.siblingsData)
        : (Array.isArray(admission.siblingsData) ? admission.siblingsData : []);
    } catch (_) {}
  }
  const hasSiblings   = siblingsList.length > 0;
  const siblingRows   = hasSiblings ? siblingsList : [{ name: 'NA – Only Child', className: '—', schoolName: '—', _only: true }];

  const feeAmount = admission.admissionFee
    ? `₹ ${Number(admission.admissionFee).toLocaleString('en-IN')}`
    : '';

  const resolveImg = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const base = import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998';
    return `${base.replace(/\/$/, '')}/${src.replace(/^\//, '')}`;
  };

  const address = [
    admission.doorNo   ? `D.No: ${admission.doorNo}` : null,
    admission.village  || null,
    admission.mandal   ? `Mandal: ${admission.mandal}` : null,
    admission.district ? `${admission.district} Dist`  : null,
  ].filter(Boolean).join(', ') || admission.address || '';

  const handlePrint = () => window.print();

  // ─── STYLE HELPERS ───────────────────────────────────────────────────────
  // Fixed-label field row: "Label :" ___value_line___
  const Row = ({
    num, label, children, sub,
  }: { num?: string | number; label: string; children: React.ReactNode; sub?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', columnGap: 4, lineHeight: '2.35', flexWrap: 'wrap' }}>
      {num !== undefined && (
        <span style={{ minWidth: 22, fontWeight: 700, flexShrink: 0 }}>{num}.</span>
      )}
      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      {children}
      {sub && <span style={{ fontSize: 9, color: '#555', width: '100%', paddingLeft: 22, marginTop: -4 }}>{sub}</span>}
    </div>
  );

  // Underline span (solid)
  const U = ({
    w = 120, children, bold = true,
  }: { w?: number; children?: React.ReactNode; bold?: boolean }) => (
    <span style={{
      display: 'inline-block',
      minWidth: w,
      borderBottom: '1px solid #000',
      fontWeight: bold ? 700 : 400,
      paddingLeft: 4,
      paddingRight: 4,
      textAlign: 'center',
      textTransform: children ? 'uppercase' : 'none',
    }}>
      {children}
    </span>
  );

  // Dotted underline (acknowledgement)
  const D = ({ children, flex }: { children?: React.ReactNode; flex?: boolean }) => (
    <span style={{
      display: 'inline-block',
      flex: flex ? 1 : undefined,
      borderBottom: '1.5px dotted #000',
      fontWeight: 700,
      paddingLeft: 6, paddingRight: 6,
      minWidth: flex ? undefined : 140,
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );

  // ─── PRINT CSS ───────────────────────────────────────────────────────────
  const css = `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body > * { display: none !important; }
      #adm-print-root { display: block !important; }
      #adm-print-root { position: fixed; top: 0; left: 0; width: 210mm; background: #fff; }
      .adm-page { page-break-after: always; break-after: page; }
      .adm-page:last-child { page-break-after: avoid; break-after: avoid; }
      .no-print { display: none !important; }
    }
  `;

  // ─── PAGE WRAPPER ────────────────────────────────────────────────────────
  const Page = ({ children }: { children: React.ReactNode }) => (
    <div className="adm-page" style={{
      width: '210mm', height: '297mm',
      backgroundColor: '#fff', color: '#000',
      fontFamily: '"Times New Roman", Times, serif',
      boxSizing: 'border-box',
      padding: '7mm',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* thick outer border */}
      <div style={{ position: 'absolute', inset: '5mm', border: '3px solid #000', pointerEvents: 'none', zIndex: 0 }} />
      {/* thin inner border */}
      <div style={{ position: 'absolute', inset: '7mm', border: '1px solid #000', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '6mm 8mm 5mm 8mm' }}>
        {children}
      </div>
    </div>
  );

  // ─── SHARED HEADER ────────────────────────────────────────────────────────
  // Logo left-aligned, school text perfectly centred over full width using absolute logo
  const SchoolHeader = () => (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      {/* Logo – absolutely positioned so it doesn't shift the center text */}
      <img
        src={schoolLogo}
        alt="Logo"
        style={{ position: 'absolute', left: 0, width: 60, height: 60, objectFit: 'contain' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {/* Centered text */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1.2 }}>
          {schoolName}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{schoolSub}</div>
        <div style={{ fontSize: 11, marginTop: 1, color: '#333' }}>{schoolAddr}</div>
      </div>
    </div>
  );

  // ─── SECTION TITLE ────────────────────────────────────────────────────────
  const SectionTitle = ({ text, large }: { text: string; large?: boolean }) => (
    <div style={{ textAlign: 'center', margin: '4px 0 6px' }}>
      <span style={{
        display: 'inline-block',
        backgroundColor: '#333',
        color: '#fff',
        fontSize: large ? 13 : 11,
        fontWeight: 800,
        padding: large ? '3px 36px' : '2px 24px',
        letterSpacing: 2,
        textTransform: 'uppercase',
        borderRadius: 2,
      }}>
        {text}
      </span>
    </div>
  );

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  const renderPage1 = () => (
    <Page>
      <SchoolHeader />
      <SectionTitle text="Admission Form" large />

      {/* Passport photo box – top right of the form fields */}
      <div style={{
        position: 'absolute', top: '36mm', right: '11mm', zIndex: 5,
        width: '28mm', height: '34mm',
        border: '1px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f5f5f5', overflow: 'hidden',
      }}>
        {admission.studentImage
          ? <img src={resolveImg(admission.studentImage)} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 8, textAlign: 'center', color: '#666', lineHeight: 1.5, padding: 4 }}>
              Affix latest<br />Passport Size<br />Photograph
            </span>
        }
      </div>

      {/* Form fields – right side padding accounts for photo box */}
      <div style={{ fontSize: 12.5, paddingRight: '32mm' }}>
        <Row num={1} label="Admn No :">
          <U w={100}>{regNo}</U>
          <span style={{ marginLeft: 8 }}>Class</span>
          <U w={70}>{admission.classApplied}</U>
          <span style={{ marginLeft: 8 }}>Academic Year</span>
          <U w={90}>{academicYear}</U>
        </Row>

        <Row num={2} label="Date of Joining :">
          <U w={220}>{regDate}</U>
        </Row>

        <Row num={3} label="Name of the Student :">
          <U w={320}>{admission.studentName}</U>
        </Row>
        <div style={{ fontSize: 9.5, color: '#555', paddingLeft: 22, marginTop: -6, marginBottom: 2 }}>(In Capital Letters)</div>

        {/* Gender */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: '2.35' }}>
          <span style={{ minWidth: 22, fontWeight: 700 }}>4.</span>
          <span>Gender :</span>
          <span style={{ marginLeft: 8 }}>Boy</span>
          <span style={{ display: 'inline-flex', width: 16, height: 16, border: '1px solid #000', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
            {isBoy ? '✓' : ''}
          </span>
          <span style={{ marginLeft: 16 }}>Girl</span>
          <span style={{ display: 'inline-flex', width: 16, height: 16, border: '1px solid #000', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
            {isGirl ? '✓' : ''}
          </span>
        </div>

        {/* DOB boxes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, lineHeight: '2.35' }}>
          <span style={{ minWidth: 22, fontWeight: 700 }}>5.</span>
          <span>Date of Birth :</span>
          <span style={{ marginLeft: 6, display: 'inline-flex' }}>
            {dobBoxes.map((ch, i) => (
              <React.Fragment key={i}>
                <span style={{
                  display: 'inline-flex', width: 16, height: 18,
                  border: '1px solid #000',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11,
                }}>
                  {ch}
                </span>
                {(i === 1 || i === 3) && <span style={{ padding: '0 1px', fontWeight: 700 }}>/</span>}
              </React.Fragment>
            ))}
          </span>
        </div>

        <Row num={6} label="Mother Tongue :">
          <U w={130}>{admission.motherTongue || 'Telugu'}</U>
          <span style={{ marginLeft: 10 }}>Aadhar No :</span>
          <U w={150}>{admission.aadharNo}</U>
        </Row>

        <Row num={7} label="Father's Name :">
          <U w={185}>{admission.fatherName}</U>
          <span style={{ marginLeft: 8 }}>Occupation :</span>
          <U w={130}>{admission.fatherOccupation}</U>
        </Row>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, paddingLeft: 22, lineHeight: '2.1' }}>
          <span>Aadhar No :</span>
          <U w={170}>{admission.fatherAadhar}</U>
          <span style={{ marginLeft: 10 }}>Phone No :</span>
          <U w={150}>{admission.fatherPhone || admission.phone}</U>
        </div>

        <Row num={8} label="Mother's Name :">
          <U w={185}>{admission.motherName}</U>
          <span style={{ marginLeft: 8 }}>Occupation :</span>
          <U w={130}>{admission.motherOccupation || 'Home Maker'}</U>
        </Row>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, paddingLeft: 22, lineHeight: '2.1' }}>
          <span>Aadhar No :</span>
          <U w={170}>{admission.motherAadhar}</U>
          <span style={{ marginLeft: 10 }}>Phone No :</span>
          <U w={150}>{admission.motherPhone || admission.alternatePhone}</U>
        </div>

        <Row num={9} label="Nationality :">
          <U w={100}>{admission.nationality || 'Indian'}</U>
          <span style={{ marginLeft: 8 }}>State :</span>
          <U w={115}>{admission.state || 'Andhra Pradesh'}</U>
          <span style={{ marginLeft: 8 }}>Religion :</span>
          <U w={100}>{admission.religion || 'Hindu'}</U>
        </Row>

        <Row num={10} label="Caste :">
          <U w={140}>{admission.caste}</U>
          <span style={{ marginLeft: 12 }}>Sub-Caste :</span>
          <U w={140}>{admission.subCaste}</U>
        </Row>

        <Row num={11} label="Residence :">
          <U w={380} bold={false}>{address}</U>
        </Row>

        <Row num={12} label="Name of the School Previous Studying / Studied :">
          <U w={200}>{admission.previousSchool}</U>
        </Row>

        <Row num={13} label={`Annual fee fixed for ${academicYear} :`}>
          <U w={220}>{feeAmount}</U>
        </Row>
      </div>

      {/* ── ACKNOWLEDGEMENT SLIP ── */}
      <div style={{ marginTop: 'auto', borderTop: '2px dashed #555', paddingTop: 6 }}>
        <div style={{ textAlign: 'center', fontSize: 9, color: '#666', marginBottom: 4, letterSpacing: 3 }}>
          ✂ ── CUT HERE ── ✂
        </div>

        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {schoolName}
        </div>
        <SectionTitle text="Acknowledgement" />

        <div style={{ fontSize: 12.5, lineHeight: '2.3' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ whiteSpace: 'nowrap' }}>Name of the Student</span>
            <D flex>{admission.studentName}</D>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ whiteSpace: 'nowrap' }}>Class</span>
            <D>{admission.classApplied}</D>
            <span style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>Father's Name</span>
            <D flex>{admission.fatherName}</D>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ whiteSpace: 'nowrap' }}>Annual fee fixed for {academicYear}</span>
            <D flex>{feeAmount}</D>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12 }}>
          <div style={{ borderTop: '1px solid #000', minWidth: 140, paddingTop: 2, textAlign: 'center' }}>Signature of the Parent</div>
          <div style={{ borderTop: '1px solid #000', minWidth: 140, paddingTop: 2, textAlign: 'center' }}>Signature of the Principal</div>
        </div>
      </div>
    </Page>
  );

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────
  const renderPage2 = () => (
    <Page>
      {/* ── SIBLING DETAILS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
        <thead>
          <tr>
            <th colSpan={4} style={{ border: '1px solid #000', padding: '5px 8px', textAlign: 'center', fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', backgroundColor: '#eee' }}>
              Sibling Details
            </th>
          </tr>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #000', padding: '4px 6px', width: '8%',  textAlign: 'center' }}>S.NO</th>
            <th style={{ border: '1px solid #000', padding: '4px 6px', width: '33%', textAlign: 'center' }}>NAME</th>
            <th style={{ border: '1px solid #000', padding: '4px 6px', width: '14%', textAlign: 'center' }}>CLASS</th>
            <th style={{ border: '1px solid #000', padding: '4px 6px',              textAlign: 'center' }}>Where He / She Studying</th>
          </tr>
        </thead>
        <tbody>
          {siblingRows.map((sib, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center', fontWeight: 700, height: 28 }}>
                {sib?._only ? '—' : i + 1}
              </td>
              <td style={{ border: '1px solid #000', padding: '5px 6px', textTransform: 'uppercase', fontStyle: sib?._only ? 'italic' : 'normal', textAlign: sib?._only ? 'center' : 'left' }}>
                {sib?.name || ''}
              </td>
              <td style={{ border: '1px solid #000', padding: '5px 6px', textAlign: 'center' }}>{sib?.className || ''}</td>
              <td style={{ border: '1px solid #000', padding: '5px 6px' }}>{sib?.schoolName || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TERMS AND CONDITIONS ── */}
      <div style={{ fontWeight: 800, fontSize: 12.5, textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
        Following Terms and Conditions Should Strictly Be Followed
      </div>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 11.5, lineHeight: '1.72', textAlign: 'justify', marginBottom: 10 }}>
        <li>Student should obey the rules and regulations set by the management.</li>
        <li>Student would not be allowed to move around the premises of the school without uniform.</li>
        <li>During school time no visitor is allowed.</li>
        <li>During school time parents should not approach teachers without the permission of the management.</li>
        <li>The management has the right to reject or accept the application. The name of the student will be struck out if the students fail to follow the rules and regulations of the school.</li>
        <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
        <li>In case of the decision of the management would be final and the concerned parties would accept the management's decisions final.</li>
        <li>If the student will remain absent from school for 10 days without information his / her name will be struck out from the school. Parent has to take prior permission for the students absence.</li>
        <li>The students has pay all dues again to be readmitted.</li>
        <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.</li>
        <li style={{ fontWeight: 700 }}>The fee once paid will not be refunded.</li>
      </ol>

      {/* ── DECLARATION ── */}
      <div style={{ fontWeight: 800, fontSize: 12.5, textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
        Declaration by the Parent / Guardian
      </div>
      <p style={{ fontSize: 11.5, lineHeight: '1.75', textAlign: 'justify', margin: '0 0 8px 0' }}>
        &nbsp;&nbsp;&nbsp;&nbsp;I,&nbsp;
        <U w={180}>{admission.fatherName || admission.motherName}</U>
        &nbsp;Parent / Guardian of&nbsp;
        <U w={180}>{admission.studentName}</U>
        &nbsp;do hereby declare that if my child is admitted, I promise to send my child daily to school in time with necessary books and to pay the fee regularly. I will follow the rules and regulations of the school and abide by the directions given by the school authority. I also state that outside of the school hours it is my responsibility to take care of the child and declare that all the information given above is true to the best of my knowledge and I am aware that if it is found wrong at any state, the admission of my ward will be cancelled.
      </p>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', fontSize: 12, marginBottom: 4 }}>
        <div>Place&nbsp;: <U w={120} bold={false}>Narasannapeta</U></div>
        <div>Date&nbsp;&nbsp;: <U w={120} bold={false}>{regDate}</U></div>
        <div style={{ marginLeft: 'auto', borderTop: '1px solid #000', paddingTop: 2, minWidth: 170, textAlign: 'center', fontSize: 11.5 }}>
          Signature of the Parent / Guardian
        </div>
      </div>

      {/* ── FEE PAYMENT SCHEDULE ── */}
      <div style={{ border: '1px solid #000', padding: '6px 10px', marginTop: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 12, textDecoration: 'underline', textTransform: 'uppercase', marginBottom: 4 }}>
          Fee Payment Schedule
        </div>
        <div style={{ fontSize: 11.5, lineHeight: '1.8' }}>
          <div>1st Term &nbsp;→ &nbsp;August 1st week</div>
          <div>2nd Term  → &nbsp;November 1st week</div>
          <div>3rd Term &nbsp;→ &nbsp;Before Sankranti holidays</div>
        </div>
      </div>

      {/* ── BOTTOM SIGNATURES ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, fontSize: 12 }}>
        <div>Date : <U w={130} bold={false}>{regDate}</U></div>
        <div style={{ borderTop: '1px solid #000', minWidth: 170, paddingTop: 2, textAlign: 'center', fontSize: 11.5 }}>
          Signature of the Principal
        </div>
      </div>
    </Page>
  );

  // ─── SCALE PREVIEW ────────────────────────────────────────────────────────
  // A4 at 96dpi ≈ 794 × 1123px. Preview fits in modal height ~560px → scale ≈ 0.48
  const SCALE  = 0.48;
  const PW     = 794;
  const PH     = 1123;
  const slotW  = PW * SCALE;
  const slotH  = PH * SCALE;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ══ SCREEN MODAL ══ */}
      <div className="no-print" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,18,35,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header bar */}
        <div style={{
          height: 56,
          background: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 8, padding: 8 }}>
              <Printer size={17} color="#818cf8" />
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>
                Admission Form &nbsp;<span style={{ background: '#4f46e5', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 99, letterSpacing: 1 }}>2 PAGES · A4</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>Click Print to send to printer</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 18px', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: 7,
                cursor: 'pointer', color: '#94a3b8',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 16px 40px',
          gap: 16,
        }}>
          {/* Page labels */}
          <div style={{ display: 'flex', gap: 12 }}>
            {['Page 1 — Admission Form', 'Page 2 — Terms & Declaration'].map((lbl, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 99, padding: '4px 14px',
                color: '#94a3b8', fontSize: 11, fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#34d399' : '#60a5fa', display: 'inline-block' }} />
                {lbl}
              </div>
            ))}
          </div>

          {/* Side-by-side scaled pages */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', justifyContent: 'center' }}>
            {[renderPage1(), renderPage2()].map((page, i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                <div style={{
                  width: slotW, height: slotH,
                  overflow: 'hidden',
                  borderRadius: 4,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: PW, height: PH,
                    transform: `scale(${SCALE})`,
                    transformOrigin: 'top left',
                  }}>
                    {page}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PRINT-ONLY SECTION ══ */}
      <div id="adm-print-root" style={{ display: 'none' }}>
        {renderPage1()}
        {renderPage2()}
      </div>
    </>,
    document.body
  );
};

export default AdmissionPrintModal;
