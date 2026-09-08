import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Upload, ChevronLeft, ChevronRight, Plus, X, GraduationCap, FileText, Database, CheckSquare, Square } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';

const CANVAS_W = 850;
const CANVAS_H = 1202;

// Sub-component for the actual certificate to allow reuse for screen and print
const CertificateTemplate = ({ data, logo, rows, id = "cert-template" }: any) => {
    return (
        <div id={id} className="cert-a4-canvas">
            {/* Borders */}
            <div className="cert-border-outer"></div>
            <div className="cert-border-inner"></div>
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>

            {/* Watermark */}
            <div className="cert-watermark">
                {logo && <img src={logo} alt="watermark" />}
            </div>

            {/* Content */}
            <div className="cert-content">
                <div className="c-header">
                    <div className="c-logo">
                        {logo ? <img src={logo} alt="Logo" /> : <span className="c-logo-placeholder">🏫</span>}
                    </div>
                    <div className="c-school-info">
                        <div className="c-school-name">JY SCHOOL</div>
                        <div className="c-school-rc">Rc. No. 281125100013 / Visakhapatnam/2025. Dated :21-10-2025</div>
                        <div className="c-school-addr">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</div>
                    </div>
                </div>

                <div className="c-title">Study & Conduct Certificate</div>

                <div className="c-meta-boxes">
                    <div className="c-meta-box">Admission No. : <span>{data.admission}</span></div>
                    <div className="c-meta-box">UDISE Code : <span>{data.udise}</span></div>
                </div>

                <div className="c-body">
                    <div className="p1">
                        <span className="c-label">This is to certify that</span>
                        <span className="c-value c-value-lg">{data.student}</span>
                        <span className="c-label">, Son/Daughter of</span>
                        <span className="c-value c-value-lg">{data.parent}</span>
                        <span className="c-label">, was a bona fide student of this institution.</span>
                    </div>
                    <div className="p2">
                        <span className="c-label">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>
                        <span className="c-value" style={{ fontStyle: 'italic' }}>{data.conduct}</span>
                        <span className="c-label">. The student consistently maintained good moral values, complied with the rules and regulations of the institution, and demonstrated respectful behavior towards teachers, staff, and fellow students.</span>
                    </div>
                    <div className="p3">
                        <span className="c-label">He/She studied the following classes during the years noted below, as recorded in the school records.</span>
                    </div>

                    <div className="c-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>Sl. No.</th>
                                    <th style={{ width: '35%' }}>Academic Year</th>
                                    <th style={{ width: '25%' }}>Class</th>
                                    <th style={{ width: '25%' }}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={4} style={{ color: '#999', textAlign: 'center' }}>No records</td></tr>
                                ) : (
                                    rows.map((row: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{row.year}</td>
                                            <td>{row.class}</td>
                                            <td>{row.remarks}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="c-footer">
                        <div className="c-meta">
                            <div className="c-meta-line">
                                <span className="c-label" style={{ marginLeft: 0 }}>Place :</span>
                                <span className="c-value">{data.place}</span>
                            </div>
                            <div className="c-meta-line">
                                <span className="c-label" style={{ marginLeft: 0 }}>Date &nbsp;:</span>
                                <span className="c-value">{data.date}</span>
                            </div>
                        </div>
                        <div className="c-signature">
                            <div className="c-sig-line"></div>
                            <div className="c-sig-label">Headmaster / Principal</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StudyCertificatePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  
  // Shared Data
  const [mConduct, setMConduct] = useState('Excellent');
  const [mUdise, setMUdise] = useState('');
  const [mPlace, setMPlace] = useState('');
  const [mDate, setMDate] = useState('');
  const [academicRows, setAcademicRows] = useState<{year: string, class: string, remarks: string}[]>([
    { year: '2023-24', class: 'VI', remarks: '' },
    { year: '2024-25', class: 'VII', remarks: '' },
    { year: '2025-26', class: 'VIII', remarks: 'Pro wrote' }
  ]);

  // Manual State
  const [mStudent, setMStudent] = useState('');
  const [mParent, setMParent] = useState('');
  const [mAdmission, setMAdmission] = useState('');

  // Bulk / DB State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  // Bulk Preview Index
  const [bulkIndex, setBulkIndex] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zipCanvasRef = useRef<HTMLDivElement>(null);

  // Load classes & UDISE on mount
  useEffect(() => {
    const savedUdise = localStorage.getItem('study_cert_udise');
    if (savedUdise) setMUdise(savedUdise);

    api.get('/api/classes?limit=5000')
      .then((res: any) => setClasses(res.data?.data || res.data || []))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  // Save UDISE on change
  useEffect(() => {
    localStorage.setItem('study_cert_udise', mUdise);
  }, [mUdise]);

  // Fetch students when Class + Section selected
  useEffect(() => {
    if (selectedClass && selectedSection) {
      const cls = classes.find(c => c.className === selectedClass && c.section === selectedSection);
      if (cls) {
        api.get(`/api/classes/${cls.id}/students`)
          .then((res: any) => {
              setStudents(res.data?.data || res.data || []);
              setBulkSelectedIds([]); // Reset selection on new fetch
              setBulkIndex(0);
          })
          .catch(() => toast.error('Failed to load students'));
      } else {
        setStudents([]);
      }
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSection, classes]);

  // Handle Manual Student Selection
  const handleManualStudentSelect = (id: string) => {
      setSelectedStudentId(id);
      const s = students.find(x => x.id === id);
      if (s) {
          setMStudent(`${s.firstName || ''} ${s.lastName || ''}`.trim());
          setMParent(s.fatherName || s.guardianName || '');
          setMAdmission(s.admissionNumber || '');
      }
  };

  // Resize canvas to fit viewport (only applies to screen view)
  useEffect(() => {
    const handleResize = () => {
      if (!viewportRef.current || !canvasRef.current) return;
      const viewW = viewportRef.current.clientWidth;
      const viewH = viewportRef.current.clientHeight;
      const padding = 40;
      const targetW = viewW - padding;
      const targetH = viewH - padding;
      const scaleW = targetW / CANVAS_W;
      const scaleH = targetH / CANVAS_H;
      const scale = Math.min(scaleW, scaleH, 1.2);
      canvasRef.current.style.transform = `scale(${scale})`;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [mode, bulkIndex, mStudent, students]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    
    try {
        const originalTransform = canvasRef.current.style.transform;
        canvasRef.current.style.transform = 'none';
        void canvasRef.current.offsetWidth; // Force reflow

        const canvas = await html2canvas(canvasRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#FDFBF7',
            logging: false,
            width: CANVAS_W,
            height: CANVAS_H
        });

        canvasRef.current.style.transform = originalTransform;

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = 210;
        const pdfH = (CANVAS_H * pdfW) / CANVAS_W;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        
        let filename = 'Certificate.pdf';
        if (mode === 'manual' && mStudent) filename = `Certificate_${mStudent.replace(/\s+/g, '_')}.pdf`;
        else if (mode === 'bulk' && bulkSelectedIds.length > 0) {
            const s = students.find(x => x.id === bulkSelectedIds[bulkIndex]);
            if (s) filename = `Certificate_${s.firstName}_${s.lastName}.pdf`;
        }
            
        pdf.save(filename);
        toast.success("PDF exported successfully!");
    } catch (err: any) {
        toast.error("Export failed: " + err.message);
    } finally {
        setIsExporting(false);
    }
  };

  const handleGenerateZip = async () => {
      if (bulkSelectedIds.length === 0) return toast.error("Select at least one student!");
      
      setIsZipping(true);
      const toastId = toast.loading('Generating ZIP... Please wait (this may take a minute depending on count)');
      
      try {
          const zip = new JSZip();
          
          for (let i = 0; i < bulkSelectedIds.length; i++) {
              const studentId = bulkSelectedIds[i];
              const s = students.find(x => x.id === studentId);
              if (!s) continue;
              
              const targetDiv = document.getElementById(`zip-cert-${studentId}`);
              if (!targetDiv) continue;

              const canvas = await html2canvas(targetDiv, {
                  scale: 2,
                  useCORS: true,
                  backgroundColor: '#FDFBF7',
                  logging: false,
                  width: CANVAS_W,
                  height: CANVAS_H
              });

              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfW = 210;
              const pdfH = (CANVAS_H * pdfW) / CANVAS_W;
              pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
              
              const pdfBlob = pdf.output('blob');
              zip.file(`Certificate_${s.firstName}_${s.lastName}.pdf`.replace(/\s+/g, '_'), pdfBlob);
          }

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          saveAs(zipBlob, `Study_Certificates_${selectedClass}_${selectedSection}.zip`);
          toast.success('ZIP downloaded successfully!', { id: toastId });
      } catch (err: any) {
          toast.error("ZIP Generation failed: " + err.message, { id: toastId });
      } finally {
          setIsZipping(false);
      }
  };

  // Determine what data to render on screen
  const defaultFields = {
    student: '_________________________',
    parent: '_________________________',
    conduct: mConduct || '_______________',
    admission: '___________',
    udise: mUdise || '___________',
    place: mPlace || '_______________',
    date: mDate || '_______________'
  };

  let screenData: any = { ...defaultFields };
  if (mode === 'manual') {
      screenData = {
          student: mStudent || defaultFields.student,
          parent: mParent || defaultFields.parent,
          conduct: mConduct || defaultFields.conduct,
          admission: mAdmission || defaultFields.admission,
          udise: mUdise || defaultFields.udise,
          place: mPlace || defaultFields.place,
          date: mDate || defaultFields.date,
      };
  } else if (mode === 'bulk' && bulkSelectedIds.length > 0) {
      const s = students.find(x => x.id === bulkSelectedIds[bulkIndex]);
      if (s) {
          screenData = {
              student: `${s.firstName || ''} ${s.lastName || ''}`.trim() || defaultFields.student,
              parent: s.fatherName || s.guardianName || defaultFields.parent,
              conduct: mConduct || defaultFields.conduct,
              admission: s.admissionNumber || defaultFields.admission,
              udise: mUdise || defaultFields.udise,
              place: mPlace || defaultFields.place,
              date: mDate || defaultFields.date,
          };
      }
  }

  // Filter unique classes and sections
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.className))).sort();
  const availableSections = classes.filter(c => c.className === selectedClass).map(c => c.section).sort();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
        
        {/* Scoped CSS for the Certificate itself to guarantee exact HTML styling */}
        <style>{`
        :root {
            --cert-bg: #FDFBF7;
            --cert-navy: #0F203C;
            --cert-gold: #D4AF37;
            --cert-text: #2d3748;
            --cert-font: 'TXTGRYSCHOLA', 'TeX Gyre Schola', 'Century Schoolbook', 'Times New Roman', serif;
        }
        
        .cert-viewport {
            flex: 1;
            width: 100%;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            min-height: 500px;
        }

        .cert-a4-canvas {
            width: 850px;
            height: 1202px;
            background: var(--cert-bg);
            position: relative;
            transform-origin: center center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            font-family: var(--cert-font);
        }
        
        .cert-a4-canvas-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
        }

        .cert-border-outer { position: absolute; inset: 28px; border: 2px solid var(--cert-gold); pointer-events: none; z-index: 10; }
        .cert-border-inner { position: absolute; inset: 36px; border: 6px solid var(--cert-navy); pointer-events: none; z-index: 10; }
        .cert-border-inner::before, .cert-border-inner::after { content: ''; position: absolute; width: 28px; height: 28px; border: 3px solid var(--cert-gold); }
        .cert-border-inner::before { top: -10px; left: -10px; border-right: none; border-bottom: none; }
        .cert-border-inner::after { bottom: -10px; right: -10px; border-left: none; border-top: none; }

        .corner { position: absolute; width: 36px; height: 36px; background: transparent; border: 2px solid var(--cert-gold); z-index: 11; }
        .corner.tl { top: 32px; left: 32px; border-right: none; border-bottom: none; }
        .corner.tr { top: 32px; right: 32px; border-left: none; border-bottom: none; }
        .corner.bl { bottom: 32px; left: 32px; border-right: none; border-top: none; }
        .corner.br { bottom: 32px; right: 32px; border-left: none; border-top: none; }

        .cert-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.035; pointer-events: none; z-index: 1; }
        .cert-watermark img { width: 400px; height: 400px; object-fit: contain; filter: grayscale(100%); }

        .cert-content { position: absolute; inset: 48px; z-index: 5; display: flex; flex-direction: column; padding: 5px 36px; }

        .c-header { display: flex; align-items: center; justify-content: center; margin-bottom: 18px; position: relative; min-height: 110px; padding: 0 10px; }
        .c-logo { position: absolute; left: -30px; top: 50%; transform: translateY(-50%); width: 100px; height: 100px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .c-logo img { width: 100%; height: 100%; object-fit: contain; }
        .c-logo-placeholder { font-size: 42px; }

        .c-school-info { text-align: center; width: 100%; padding: 0; display: flex; flex-direction: column; align-items: center; }
        .c-school-name { font-family: var(--cert-font); font-weight: 900; font-size: 50px; letter-spacing: 2px; color: #0b3b8c; text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.08); line-height: 1.3; white-space: nowrap; }
        .c-school-rc { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: 700; color: #2d3748; letter-spacing: 0.3px; line-height: 1.4; white-space: nowrap; }
        .c-school-addr { font-family: 'Arial', sans-serif; font-size: 17px; font-weight: 700; color: var(--cert-navy); letter-spacing: 0.8px; line-height: 1.3; white-space: nowrap; }

        .c-title { text-align: center; font-family: var(--cert-font); font-weight: 700; font-size: 28px; color: var(--cert-navy); letter-spacing: 5px; text-transform: uppercase; margin: 0 0 20px 0; text-decoration: underline; text-underline-offset: 10px; text-decoration-thickness: 3px; text-decoration-color: #000000; white-space: nowrap; }

        .c-meta-boxes { display: flex; justify-content: space-between; margin: 0 0 45px 0; font-family: var(--cert-font); font-size: 16px; font-weight: 600; color: var(--cert-navy); }
        .c-meta-box { border: 2px solid var(--cert-navy); padding: 6px 18px; border-radius: 4px; background: rgba(255, 255, 255, 0.6); display: inline-block; white-space: nowrap; }
        .c-meta-box span { font-weight: 400; color: var(--cert-text); }

        .c-body { font-family: var(--cert-font); font-size: 19px; line-height: 1.6; color: var(--cert-text); text-align: justify; padding: 0 4px; margin-bottom: 12px; }
        .c-body .p1 { text-align: left; text-align-last: left; margin-bottom: 8px; }
        .c-body .p2 { text-align: left; text-align-last: left; margin-bottom: 10px; }
        .c-body .p3 { text-align: justify; text-align-last: left; font-weight: 500; margin-bottom: 8px; }

        .c-label { font-style: italic; color: #4a5568; margin: 0 2px; }
        .c-value { font-family: var(--cert-font); font-weight: 600; font-size: 20px; color: var(--cert-navy); display: inline; border-bottom: 2px dotted #a0aec0; padding: 0 6px; text-align: center; }
        .c-value-lg { min-width: 140px; font-size: 20px; }

        .c-table-wrap { margin: 6px 0 12px 0; border: 2px solid var(--cert-navy); border-radius: 4px; overflow: hidden; }
        .c-table-wrap table { width: 100%; border-collapse: collapse; font-family: 'Arial', sans-serif; font-size: 15px !important; }
        .c-table-wrap td { padding: 5px 10px; text-align: center; border-bottom: 2px solid #cbd5e1; font-size: 15px !important; }
        .c-table-wrap th { background: var(--cert-navy); color: #ffffff; padding: 6px 10px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 15px !important; }
        .c-table-wrap tr:last-child td { border-bottom: none; }

        .c-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 4px; margin-top: 6px; gap: 20px; }
        .c-meta { display: flex; flex-direction: column; gap: 8px; }
        .c-meta-line { font-family: var(--cert-font); font-size: 17px; color: var(--cert-text); }
        .c-meta-line .c-value { font-size: 17px; min-width: 160px; text-align: left; border-bottom: 2px dotted #a0aec0; }
        .c-signature { text-align: center; min-width: 200px; }
        .c-sig-line { border-bottom: 2px solid var(--cert-navy); margin-bottom: 10px; height: 130px; }
        .c-sig-label { font-family: var(--cert-font); font-size: 16px; font-weight: 700; color: var(--cert-navy); letter-spacing: 1px; text-transform: uppercase; }

        /* EXACT PRINT CSS */
        @media print {
            .no-print { display: none !important; }
            html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: #fff !important; 
            }
            @page { size: A4 portrait; margin: 0; }
            .print-container { 
                display: block !important; 
                width: 210mm !important; 
                margin: 0 auto; 
                padding: 0;
            }
            .cert-a4-canvas { 
                position: relative !important; 
                transform: none !important; 
                box-shadow: none !important; 
                width: 210mm !important; 
                height: 296.8mm !important; 
                page-break-after: always;
                page-break-inside: avoid;
                margin: 0 auto;
                background: #FDFBF7 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .cert-a4-canvas {
                zoom: 0.93;
            }
        }
        `}</style>

        <div className="no-print shrink-0">
            <PageHeader 
                title="Study Certificate Generator" 
                icon={<GraduationCap className="w-5 h-5" />} 
            />
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden no-print">
            
            {/* SIDEBAR */}
            <div className="w-full lg:w-[420px] flex flex-col bg-white border-r border-slate-200 shadow-xl z-10 shrink-0">
                {/* TABS */}
                <div className="flex border-b border-slate-200 shrink-0">
                    <button 
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all ${mode === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <FileText className="w-4 h-4" /> Manual Entry
                    </button>
                    <button 
                        onClick={() => setMode('bulk')}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-all ${mode === 'bulk' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Database className="w-4 h-4" /> Bulk / Class
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {/* COMMON SHARED FIELDS (ALWAYS VISIBLE) */}
                    <div className="mb-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                {logoDataUrl ? <img src={logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-2xl opacity-50">🏫</span>}
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-700 mb-1">School Logo</label>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs w-full text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Common Settings</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">UDISE Code</label>
                                        <input type="text" value={mUdise} onChange={e => setMUdise(e.target.value)} placeholder="Auto-saves..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Conduct & Character</label>
                                        <select value={mConduct} onChange={e => setMConduct(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none cursor-pointer">
                                            <option value="Excellent">Excellent</option>
                                            <option value="Very Good">Very Good</option>
                                            <option value="Good">Good</option>
                                            <option value="Satisfactory">Satisfactory</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Place</label>
                                        <input type="text" value={mPlace} onChange={e => setMPlace(e.target.value)} placeholder="e.g. Srikakulam" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                                        <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer text-slate-700" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Academic Records (Applies to all)</h3>
                            <div className="space-y-3">
                                {academicRows.map((row, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input type="text" value={row.year} onChange={e => { const r = [...academicRows]; r[idx].year = e.target.value; setAcademicRows(r); }} placeholder="Year" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                        <input type="text" value={row.class} onChange={e => { const r = [...academicRows]; r[idx].class = e.target.value; setAcademicRows(r); }} placeholder="Class" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                        <input type="text" value={row.remarks} onChange={e => { const r = [...academicRows]; r[idx].remarks = e.target.value; setAcademicRows(r); }} placeholder="Remarks" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                        <button onClick={() => setAcademicRows(academicRows.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setAcademicRows([...academicRows, { year: '', class: '', remarks: '' }])} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors">
                                    <Plus className="w-3.5 h-3.5" /> Add Class Record
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* MODE SPECIFIC FIELDS */}
                    {mode === 'manual' ? (
                        <div className="space-y-6 animate-fade-in-up border-t-2 border-dashed border-slate-200 pt-6">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Student Data (Manual / Autofill)</h3>
                                
                                {/* Class/Section Dropdowns to fetch students for autofill */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); setSelectedStudentId(''); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                                        <option value="">Select Class...</option>
                                        {uniqueClassNames.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setSelectedStudentId(''); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" disabled={!selectedClass}>
                                        <option value="">Select Section...</option>
                                        {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {students.length > 0 && (
                                    <div className="mb-4">
                                        <select value={selectedStudentId} onChange={e => handleManualStudentSelect(e.target.value)} className="w-full px-3 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                                            <option value="">-- Select Student to Autofill --</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Full Name</label>
                                        <input type="text" value={mStudent} onChange={e => setMStudent(e.target.value)} placeholder="e.g. K. Aditya" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Son / Daughter of</label>
                                        <input type="text" value={mParent} onChange={e => setMParent(e.target.value)} placeholder="e.g. Sri K. Ramesh" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admission No.</label>
                                        <input type="text" value={mAdmission} onChange={e => setMAdmission(e.target.value)} placeholder="e.g. 2538" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in-up border-t-2 border-dashed border-slate-200 pt-6">
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Select Class for Bulk</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold text-slate-700">
                                        <option value="">Select Class...</option>
                                        {uniqueClassNames.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold text-slate-700" disabled={!selectedClass}>
                                        <option value="">Select Section...</option>
                                        {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {selectedClass && selectedSection && students.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-600">Students ({students.length})</h3>
                                        <div className="flex gap-3">
                                            <button onClick={() => setBulkSelectedIds(students.map(s => s.id))} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Select All</button>
                                            <button onClick={() => setBulkSelectedIds([])} className="text-xs font-bold text-slate-500 hover:text-slate-700">None</button>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 custom-scrollbar">
                                        {students.map(s => {
                                            const isSelected = bulkSelectedIds.includes(s.id);
                                            return (
                                                <div 
                                                    key={s.id} 
                                                    onClick={() => {
                                                        if (isSelected) setBulkSelectedIds(prev => prev.filter(id => id !== s.id));
                                                        else setBulkSelectedIds(prev => [...prev, s.id]);
                                                    }}
                                                    className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{s.firstName} {s.lastName}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        {bulkSelectedIds.length} Students Selected for Generation
                                    </div>
                                </div>
                            )}

                            {selectedClass && selectedSection && students.length === 0 && (
                                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                                    No students found in this section.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
                {/* PREVIEW HEADER */}
                <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10 no-print">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-slate-800">Live Preview</h2>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide">A4 PORTRAIT</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {mode === 'bulk' && bulkSelectedIds.length > 0 && (
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 mr-4 border border-slate-200">
                                <button onClick={() => setBulkIndex(Math.max(0, bulkIndex - 1))} disabled={bulkIndex === 0} className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 text-sm font-bold text-slate-700 min-w-[120px] text-center">View {bulkIndex + 1} of {bulkSelectedIds.length}</span>
                                <button onClick={() => setBulkIndex(Math.min(bulkSelectedIds.length - 1, bulkIndex + 1))} disabled={bulkIndex === bulkSelectedIds.length - 1} className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        
                        {mode === 'manual' || bulkSelectedIds.length === 0 ? (
                            <>
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70">
                                    {isExporting ? 'Generating...' : <><Download className="w-4 h-4" /> Export PDF</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                                    <Printer className="w-4 h-4" /> Print All ({bulkSelectedIds.length})
                                </button>
                                <button onClick={handleGenerateZip} disabled={isZipping} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70">
                                    {isZipping ? 'Zipping...' : <><Download className="w-4 h-4" /> ZIP ({bulkSelectedIds.length} PDFs)</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* CANVAS WRAPPER (SCREEN PREVIEW) */}
                <div ref={viewportRef} className="cert-viewport p-8 pb-16 overflow-y-auto bg-slate-100 no-print">
                    <div ref={canvasRef} className="cert-a4-canvas-wrapper">
                        {/* We use a wrapper to apply scale dynamically via React ref without breaking the 850x1202 dimension */}
                        <CertificateTemplate data={screenData} logo={logoDataUrl} rows={academicRows} id="cert-screen" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- HIDDEN PRINT / BULK ZIP CONTAINER --- */}
        {/* These elements are hidden on screen but visible during window.print(), or used by html2canvas for ZIP generation */}
        
        {/* 1. PRINT CONTAINER */}
        <div className="hidden print-container">
            {mode === 'manual' || bulkSelectedIds.length === 0 ? (
                <CertificateTemplate data={screenData} logo={logoDataUrl} rows={academicRows} id="cert-print-single" />
            ) : (
                bulkSelectedIds.map(id => {
                    const s = students.find(x => x.id === id);
                    if (!s) return null;
                    const data = {
                        student: `${s.firstName || ''} ${s.lastName || ''}`.trim() || defaultFields.student,
                        parent: s.fatherName || s.guardianName || defaultFields.parent,
                        conduct: mConduct || defaultFields.conduct,
                        admission: s.admissionNumber || defaultFields.admission,
                        udise: mUdise || defaultFields.udise,
                        place: mPlace || defaultFields.place,
                        date: mDate || defaultFields.date,
                    };
                    return <CertificateTemplate key={id} data={data} logo={logoDataUrl} rows={academicRows} id={`cert-print-${id}`} />
                })
            )}
        </div>

        {/* 2. ZIP GENERATION CONTAINER */}
        <div className="absolute top-[-20000px] left-[-20000px] opacity-0" ref={zipCanvasRef}>
            {mode === 'bulk' && isZipping && bulkSelectedIds.map(id => {
                const s = students.find(x => x.id === id);
                if (!s) return null;
                const data = {
                    student: `${s.firstName || ''} ${s.lastName || ''}`.trim() || defaultFields.student,
                    parent: s.fatherName || s.guardianName || defaultFields.parent,
                    conduct: mConduct || defaultFields.conduct,
                    admission: s.admissionNumber || defaultFields.admission,
                    udise: mUdise || defaultFields.udise,
                    place: mPlace || defaultFields.place,
                    date: mDate || defaultFields.date,
                };
                return (
                    <div key={id} id={`zip-cert-${id}`} className="bg-white" style={{width: CANVAS_W, height: CANVAS_H}}>
                        <CertificateTemplate data={data} logo={logoDataUrl} rows={academicRows} id={`inner-zip-cert-${id}`} />
                    </div>
                )
            })}
        </div>

    </div>
  );
};

export default StudyCertificatePage;
