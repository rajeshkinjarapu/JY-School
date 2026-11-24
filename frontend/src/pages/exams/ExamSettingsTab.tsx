import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
  Settings, Award, CheckSquare, ShieldAlert, Save, Upload, 
  Building, MapPin, Image as ImageIcon, PenTool, Clock, 
  FileText, MessageSquare, Check, Eye, HelpCircle, Lock,
  GraduationCap, Smartphone
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const ExamSettingsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Institutional Branding
  const [schoolName, setSchoolName] = useState('SRI VENKATESWARA JY SCHOOL');
  const [schoolSubtitle, setSchoolSubtitle] = useState('(IIT-JEE / NEET Foundation – Olympiads)');
  const [address, setAddress] = useState('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta');
  const [logoUrl, setLogoUrl] = useState('');
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState('');
  const [teacherSignatureUrl, setTeacherSignatureUrl] = useState('');

  // 2. Evaluation & Grading Standards
  const [examGradingSystem, setExamGradingSystem] = useState('CBSE Standard (A1-E2)');
  const [examPassMarks, setExamPassMarks] = useState<number>(35);
  const [defaultMaxMarks, setDefaultMaxMarks] = useState<number>(100);
  const [examGraceMarks, setExamGraceMarks] = useState<number>(5);

  // 3. Hall Ticket & Admit Card Rules
  const [examDefaultTiming, setExamDefaultTiming] = useState('09:30 AM - 12:30 PM');
  const [examShowGradesOnAdmitCard, setExamShowGradesOnAdmitCard] = useState(false);
  const [examAdmitCardInstructions, setExamAdmitCardInstructions] = useState(
    '1. Candidate must carry this Admit Card to the examination hall.\n2. Electronic devices including calculators and mobile phones are strictly prohibited.\n3. Candidate should report to the examination center 30 minutes before commencement.'
  );

  // 4. Result Publishing & Privacy Controls
  const [examShowRank, setExamShowRank] = useState(true);
  const [examAutoPublish, setExamAutoPublish] = useState(false);
  const [examShowStudentPhoto, setExamShowStudentPhoto] = useState(true);
  const [examStrictModeration, setExamStrictModeration] = useState(false);

  // 5. Communication & SMS
  const [examSendSms, setExamSendSms] = useState(true);

  // Image Uploading States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPrincipalSign, setUploadingPrincipalSign] = useState(false);
  const [uploadingTeacherSign, setUploadingTeacherSign] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url?: string) => {
    if (!url || url === 'null' || url === 'undefined') return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url === '/logo.png' || url === 'logo.png') return '/logo.png';
    return `${API_BASE.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/api/settings');
        const s = res.data?.data || res.data || {};
        
        if (s.schoolName) setSchoolName(s.schoolName);
        if (s.schoolSubtitle) setSchoolSubtitle(s.schoolSubtitle);
        if (s.address) setAddress(s.address);
        if (s.logoUrl) setLogoUrl(s.logoUrl);
        if (s.principalSignatureUrl) setPrincipalSignatureUrl(s.principalSignatureUrl);
        if (s.teacherSignatureUrl) setTeacherSignatureUrl(s.teacherSignatureUrl);

        if (s.examGradingSystem) setExamGradingSystem(s.examGradingSystem);
        if (s.examPassMarks !== undefined) setExamPassMarks(Number(s.examPassMarks));
        if (s.examGraceMarks !== undefined) setExamGraceMarks(Number(s.examGraceMarks));

        if (s.examDefaultTiming) setExamDefaultTiming(s.examDefaultTiming);
        if (s.examShowGradesOnAdmitCard !== undefined) setExamShowGradesOnAdmitCard(Boolean(s.examShowGradesOnAdmitCard));
        if (s.examAdmitCardInstructions) setExamAdmitCardInstructions(s.examAdmitCardInstructions);

        if (s.examShowRank !== undefined) setExamShowRank(Boolean(s.examShowRank));
        if (s.examAutoPublish !== undefined) setExamAutoPublish(Boolean(s.examAutoPublish));
        if (s.examShowStudentPhoto !== undefined) setExamShowStudentPhoto(Boolean(s.examShowStudentPhoto));
        if (s.examStrictModeration !== undefined) setExamStrictModeration(Boolean(s.examStrictModeration));

        if (s.examSendSms !== undefined) setExamSendSms(Boolean(s.examSendSms));
      } catch (err) {
        console.error('Failed to load exam settings:', err);
        toast.error('Failed to load exam settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'principal' | 'teacher') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    if (target === 'logo') setUploadingLogo(true);
    if (target === 'principal') setUploadingPrincipalSign(true);
    if (target === 'teacher') setUploadingTeacherSign(true);

    const toastId = toast.loading('Uploading file...');
    try {
      const res: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data?.data?.url || res.data?.url || res.url;
      if (uploadedUrl) {
        if (target === 'logo') setLogoUrl(uploadedUrl);
        if (target === 'principal') setPrincipalSignatureUrl(uploadedUrl);
        if (target === 'teacher') setTeacherSignatureUrl(uploadedUrl);
        toast.success('Uploaded successfully!', { id: toastId });
      } else {
        toast.error('Upload failed: Invalid response', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error uploading file', { id: toastId });
    } finally {
      if (target === 'logo') setUploadingLogo(false);
      if (target === 'principal') setUploadingPrincipalSign(false);
      if (target === 'teacher') setUploadingTeacherSign(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving examination settings...');
    try {
      const payload = {
        schoolName,
        schoolSubtitle,
        address,
        logoUrl,
        principalSignatureUrl,
        teacherSignatureUrl,
        examGradingSystem,
        examPassMarks,
        examGraceMarks,
        examDefaultTiming,
        examShowGradesOnAdmitCard,
        examAdmitCardInstructions,
        examShowRank,
        examAutoPublish,
        examShowStudentPhoto,
        examStrictModeration,
        examSendSms,
      };

      await api.post('/api/settings', payload);
      toast.success('Examination settings saved successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Failed to save exam settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400">
        <LoadingSpinner size="lg" />
        <span className="text-xs font-bold mt-4 uppercase tracking-wider">Loading Exam Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in-up">
      {/* Top Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 text-white shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              Global Examination Master Settings
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Configure institutional branding, evaluation standards, admit card rules, and result publishing policies.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/25 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 shrink-0"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          <span>Save Master Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: Institutional & Certificate Branding */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-5 lg:col-span-2">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" /> Institutional & Certificate Branding
            </h4>
            <span className="text-[11px] font-bold text-slate-400">Appears on all Hall Tickets & Progress Cards</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                School Legal Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. SRI VENKATESWARA JY SCHOOL"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                School Subtitle / Affiliation
              </label>
              <input
                type="text"
                value={schoolSubtitle}
                onChange={(e) => setSchoolSubtitle(e.target.value)}
                placeholder="e.g. (IIT-JEE / NEET Foundation – Olympiads)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Exam Center / Campus Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Media Uploads: Logo, Principal Signature, Teacher Signature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* School Logo */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> School Official Logo
                </span>
                {logoUrl && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Loaded</span>}
              </div>

              <div className="h-20 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(logoUrl) ? (
                  <img src={resolveUrl(logoUrl)} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Logo Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
              </label>
            </div>

            {/* Principal Signature */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-orange-500" /> Principal Signature & Seal
                </span>
                {principalSignatureUrl && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Loaded</span>}
              </div>

              <div className="h-20 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(principalSignatureUrl) ? (
                  <img src={resolveUrl(principalSignatureUrl)} alt="Principal Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Signature Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingPrincipalSign ? 'Uploading...' : 'Upload Principal Sign'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'principal')} />
              </label>
            </div>

            {/* Teacher Signature */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-500" /> Class Teacher Signature
                </span>
                {teacherSignatureUrl && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Loaded</span>}
              </div>

              <div className="h-20 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(teacherSignatureUrl) ? (
                  <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Signature Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingTeacherSign ? 'Uploading...' : 'Upload Teacher Sign'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacher')} />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Evaluation & Grading Standards */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" /> Evaluation & Grading Standards
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Primary Grading Scale Mode
              </label>
              <select
                value={examGradingSystem}
                onChange={(e) => setExamGradingSystem(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all cursor-pointer"
              >
                <option value="CBSE Standard (A1-E2)">CBSE / CCE Standard (A1, A2, B1, B2, C1, C2, D, E)</option>
                <option value="State Board Standard (A+, A, B+, B, C, D)">State Board Standard (A+, A, B+, B, C, D)</option>
                <option value="Direct Percentage / Marks Only (Max 100%)">Direct Marks & Percentage (%)</option>
                <option value="10 Point GPA Scale (10, 9, 8, 7...)">10-Point GPA Scale (10, 9, 8, 7...)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Default Pass Marks (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examPassMarks}
                    onChange={(e) => setExamPassMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-black text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Grace Marks Allowance
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={examGraceMarks}
                  onChange={(e) => setExamGraceMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <p className="text-[11px] font-bold text-purple-800 dark:text-purple-300">
                💡 Pass Threshold Notice: Students scoring below {examPassMarks}% will be marked as "Needs Focus / Failed" on printed Progress Cards and report cards automatically.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Hall Ticket & Admit Card Rules */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Hall Ticket & Admit Card Rules
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Default Examination Timings
              </label>
              <input
                type="text"
                value={examDefaultTiming}
                onChange={(e) => setExamDefaultTiming(e.target.value)}
                placeholder="09:30 AM - 12:30 PM"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Default Important Instructions for Candidates
              </label>
              <textarea
                rows={4}
                value={examAdmitCardInstructions}
                onChange={(e) => setExamAdmitCardInstructions(e.target.value)}
                placeholder="Enter line-by-line instructions..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-y leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">These instructions automatically populate all newly created Admit Cards.</span>
            </div>

            <label className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Grading Scale on Hall Tickets</span>
                <span className="text-[11px] text-slate-500">Prints the grading breakdown (A1, A2...) on the reverse/footer</span>
              </div>
              <input
                type="checkbox"
                checked={examShowGradesOnAdmitCard}
                onChange={(e) => setExamShowGradesOnAdmitCard(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
              />
            </label>
          </div>
        </div>

        {/* SECTION 4: Result Publication & Privacy Controls */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-500" /> Result Publication & Privacy Rules
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Show Class Rank to Students / Parents</span>
                <span className="text-[11px] font-semibold text-slate-500">Display #1, #2 class rank in student app and printed progress cards</span>
              </div>
              <div 
                onClick={(e) => { e.preventDefault(); setExamShowRank(!examShowRank); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors ${examShowRank ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examShowRank ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Print Student Photos on Cards</span>
                <span className="text-[11px] font-semibold text-slate-500">Display student passport photo on Progress Cards and Hall Tickets</span>
              </div>
              <div 
                onClick={(e) => { e.preventDefault(); setExamShowStudentPhoto(!examShowStudentPhoto); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors ${examShowStudentPhoto ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examShowStudentPhoto ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Auto-Publish Results on Marks Entry</span>
                <span className="text-[11px] font-semibold text-slate-500">Make results visible to students immediately after marks entry</span>
              </div>
              <div 
                onClick={(e) => { e.preventDefault(); setExamAutoPublish(!examAutoPublish); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors ${examAutoPublish ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examAutoPublish ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Strict Moderation (Marks Freeze)</span>
                <span className="text-[11px] font-semibold text-slate-500">Lock marks editing after publication to prevent unauthorized changes</span>
              </div>
              <div 
                onClick={(e) => { e.preventDefault(); setExamStrictModeration(!examStrictModeration); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors ${examStrictModeration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examStrictModeration ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 5: Parent Communication & SMS Automation */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" /> Parent Communication & SMS Alerts
            </h4>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Auto-Send Marks SMS to Parents</span>
                <span className="text-[11px] font-semibold text-slate-500">Automatically trigger marks summary SMS to parents on result publish</span>
              </div>
              <div 
                onClick={(e) => { e.preventDefault(); setExamSendSms(!examSendSms); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors ${examSendSms ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examSendSms ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Live SMS Template Preview */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Smartphone className="w-4 h-4 text-rose-500" /> Live SMS Message Format
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs">
                "Dear Parent, marks for <strong>BORA GEHENAJNA</strong> in <strong>JEE MAINS MODEL EXAMINATION</strong>: Maths: 100, Physics: 96, Chemistry: 100. Total: 296/300 (98.7%). Rank: #1. - {schoolName}"
              </div>
              <p className="text-[10px] text-slate-400">This format matches the approved DLT SMS gateway template configured on the server.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Save Action Footer */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-600/30 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 cursor-pointer hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
          <span>Save Master Settings</span>
        </button>
      </div>
    </div>
  );
};
