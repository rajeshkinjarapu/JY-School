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

  const schoolName = schoolSettings?.schoolName || 'SRI VENKATESWARA JY PUBLIC SCHOOL';
  const schoolSub = '(IIT-JEE / NEET Foundation – Olympiads)';
  const schoolAddress = schoolSettings?.address || 'Near Axis Bank, Old Bus Stand, Narasannapeta';
  const schoolLogo = schoolSettings?.logoUrl || '/logo.png';

  const currentYear = new Date().getFullYear();
  const academicYear = admission.academicYear || `${currentYear}-${currentYear + 1}`;
  const regNo = admission.regNo || `ADM-${new Date(admission.createdAt || Date.now()).getFullYear()}-${admission.id?.slice(0, 6).toUpperCase() || '001'}`;

  const regDate = admission.createdAt
    ? new Date(admission.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // DOB formatted
  let dobStr = '';
  let dobBoxes = ['', '', '', '', '', '', '', ''];
  if (admission.dob) {
    try {
      const d = new Date(admission.dob);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = String(d.getFullYear());
      dobBoxes = [dd[0], dd[1], mm[0], mm[1], yyyy[0], yyyy[1], yyyy[2], yyyy[3]];
      dobStr = `${dd}/${mm}/${yyyy}`;
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

  // ─── SHARED STYLES ────────────────────────────────────────────────────────
  const lineStyle: React.CSSProperties = {
    borderBottom: '1px solid #000',
    display: 'inline-block',
    minWidth: '160px',
    marginLeft: '4px',
  };

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────
  const renderPage1 = () => (
    <div
      className="a4-page"
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        padding: '8mm',
        fontFamily: 'Times New Roman, Times, serif',
        color: '#000',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Double Border */}
      <div style={{
        position: 'absolute', inset: '4mm',
        border: '3px solid #000',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: '6mm',
        border: '1px solid #000',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content inside border */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '4mm 6mm 3mm 6mm' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          {/* Logo */}
          <img
            src={schoolLogo}
            alt="Logo"
            style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {/* School Name */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.2, letterSpacing: '1px' }}>
              {schoolName}
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>{schoolSub}</div>
            <div style={{ fontSize: '10px', marginTop: '1px', color: '#333' }}>{schoolAddress}</div>
          </div>
        </div>

        {/* ── ADMISSION FORM TITLE ── */}
        <div style={{ textAlign: 'center', margin: '6px 0 8px' }}>
          <div style={{
            display: 'inline-block',
            background: '#000',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '3px 32px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            ADMISSION FORM
          </div>
        </div>

        {/* ── PHOTO BOX (top-right, absolute) ── */}
        <div style={{
          position: 'absolute',
          top: '28mm',
          right: '10mm',
          width: '28mm',
          height: '34mm',
          border: '1px solid #000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          overflow: 'hidden',
          zIndex: 2,
        }}>
          {admission.studentImage ? (
            <img
              src={resolveImg(admission.studentImage)}
              alt="Student"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: '7px', textAlign: 'center', color: '#555', padding: '4px', lineHeight: '1.4' }}>
              Affix latest<br />Passport Size<br />Photograph
            </div>
          )}
        </div>

        {/* ── FORM FIELDS ── */}
        <div style={{ fontSize: '11px', lineHeight: '1.9', paddingRight: '34mm' }}>

          {/* 1. Admn No */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>1.</span>
            <span>Admn No :</span>
            <span style={{ ...lineStyle, minWidth: '90px' }}>{regNo}</span>
            <span style={{ marginLeft: '10px' }}>Class</span>
            <span style={{ ...lineStyle, minWidth: '60px' }}>{admission.classApplied || ''}</span>
            <span style={{ marginLeft: '10px' }}>Academic Year</span>
            <span style={{ ...lineStyle, minWidth: '80px' }}>{academicYear}</span>
          </div>

          {/* 2. Date of Joining */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>2.</span>
            <span>Date of Joining &nbsp;&nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '200px' }}>{regDate}</span>
          </div>

          {/* 3. Name of Student */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>3.</span>
            <span>Name of the Student &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '250px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {admission.studentName || ''}
            </span>
          </div>
          <div style={{ paddingLeft: '20px', fontSize: '9.5px', color: '#333' }}>(In capital Letters)</div>

          {/* 4. Gender */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>4.</span>
            <span>Gender &nbsp;:</span>
            <span style={{ marginLeft: '8px' }}>Boy</span>
            <span style={{
              display: 'inline-block',
              width: '14px', height: '14px',
              border: '1px solid #000',
              textAlign: 'center',
              lineHeight: '13px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}>{isBoy ? '✓' : ''}</span>
            <span style={{ marginLeft: '12px' }}>Girl</span>
            <span style={{
              display: 'inline-block',
              width: '14px', height: '14px',
              border: '1px solid #000',
              textAlign: 'center',
              lineHeight: '13px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}>{isGirl ? '✓' : ''}</span>
          </div>

          {/* 5. Date of Birth with boxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>5.</span>
            <span>Date of Birth &nbsp;:</span>
            <span style={{ marginLeft: '6px', display: 'flex', gap: '2px', alignItems: 'center' }}>
              {dobBoxes.map((d, i) => (
                <React.Fragment key={i}>
                  <span style={{
                    display: 'inline-block',
                    width: '14px', height: '16px',
                    border: '1px solid #000',
                    textAlign: 'center',
                    lineHeight: '15px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}>{d}</span>
                  {(i === 1 || i === 3) && <span style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 1px' }}>/</span>}
                </React.Fragment>
              ))}
              {dobStr && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#444' }}>({dobStr})</span>}
            </span>
          </div>

          {/* 6. Mother Tongue & Aadhar */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>6.</span>
            <span>Mother Tongue :</span>
            <span style={{ ...lineStyle, minWidth: '100px' }}>{admission.motherTongue || 'Telugu'}</span>
            <span style={{ marginLeft: '16px' }}>Aadhar No :</span>
            <span style={{ ...lineStyle, minWidth: '120px' }}>{admission.aadharNo || ''}</span>
          </div>

          {/* 7. Father's Name */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>7.</span>
            <span>Father's &nbsp;Name &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '130px', textTransform: 'uppercase' }}>
              {admission.fatherName || ''}
            </span>
            <span style={{ marginLeft: '8px' }}>Occupation :</span>
            <span style={{ ...lineStyle, minWidth: '100px' }}>{admission.fatherOccupation || ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', paddingLeft: '20px' }}>
            <span>Aadhar No &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '120px' }}>{admission.fatherAadhar || ''}</span>
            <span style={{ marginLeft: '16px' }}>Phone No &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '110px' }}>{admission.fatherPhone || admission.phone || ''}</span>
          </div>

          {/* 8. Mother's Name */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>8.</span>
            <span>Mother's Name :</span>
            <span style={{ ...lineStyle, minWidth: '120px', textTransform: 'uppercase' }}>
              {admission.motherName || ''}
            </span>
            <span style={{ marginLeft: '8px' }}>Occupation :</span>
            <span style={{ ...lineStyle, minWidth: '100px' }}>{admission.motherOccupation || 'Home Maker'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', paddingLeft: '20px' }}>
            <span>Aadhar No &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '120px' }}>{admission.motherAadhar || ''}</span>
            <span style={{ marginLeft: '16px' }}>Phone No &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '110px' }}>{admission.motherPhone || admission.alternatePhone || ''}</span>
          </div>

          {/* 9. Nationality, State, Religion */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>9.</span>
            <span>Nationality :</span>
            <span style={{ ...lineStyle, minWidth: '80px' }}>{admission.nationality || 'Indian'}</span>
            <span style={{ marginLeft: '8px' }}>State:</span>
            <span style={{ ...lineStyle, minWidth: '80px' }}>{admission.state || 'Andhra Pradesh'}</span>
            <span style={{ marginLeft: '8px' }}>Religion :</span>
            <span style={{ ...lineStyle, minWidth: '80px' }}>{admission.religion || 'Hindu'}</span>
          </div>

          {/* 10. Caste & Sub-Caste */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>10.</span>
            <span>Caste &nbsp;&nbsp;&nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '100px' }}>{admission.caste || ''}</span>
            <span style={{ marginLeft: '20px' }}>Sub-Caste:</span>
            <span style={{ ...lineStyle, minWidth: '120px' }}>{admission.subCaste || ''}</span>
          </div>

          {/* 11. Residence */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>11.</span>
            <span>Residence &nbsp;:</span>
            <span style={{
              ...lineStyle,
              minWidth: '300px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {[admission.doorNo ? `D.No: ${admission.doorNo}` : null, admission.village, admission.mandal ? `Mandal: ${admission.mandal}` : null, admission.district ? `${admission.district} Dist` : null].filter(Boolean).join(', ') || admission.address || ''}
            </span>
          </div>

          {/* 12. Previous School */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>12.</span>
            <span>Name of the School Previous Studying / Studied :</span>
            <span style={{ ...lineStyle, minWidth: '160px' }}>{admission.previousSchool || ''}</span>
          </div>

          {/* 13. Annual Fee */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ minWidth: '14px', fontWeight: 'bold' }}>13.</span>
            <span>Annual fee fixed for {academicYear} &nbsp;:</span>
            <span style={{ ...lineStyle, minWidth: '160px', fontWeight: 'bold' }}>{feeAmount}</span>
          </div>
        </div>

        {/* ── ACKNOWLEDGEMENT SLIP ── */}
        <div style={{ marginTop: 'auto', borderTop: '2px solid #000', paddingTop: '6px' }}>
          {/* Divider scissors */}
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#555', marginBottom: '4px', letterSpacing: '2px' }}>
            ✂ ─────────────────── CUT HERE ─────────────────── ✂
          </div>

          {/* Ack Header */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {schoolName}
            </div>
            <div style={{
              display: 'inline-block',
              background: '#000',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 24px',
              margin: '3px 0',
              letterSpacing: '1px',
            }}>
              Acknowledgement
            </div>
          </div>

          {/* Ack Fields */}
          <div style={{ fontSize: '11px', lineHeight: '2.2' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span>Name of the Student</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                &nbsp;{admission.studentName || ''}&nbsp;
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span>Class</span>
              <span style={{ minWidth: '60px', borderBottom: '1px dotted #000', fontWeight: 'bold' }}>
                &nbsp;{admission.classApplied || ''}&nbsp;
              </span>
              <span style={{ marginLeft: '12px' }}>Father's Name</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                &nbsp;{admission.fatherName || ''}&nbsp;
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span>Annual fee fixed for {academicYear}</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', fontWeight: 'bold' }}>
                &nbsp;{feeAmount}&nbsp;
              </span>
            </div>
          </div>

          {/* Ack Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '11px' }}>
            <div style={{ borderTop: '1px solid #000', width: '45%', paddingTop: '2px', textAlign: 'center' }}>
              Signature of the Parent
            </div>
            <div style={{ borderTop: '1px solid #000', width: '45%', paddingTop: '2px', textAlign: 'center' }}>
              Signature of the Principal
            </div>
          </div>
        </div>

      </div>{/* end content */}
    </div>
  );

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────
  const renderPage2 = () => (
    <div
      className="a4-page"
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        padding: '8mm',
        fontFamily: 'Times New Roman, Times, serif',
        color: '#000',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Double Border */}
      <div style={{
        position: 'absolute', inset: '4mm',
        border: '3px solid #000',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: '6mm',
        border: '1px solid #000',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '5mm 7mm 4mm 7mm', fontSize: '10.5px' }}>

        {/* ── SIBLING DETAILS ── */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SIBLING DETAILS
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '10.5px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e8e8e8' }}>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '10%', textAlign: 'center' }}>S.NO</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '35%', textAlign: 'center' }}>NAME</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '15%', textAlign: 'center' }}>CLASS</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', width: '40%', textAlign: 'center' }}>Where He / She Studying</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3].map((idx) => {
              const sib = siblingsList[idx];
              return (
                <tr key={idx} style={{ height: '22px' }}>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textTransform: 'uppercase' }}>
                    {sib ? sib.name : (idx === 0 && siblingsList.length === 0 ? 'NA (Only Child)' : '')}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px', textAlign: 'center' }}>
                    {sib ? sib.className : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '3px 6px' }}>
                    {sib ? sib.schoolName : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TERMS AND CONDITIONS ── */}
        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase' }}>
          Following Terms and Conditions Should Strictly Be Followed
        </div>
        <ol style={{ margin: '0 0 8px 0', paddingLeft: '18px', lineHeight: '1.75', fontSize: '10px' }}>
          <li>Student should obey the rules and regulations set by the management.</li>
          <li>Student would not be allowed to move around the premises of the school without uniform.</li>
          <li>During school time no visitor is allowed.</li>
          <li>During school time parents should not approach teachers without the permission of the management.</li>
          <li>
            The management has the right to reject or accept the application.<br />
            The name of the student will be struck out if the students fail to follow the rules and regulations of the school.
          </li>
          <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
          <li>In case of the decision of the management would be final and the concerned parties would accept the management's decisions final.</li>
          <li>If the student will remain absent from school for 10 days without information his/her name will be struck out from the school. Parent has to take prior permission for the students absence.</li>
          <li>The students has pay all dues again to be readmitted.</li>
          <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.</li>
          <li style={{ fontWeight: 'bold' }}>The fee once paid will not be refunded.</li>
        </ol>

        {/* ── DECLARATION ── */}
        <div style={{ fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px', textAlign: 'center', textDecoration: 'underline', textTransform: 'uppercase' }}>
          Declaration by the Parent / Guardian
        </div>
        <p style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify', margin: '0 0 8px 0' }}>
          I, <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            &nbsp;{admission.fatherName || admission.motherName || ''}&nbsp;
          </span> Parent / Guardian of <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            &nbsp;{admission.studentName || ''}&nbsp;
          </span> do hereby
          declare that if my child is admitted, I promise to send my child daily to school in time with necessary books and to pay the fee regularly. I will follow the rules and regulations of the
          school and abide by the directions given by the school authority I also state that outside of the school hours it is my responsibility to take care of the child and declare that all the
          information given above is true to the best of my knowledge and I am aware that if it is
          found wrong at any state, the admission of my ward will be cancelled.
        </p>

        {/* Place & Date */}
        <div style={{ display: 'flex', gap: '32px', fontSize: '10.5px', marginBottom: '4px' }}>
          <div>Place &nbsp;: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}>&nbsp;Narasannapeta&nbsp;</span></div>
          <div>Date &nbsp;&nbsp;: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}>&nbsp;{regDate}&nbsp;</span></div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ borderTop: '1px solid #000', display: 'inline-block', minWidth: '140px', paddingTop: '2px', textAlign: 'center', fontSize: '10px' }}>
              Signature of the Parent/Guardian
            </span>
          </div>
        </div>

        {/* ── FEE PAYMENT SCHEDULE ── */}
        <div style={{
          border: '1px solid #000',
          padding: '6px 10px',
          marginTop: '6px',
          marginBottom: 'auto',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', textDecoration: 'underline', textTransform: 'uppercase' }}>
            Fee Payment Schedule
          </div>
          <div style={{ fontSize: '10.5px', lineHeight: '1.8' }}>
            <div>1st Term → August 1st week</div>
            <div>2nd Term → November 1st week</div>
            <div>3rd Term → Before sankranti holidays</div>
          </div>
        </div>

        {/* ── BOTTOM SIGNATURES ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '14px', fontSize: '10.5px' }}>
          <div>
            Date &nbsp;: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}>&nbsp;{regDate}&nbsp;</span>
          </div>
          <div style={{ borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'center', minWidth: '140px' }}>
            Signature of the Principal
          </div>
        </div>

      </div>{/* end content */}
    </div>
  );

  // ─── PRINT STYLES ─────────────────────────────────────────────────────────
  const printStyles = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body > * { display: none !important; }
      body > #adm-print-root { display: block !important; }
      #adm-print-root {
        position: fixed !important;
        top: 0; left: 0;
        width: 210mm !important;
        margin: 0 !important; padding: 0 !important;
        background: white !important;
      }
      .a4-page {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        box-sizing: border-box !important;
        padding: 8mm !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        overflow: hidden !important;
        background: white !important;
      }
      .a4-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .no-print { display: none !important; }
    }
  `;

  // ─── PREVIEW SCALE HELPER ─────────────────────────────────────────────────
  // A4 in pixels at 96dpi: 210mm ≈ 794px, 297mm ≈ 1123px
  // Scale to fit ~500px tall preview card → scale ≈ 0.45
  const SCALE = 0.47;
  const A4_W_PX = 794;
  const A4_H_PX = 1123;

  const scaledW = A4_W_PX * SCALE;
  const scaledH = A4_H_PX * SCALE;

  return createPortal(
    <>
      {/* ── SCREEN MODAL ── */}
      <div
        className="no-print"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          background: '#0f172a',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '95vh',
          border: '1px solid #334155',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 24px',
            background: 'linear-gradient(90deg, #1e3a8a, #1e293b, #1e3a8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #334155',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Printer size={18} color="#fbbf24" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Official Admission Form — 2 Pages
                  <span style={{
                    background: '#fbbf24', color: '#0f172a',
                    fontSize: '9px', fontWeight: 800,
                    padding: '2px 10px', borderRadius: '999px',
                    textTransform: 'uppercase', letterSpacing: '1px',
                  }}>A4 Print</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '2px' }}>
                  Standard Institutional Admission Dossier with Double Border
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handlePrint}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0f172a', fontWeight: 800, fontSize: '12px',
                  border: 'none', borderRadius: '10px', padding: '9px 20px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                }}
              >
                <Printer size={14} /> Print Both Pages (A4)
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px', padding: '8px',
                  cursor: 'pointer', color: '#fff',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div style={{
            flex: 1, overflowY: 'auto',
            background: '#0f172a',
            padding: '24px',
          }}>

            {/* Page Labels */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '16px' }}>
              {['PAGE 1 — ADMISSION FORM + ACKNOWLEDGEMENT', 'PAGE 2 — TERMS, DECLARATION & FEE SCHEDULE'].map((label, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '999px', padding: '5px 16px',
                  color: '#cbd5e1', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: i === 0 ? '#34d399' : '#60a5fa',
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${i === 0 ? '#34d399' : '#60a5fa'}`,
                  }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Side-by-side pages */}
            <div style={{
              display: 'flex', gap: '24px', justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
              {[renderPage1(), renderPage2()].map((page, i) => (
                <div key={i} style={{ flexShrink: 0 }}>
                  {/* Page number badge */}
                  <div style={{
                    textAlign: 'center', color: '#64748b',
                    fontSize: '10px', fontFamily: 'system-ui, sans-serif',
                    marginBottom: '6px', fontWeight: 600, letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>
                    Page {i + 1}
                  </div>
                  {/* Scaled wrapper */}
                  <div style={{
                    width: `${scaledW}px`,
                    height: `${scaledH}px`,
                    overflow: 'hidden',
                    borderRadius: '4px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      width: `${A4_W_PX}px`,
                      height: `${A4_H_PX}px`,
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
      </div>

      {/* ── PRINT-ONLY SECTION ── */}
      <div id="adm-print-root" style={{ display: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />
        {renderPage1()}
        {renderPage2()}
      </div>
    </>,
    document.body
  );
};

export default AdmissionPrintModal;
