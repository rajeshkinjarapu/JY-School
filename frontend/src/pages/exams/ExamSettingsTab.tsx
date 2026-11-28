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
      <div className="bg-white p-5 sm:p-6 rounded-[24px] border border-[#DDD7F3] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] p-3.5 rounded-2xl shadow-md shadow-indigo-500/20 text-white shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#1E1B4B]">
              Global Examination Master Settings
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Configure institutional branding, evaluation standards, admit card rules, and result publishing policies.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white shadow-md shadow-indigo-500/25 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          <span>Save Master Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: Institutional & Certificate Branding */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.08)] border border-[#DDD7F3] space-y-5 lg:col-span-2">
          <div className="border-b border-indigo-50 pb-3.5 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#5B21B6]" /> Institutional & Certificate Branding
            </h4>
            <span className="text-[11px] font-bold text-slate-400">Appears on all Hall Tickets & Progress Cards</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                School Legal Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. SRI VENKATESWARA JY SCHOOL"
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                School Subtitle / Affiliation
              </label>
              <input
                type="text"
                value={schoolSubtitle}
                onChange={(e) => setSchoolSubtitle(e.target.value)}
                placeholder="e.g. (IIT-JEE / NEET Foundation – Olympiads)"
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                Exam Center / Campus Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta"
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
              />
            </div>
          </div>

          {/* Media Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-indigo-50">
            <div className="bg-[#F8FAFF] p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#5B21B6]" /> School Official Logo
                </span>
                {logoUrl && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black">Loaded</span>}
              </div>

              <div className="h-20 bg-white border border-dashed border-indigo-200 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(logoUrl) ? (
                  <img src={resolveUrl(logoUrl)} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Logo Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white hover:bg-[#F2EDFF] border border-indigo-200 text-[#5B21B6] py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
              </label>
            </div>

            <div className="bg-[#F8FAFF] p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-amber-500" /> Principal Signature & Seal
                </span>
                {principalSignatureUrl && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black">Loaded</span>}
              </div>

              <div className="h-20 bg-white border border-dashed border-indigo-200 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(principalSignatureUrl) ? (
                  <img src={resolveUrl(principalSignatureUrl)} alt="Principal Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Signature Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white hover:bg-[#F2EDFF] border border-indigo-200 text-[#5B21B6] py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingPrincipalSign ? 'Uploading...' : 'Upload Principal Sign'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'principal')} />
              </label>
            </div>

            <div className="bg-[#F8FAFF] p-4 rounded-2xl border border-indigo-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[#1E1B4B] uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-500" /> Class Teacher Signature
                </span>
                {teacherSignatureUrl && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-black">Loaded</span>}
              </div>

              <div className="h-20 bg-white border border-dashed border-indigo-200 rounded-xl flex items-center justify-center p-2 mb-3 overflow-hidden">
                {resolveUrl(teacherSignatureUrl) ? (
                  <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">No Signature Uploaded</span>
                )}
              </div>

              <label className="w-full bg-white hover:bg-[#F2EDFF] border border-indigo-200 text-[#5B21B6] py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingTeacherSign ? 'Uploading...' : 'Upload Teacher Sign'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'teacher')} />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Evaluation & Grading Standards */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.08)] border border-[#DDD7F3] space-y-5">
          <div className="border-b border-indigo-50 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#5B21B6]" /> Evaluation & Grading Standards
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                Primary Grading Scale Mode
              </label>
              <select
                value={examGradingSystem}
                onChange={(e) => setExamGradingSystem(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all cursor-pointer"
              >
                <option value="CBSE Standard (A1-E2)">CBSE / CCE Standard (A1, A2, B1, B2, C1, C2, D, E)</option>
                <option value="State Board Standard (A+, A, B+, B, C, D)">State Board Standard (A+, A, B+, B, C, D)</option>
                <option value="Direct Percentage / Marks Only (Max 100%)">Direct Marks & Percentage (%)</option>
                <option value="10 Point GPA Scale (10, 9, 8, 7...)">10-Point GPA Scale (10, 9, 8, 7...)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                  Default Pass Marks (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examPassMarks}
                    onChange={(e) => setExamPassMarks(Number(e.target.value))}
                    className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-black text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                  Grace Marks Allowance
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={examGraceMarks}
                  onChange={(e) => setExamGraceMarks(Number(e.target.value))}
                  className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#F2EDFF]/70 rounded-xl border border-[#DDD7F3]">
              <p className="text-[11px] font-bold text-[#5B21B6]">
                Pass Threshold Notice: Students scoring below {examPassMarks}% will be marked as "Needs Focus / Failed" on printed Progress Cards and report cards automatically.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Hall Ticket & Admit Card Rules */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.08)] border border-[#DDD7F3] space-y-5">
          <div className="border-b border-indigo-50 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Hall Ticket & Admit Card Rules
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Default Examination Timings
              </label>
              <input
                type="text"
                value={examDefaultTiming}
                onChange={(e) => setExamDefaultTiming(e.target.value)}
                placeholder="09:30 AM - 12:30 PM"
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 block">
                Default Important Instructions for Candidates
              </label>
              <textarea
                rows={4}
                value={examAdmitCardInstructions}
                onChange={(e) => setExamAdmitCardInstructions(e.target.value)}
                placeholder="Enter line-by-line instructions..."
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl p-3 text-xs font-semibold text-[#1E1B4B] focus:ring-4 focus:ring-indigo-500/10 focus:border-[#5B21B6] outline-none transition-all resize-y leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">These instructions automatically populate all newly created Admit Cards.</span>
            </div>

            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div>
                <span className="text-xs font-black text-[#1E1B4B] block">Show Grading Scale on Hall Tickets</span>
                <span className="text-[11px] text-slate-500">Prints the grading breakdown (A1, A2...) on the reverse/footer</span>
              </div>
              <input
                type="checkbox"
                checked={examShowGradesOnAdmitCard}
                onChange={(e) => setExamShowGradesOnAdmitCard(e.target.checked)}
                className="w-4 h-4 text-[#5B21B6] rounded focus:ring-[#5B21B6]"
              />
            </label>
          </div>
        </div>

        {/* SECTION 4: Result Publication & Privacy Controls */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.08)] border border-[#DDD7F3] space-y-5">
          <div className="border-b border-indigo-50 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" /> Result Publication & Privacy Rules
            </h4>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div className="pr-4">
                <span className="text-xs font-black text-[#1E1B4B] block">Show Class Rank to Students / Parents</span>
                <span className="text-[11px] font-semibold text-slate-500">Display #1, #2 class rank in student app and printed progress cards</span>
              </div>
              <div
                onClick={(e) => { e.preventDefault(); setExamShowRank(!examShowRank); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors shrink-0 ${examShowRank ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examShowRank ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div className="pr-4">
                <span className="text-xs font-black text-[#1E1B4B] block">Print Student Photos on Cards</span>
                <span className="text-[11px] font-semibold text-slate-500">Display student passport photo on Progress Cards and Hall Tickets</span>
              </div>
              <div
                onClick={(e) => { e.preventDefault(); setExamShowStudentPhoto(!examShowStudentPhoto); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors shrink-0 ${examShowStudentPhoto ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examShowStudentPhoto ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div className="pr-4">
                <span className="text-xs font-black text-[#1E1B4B] block">Auto-Publish Results on Marks Entry</span>
                <span className="text-[11px] font-semibold text-slate-500">Make results visible to students immediately after marks entry</span>
              </div>
              <div
                onClick={(e) => { e.preventDefault(); setExamAutoPublish(!examAutoPublish); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors shrink-0 ${examAutoPublish ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examAutoPublish ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div className="pr-4">
                <span className="text-xs font-black text-[#1E1B4B] block">Strict Moderation (Marks Freeze)</span>
                <span className="text-[11px] font-semibold text-slate-500">Lock marks editing after publication to prevent unauthorized changes</span>
              </div>
              <div
                onClick={(e) => { e.preventDefault(); setExamStrictModeration(!examStrictModeration); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors shrink-0 ${examStrictModeration ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examStrictModeration ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 5: Parent Communication & SMS Automation */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_6px_22px_-8px_rgba(79,70,229,0.08)] border border-[#DDD7F3] space-y-5">
          <div className="border-b border-indigo-50 pb-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1E1B4B] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-500" /> Parent Communication & SMS Alerts
            </h4>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 border border-indigo-100 bg-[#F8FAFF] rounded-xl cursor-pointer hover:bg-white transition-colors">
              <div className="pr-4">
                <span className="text-xs font-black text-[#1E1B4B] block">Auto-Send Marks SMS to Parents</span>
                <span className="text-[11px] font-semibold text-slate-500">Automatically trigger marks summary SMS to parents on result publish</span>
              </div>
              <div
                onClick={(e) => { e.preventDefault(); setExamSendSms(!examSendSms); }}
                className={`relative inline-block w-12 h-6 rounded-full transition-colors shrink-0 ${examSendSms ? 'bg-rose-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${examSendSms ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Live SMS Template Preview */}
            <div className="p-4 bg-[#F8FAFF] rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                <Smartphone className="w-4 h-4 text-rose-500" /> Live SMS Message Format
              </div>
              <div className="p-3 bg-white rounded-xl border border-indigo-100 font-mono text-[11px] text-slate-700 leading-relaxed shadow-xs">
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
          className="bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white shadow-xl shadow-indigo-500/30 px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 cursor-pointer hover:-translate-y-0.5 disabled:opacity-50"
        >
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
          <span>Save Master Settings</span>
        </button>
      </div>
    </div>
  );
};
