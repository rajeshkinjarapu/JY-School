import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Upload, ChevronLeft, ChevronRight, Plus, X, GraduationCap, FileText, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { useNavigate } from 'react-router-dom';

const CANVAS_W = 850;
const CANVAS_H = 1202;

export const StudyCertificatePage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  
  // Manual State
  const [mStudent, setMStudent] = useState('');
  const [mParent, setMParent] = useState('');
  const [mConduct, setMConduct] = useState('Excellent');
  const [mAdmission, setMAdmission] = useState('');
  const [mUdise, setMUdise] = useState('');
  const [mPlace, setMPlace] = useState('');
  const [mDate, setMDate] = useState('');
  const [academicRows, setAcademicRows] = useState<{year: string, class: string, remarks: string}[]>([
    { year: '2023-24', class: 'VI', remarks: '' },
    { year: '2024-25', class: 'VII', remarks: '' },
    { year: '2025-26', class: 'VIII', remarks: 'Pro wrote' }
  ]);

  // Bulk State
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [bulkIndex, setBulkIndex] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Resize canvas to fit viewport
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
    if (viewportRef.current) {
      observer.observe(viewportRef.current);
    }
    return () => observer.disconnect();
  }, [mode]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcel(file);
    e.target.value = '';
  };

  const processExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        if (rows.length < 2) throw new Error("File seems empty or missing data rows.");

        const headers = rows[0].map((h: any) => String(h).trim().toLowerCase().replace(/\s+/g, ''));
        const parsedData = [];

        const baseCols = ['student', 'parent', 'conduct', 'admission', 'udise', 'place', 'date'];
        const colMap: any = {};
        baseCols.forEach(col => {
            colMap[col] = headers.findIndex((h: string) => h === col);
        });

        const yearIndices: number[] = [], classIndices: number[] = [], remarksIndices: number[] = [];
        for (let i = 1; i <= 10; i++) {
            const yIdx = headers.findIndex((h: string) => h === `academicyear${i}`);
            const cIdx = headers.findIndex((h: string) => h === `class${i}`);
            const rIdx = headers.findIndex((h: string) => h === `remarks${i}`);
            if (yIdx !== -1 || cIdx !== -1 || rIdx !== -1) {
                yearIndices.push(yIdx);
                classIndices.push(cIdx);
                remarksIndices.push(rIdx);
            }
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.every((cell: any) => !String(cell).trim())) continue;
            const record: any = {};
            baseCols.forEach(col => {
                const idx = colMap[col];
                record[col] = (idx !== undefined && idx !== -1 && row[idx]) ? String(row[idx]).trim() : '';
            });
            
            const aRows = [];
            const maxRows = Math.max(yearIndices.length, classIndices.length, remarksIndices.length);
            for (let j = 0; j < maxRows; j++) {
                const year = (yearIndices[j] !== undefined && yearIndices[j] !== -1 && row[yearIndices[j]]) ? String(row[yearIndices[j]]).trim() : '';
                const cls = (classIndices[j] !== undefined && classIndices[j] !== -1 && row[classIndices[j]]) ? String(row[classIndices[j]]).trim() : '';
                const remarks = (remarksIndices[j] !== undefined && remarksIndices[j] !== -1 && row[remarksIndices[j]]) ? String(row[remarksIndices[j]]).trim() : '';
                if (year || cls || remarks) {
                    aRows.push({ year, class: cls, remarks });
                }
            }
            record.academicRows = aRows;
            parsedData.push(record);
        }

        if (parsedData.length > 0) {
            setBulkData(parsedData);
            setBulkIndex(0);
            setMode('bulk');
            toast.success(`Loaded ${parsedData.length} records successfully.`);
        } else {
            toast.error("No valid data found in Excel.");
        }
      } catch (err: any) {
        toast.error('Error reading Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
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
        
        // Force reflow
        void canvasRef.current.offsetWidth;

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
        
        const filename = mode === 'manual' 
            ? `Certificate_${currentData.student?.trim().replace(/\s+/g, '_') || 'Student'}.pdf`
            : `Certificate_${bulkIndex + 1}.pdf`;
            
        pdf.save(filename);
    } catch (err: any) {
        toast.error("Export failed: " + err.message);
    } finally {
        setIsExporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sampleData = [
        ['Student', 'Parent', 'Conduct', 'Admission', 'Udise', 'Place', 'Date',
            'AcademicYear1', 'Class1', 'Remarks1',
            'AcademicYear2', 'Class2', 'Remarks2',
            'AcademicYear3', 'Class3', 'Remarks3'
        ],
        ['K. Aditya', 'Sri K. Ramesh', 'Excellent', '2538', '2811230381', 'Tirupati', '09 July 2026',
            '2023-24', 'VI', '',
            '2024-25', 'VII', '',
            '2025-26', 'VIII', 'Pro wrote'
        ],
        ['M. Sneha', 'Smt. M. Lakshmi', 'Good', '2540', '2811230382', 'Narasannapeta', '15 Aug 2026',
            '2022-23', 'V', 'Good',
            '2023-24', 'VI', '',
            '', '', ''
        ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, 'Certificate_Template_Portrait.xlsx');
  };

  // Determine what data to render
  const defaultFields = {
    student: '_________________________',
    parent: '_________________________',
    conduct: '_______________',
    admission: '___________',
    udise: '___________',
    place: '_______________',
    date: '_______________'
  };

  let currentData: any = {};
  let currentRows: any[] = [];

  if (mode === 'manual') {
      currentData = {
          student: mStudent || defaultFields.student,
          parent: mParent || defaultFields.parent,
          conduct: mConduct || defaultFields.conduct,
          admission: mAdmission || defaultFields.admission,
          udise: mUdise || defaultFields.udise,
          place: mPlace || defaultFields.place,
          date: mDate || defaultFields.date,
      };
      currentRows = [...academicRows];
  } else if (mode === 'bulk' && bulkData.length > 0) {
      const record = bulkData[bulkIndex];
      currentData = {
          student: record.student || defaultFields.student,
          parent: record.parent || defaultFields.parent,
          conduct: record.conduct || defaultFields.conduct,
          admission: record.admission || defaultFields.admission,
          udise: record.udise || defaultFields.udise,
          place: record.place || defaultFields.place,
          date: record.date || defaultFields.date,
      };
      currentRows = record.academicRows || [];
  } else {
      currentData = { ...defaultFields };
  }

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
            position: absolute;
            transform-origin: center center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            transition: opacity 0.3s ease;
            font-family: var(--cert-font);
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

        @media print {
            .no-print { display: none !important; }
            .cert-viewport { min-height: unset !important; overflow: visible !important; display: block !important; padding: 0 !important; }
            @page { size: A4 portrait; margin: 0; }
            .cert-a4-canvas { position: static !important; transform: none !important; box-shadow: none !important; width: 210mm !important; height: 297mm !important; page-break-after: always; }
        }
        `}</style>

        <div className="no-print">
            <PageHeader 
                title="Study Certificate Generator" 
                icon={<GraduationCap className="w-5 h-5" />} 
            />
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden no-print">
            
            {/* SIDEBAR */}
            <div className="w-full lg:w-[420px] flex flex-col bg-white border-r border-slate-200 shadow-xl z-10 shrink-0">
                {/* TABS */}
                <div className="flex border-b border-slate-200">
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
                        <Database className="w-4 h-4" /> Bulk Excel
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'manual' ? (
                        <div className="space-y-6 animate-fade-in-up">
                            {/* Logo Upload */}
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
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Student Details</h3>
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
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Conduct & Character</label>
                                        <select value={mConduct} onChange={e => setMConduct(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none">
                                            <option value="Excellent">Excellent</option>
                                            <option value="Very Good">Very Good</option>
                                            <option value="Good">Good</option>
                                            <option value="Satisfactory">Satisfactory</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Certificate Numbers</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admission No.</label>
                                        <input type="text" value={mAdmission} onChange={e => setMAdmission(e.target.value)} placeholder="e.g. 2538" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">UDISE Code</label>
                                        <input type="text" value={mUdise} onChange={e => setMUdise(e.target.value)} placeholder="e.g. 281123..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Academic Records</h3>
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

                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 pb-2 border-b border-slate-100">Place & Date</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Place</label>
                                        <input type="text" value={mPlace} onChange={e => setMPlace(e.target.value)} placeholder="Tirupati" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                                        <input type="text" value={mDate} onChange={e => setMDate(e.target.value)} placeholder="09 July 2026" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 transition-all cursor-pointer relative overflow-hidden group">
                                <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">Drag & Drop Excel File</h4>
                                        <p className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <button onClick={downloadSampleTemplate} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1.5 mx-auto bg-indigo-50 hover:bg-indigo-100 py-2.5 px-5 rounded-xl transition-colors">
                                    <Download className="w-4 h-4" /> Download Sample Template
                                </button>
                            </div>

                            {bulkData.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                                        <h3 className="text-xs font-bold text-slate-600">Loaded Records ({bulkData.length})</h3>
                                        <button onClick={() => {setBulkData([]); setBulkIndex(0);}} className="text-xs font-semibold text-red-500 hover:text-red-700">Clear</button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-400 text-xs uppercase">
                                                    <th className="py-2 px-4 font-semibold">#</th>
                                                    <th className="py-2 px-4 font-semibold">Student</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {bulkData.slice(0, 10).map((row, i) => (
                                                    <tr key={i} className={i === bulkIndex ? 'bg-indigo-50/50' : ''}>
                                                        <td className="py-2.5 px-4 text-slate-500 font-medium">{i + 1}</td>
                                                        <td className="py-2.5 px-4 font-bold text-slate-700">{row.student}</td>
                                                    </tr>
                                                ))}
                                                {bulkData.length > 10 && (
                                                    <tr>
                                                        <td colSpan={2} className="py-3 text-center text-xs text-slate-400 font-medium">
                                                            ... and {bulkData.length - 10} more records
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW AREA */}
            <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden">
                {/* PREVIEW HEADER */}
                <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-slate-800">Live Preview</h2>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide">A4 PORTRAIT</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {mode === 'bulk' && bulkData.length > 0 && (
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 mr-4 border border-slate-200">
                                <button onClick={() => setBulkIndex(Math.max(0, bulkIndex - 1))} disabled={bulkIndex === 0} className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 text-sm font-bold text-slate-700 min-w-[120px] text-center">Record {bulkIndex + 1} of {bulkData.length}</span>
                                <button onClick={() => setBulkIndex(Math.min(bulkData.length - 1, bulkIndex + 1))} disabled={bulkIndex === bulkData.length - 1} className="p-1.5 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70">
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" /> Export PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* CANVAS WRAPPER */}
                <div ref={viewportRef} className="cert-viewport p-8 pb-16 overflow-y-auto bg-slate-100">
                    <div ref={canvasRef} className="cert-a4-canvas">
                        
                        {/* Borders */}
                        <div className="cert-border-outer"></div>
                        <div className="cert-border-inner"></div>
                        <div className="corner tl"></div>
                        <div className="corner tr"></div>
                        <div className="corner bl"></div>
                        <div className="corner br"></div>

                        {/* Watermark */}
                        <div className="cert-watermark">
                            {logoDataUrl && <img src={logoDataUrl} alt="watermark" />}
                        </div>

                        {/* Content */}
                        <div className="cert-content">
                            {/* HEADER */}
                            <div className="c-header">
                                <div className="c-logo">
                                    {logoDataUrl ? <img src={logoDataUrl} alt="Logo" /> : <span className="c-logo-placeholder">🏫</span>}
                                </div>
                                <div className="c-school-info">
                                    <div className="c-school-name">JY SCHOOL</div>
                                    <div className="c-school-rc">Rc. No. 281125100013 / Visakhapatnam/2025. Dated :21-10-2025</div>
                                    <div className="c-school-addr">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</div>
                                </div>
                            </div>

                            {/* TITLE */}
                            <div className="c-title">Study & Conduct Certificate</div>

                            {/* Meta boxes */}
                            <div className="c-meta-boxes">
                                <div className="c-meta-box">Admission No. : <span>{currentData.admission}</span></div>
                                <div className="c-meta-box">UDISE Code : <span>{currentData.udise}</span></div>
                            </div>

                            {/* BODY */}
                            <div className="c-body">
                                <div className="p1">
                                    <span className="c-label">This is to certify that</span>
                                    <span className="c-value c-value-lg">{currentData.student}</span>
                                    <span className="c-label">, Son/Daughter of</span>
                                    <span className="c-value c-value-lg">{currentData.parent}</span>
                                    <span className="c-label">, was a bona fide student of this institution.</span>
                                </div>
                                <div className="p2">
                                    <span className="c-label">During the period of study, the student's conduct, character, discipline, and behavior were found to be</span>
                                    <span className="c-value" style={{ fontStyle: 'italic' }}>{currentData.conduct}</span>
                                    <span className="c-label">. The student consistently maintained good moral values, complied with the rules and regulations of the institution, and demonstrated respectful behavior towards teachers, staff, and fellow students.</span>
                                </div>
                                <div className="p3">
                                    <span className="c-label">He/She studied the following classes during the years noted below, as recorded in the school records.</span>
                                </div>

                                {/* TABLE */}
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
                                            {currentRows.length === 0 ? (
                                                <tr><td colSpan={4} style={{ color: '#999' }}>No records</td></tr>
                                            ) : (
                                                currentRows.map((row, idx) => (
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

                                {/* FOOTER */}
                                <div className="c-footer">
                                    <div className="c-meta">
                                        <div className="c-meta-line">
                                            <span className="c-label" style={{ marginLeft: 0 }}>Place :</span>
                                            <span className="c-value">{currentData.place}</span>
                                        </div>
                                        <div className="c-meta-line">
                                            <span className="c-label" style={{ marginLeft: 0 }}>Date &nbsp;:</span>
                                            <span className="c-value">{currentData.date}</span>
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
                </div>

            </div>
        </div>
    </div>
  );
};

export default StudyCertificatePage;
