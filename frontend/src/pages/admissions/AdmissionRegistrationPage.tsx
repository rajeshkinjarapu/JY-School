import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Trash2, CheckCircle2, 
  Printer, Phone, User, 
  CreditCard, RefreshCw, QrCode, Copy, Check, UserCheck, Calendar,
  Upload, FileText, Eye, AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AdmissionPrintModal } from './AdmissionPrintModal';

const STANDARD_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export const AdmissionRegistrationPage: React.FC = () => {
  const classesList = STANDARD_CLASSES;
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [qrConfig, setQrConfig] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);

  // Logged in user info (Teacher / Admin)
  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; role?: string }>({});

  // Teachers list for Cash collection
  const [teachers, setTeachers] = useState<any[]>([]);
  const [cashReceivedTeacherName, setCashReceivedTeacherName] = useState('');
  const [cashReceivedTeacherId, setCashReceivedTeacherId] = useState('');

  // Form State
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [classApplied, setClassApplied] = useState('Class 1');
  const [academicYear, setAcademicYear] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  });
  const [address, setAddress] = useState('');
  const [admissionFee, setAdmissionFee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [studentImage, setStudentImage] = useState('');

  // Payment receipt for UPI
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Uploading state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submitted Application Success State
  const [submittedAdmission, setSubmittedAdmission] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch initial data: teachers, settings, config, current user
  useEffect(() => {
    // Current user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Teacher';
        setCurrentUser({
          id: u.id,
          name: name,
          role: u.role || 'TEACHER'
        });
        setCashReceivedTeacherName(name);
        setCashReceivedTeacherId(u.id || '');
      }
    } catch (e) {}

    // Teachers for cash payment dropdown
    api.get('/api/teachers?limit=500').then(res => {
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) setTeachers(list);
    }).catch(() => {});

    api.get('/api/settings').then(res => {
      if (res.data) setSchoolSettings(res.data);
    }).catch(() => {});

    api.get('/api/admissions/config').then(res => {
      if (res.data) setQrConfig(res.data);
    }).catch(() => {});
  }, []);

  // Handle Photo Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    const toastId = toast.loading('Uploading student photo...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setStudentImage(uploadedUrl);
        toast.success('Photo uploaded successfully!', { id: toastId });
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle UPI Payment Receipt Upload
  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Receipt file must be under 10MB');
      return;
    }

    setIsUploadingReceipt(true);
    const toastId = toast.loading('Uploading payment receipt...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = file.type.startsWith('image/') ? '/api/uploads/image' : '/api/uploads/document';
      const res: any = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data?.url || res.url;
      if (uploadedUrl) {
        setPaymentReceipt(uploadedUrl);
        toast.success('Payment receipt uploaded successfully!', { id: toastId });
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err: any) {
      console.error('Receipt upload failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload receipt', { id: toastId });
    } finally {
      setIsUploadingReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  // Copy UPI ID
  const handleCopyUpi = (upi: string) => {
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Submit Admission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error('Student Full Name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Parent Mobile Number is required');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    // Mandatory UPI Receipt Check
    if (paymentMethod === 'UPI' && !paymentReceipt) {
      toast.error('Payment receipt / transaction screenshot is mandatory for UPI payments');
      return;
    }

    // Mandatory Cash Teacher Check
    if (paymentMethod === 'CASH' && !cashReceivedTeacherName) {
      toast.error('Please select the teacher who received the cash payment');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting student registration...');

    try {
      const payload = {
        studentName: studentName.trim(),
        fatherName: fatherName.trim() || undefined,
        motherName: motherName.trim() || undefined,
        phone: phone.trim(),
        aadharNo: aadharNo.trim() || undefined,
        dob: dob || undefined,
        gender,
        classApplied,
        academicYear,
        address: address.trim() || undefined,
        studentImage: studentImage || undefined,
        admissionFee: admissionFee.trim() || undefined,
        paymentMethod,
        paymentReceipt: paymentMethod === 'UPI' ? paymentReceipt : undefined,
        cashReceivedByName: paymentMethod === 'CASH' ? cashReceivedTeacherName : undefined,
        cashReceivedById: paymentMethod === 'CASH' ? cashReceivedTeacherId : undefined,
        paymentStatus: (paymentMethod === 'CASH' || (paymentMethod === 'UPI' && paymentReceipt)) && admissionFee ? 'COMPLETED' : 'PENDING',
        registeredByName: currentUser.name || undefined,
        registeredById: currentUser.id || undefined
      };

      const res: any = await api.post('/api/admissions/apply', payload);
      const admissionData = res.data?.data || res.data || res;

      if (admissionData && (admissionData.id || admissionData.studentName)) {
        toast.success('Student Registered Successfully!', { id: toastId });
        setSubmittedAdmission(admissionData);
      } else {
        throw new Error(res.data?.message || res.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Submit Admission Error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit admission';
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form for another student
  const handleResetForm = () => {
    setStudentName('');
    setFatherName('');
    setMotherName('');
    setPhone('');
    setAadharNo('');
    setDob('');
    setGender('Male');
    setClassApplied('Class 1');
    setAddress('');
    setAdmissionFee('');
    setPaymentMethod('CASH');
    setPaymentReceipt('');
    setCashReceivedTeacherName(currentUser.name || '');
    setCashReceivedTeacherId(currentUser.id || '');
    setStudentImage('');
    setSubmittedAdmission(null);
  };

  // URL Resolver helper for backend images
  const resolveFileUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998').replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return `${baseUrl}/${url.replace(/^\/+/, '')}`;
  };

  // UPI Info
  const activeUpiId = qrConfig?.upiId || schoolSettings?.upiId || 'jyschool@upi';
  const schoolName = schoolSettings?.schoolName || qrConfig?.schoolName || 'JY School';
  const rawQr = qrConfig?.qrCodeUrl || schoolSettings?.qrCodeUrl;
  const directQrUrl = rawQr ? resolveFileUrl(rawQr) : null;
  const dynamicQrCodeUrl = activeUpiId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=${schoolName}&am=${admissionFee || ''}&cu=INR`)}`
    : null;

  return (
    <div className="flex-1 overflow-auto bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Admission Registration" 
        icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
      />

      {/* Main Full-Width Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">

        {/* SUCCESS CARD AFTER REGISTRATION */}
        {submittedAdmission ? (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden p-6 sm:p-10 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 uppercase tracking-wider">
              Registration Successful
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {submittedAdmission.studentName}
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Class Applied: <span className="text-indigo-600 font-bold">{submittedAdmission.classApplied}</span> • AY: <span className="font-bold text-slate-700">{submittedAdmission.academicYear || academicYear}</span> • App No: <span className="font-mono font-bold text-slate-800">ADM-{submittedAdmission.id?.slice(0, 6).toUpperCase()}</span>
            </p>

            {submittedAdmission.registeredByName && (
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Registered by: <span className="font-bold text-slate-700">{submittedAdmission.registeredByName}</span>
              </p>
            )}

            {/* Student Photo Preview */}
            {submittedAdmission.studentImage && (
              <div className="mt-5 flex justify-center">
                <img 
                  src={submittedAdmission.studentImage} 
                  alt="Student" 
                  className="w-24 h-28 object-cover rounded-xl border-2 border-indigo-200 shadow-md"
                />
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Admission Form (PDF)
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Register Another Student
              </button>
            </div>
          </div>
        ) : (

          /* ADMISSION REGISTRATION FORM - FULL WIDTH */
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            
            {/* REGISTERED BY TEACHER BANNER */}
            {currentUser.name && (
              <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Registering As: <span className="font-black text-indigo-950">{currentUser.name}</span> ({currentUser.role || 'Staff'})</span>
                </div>
                <div className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-md border border-indigo-200">
                  AY: {academicYear}
                </div>
              </div>
            )}

            {/* CARD 1: STUDENT PHOTO & BASIC INFO */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">1. Student Details</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-indigo-100">
                  Passport Photo & Particulars
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Student Photo Picker */}
                  <div className="flex flex-col items-center mx-auto md:mx-0 shrink-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-32 h-40 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-xs"
                    >
                      {studentImage ? (
                        <>
                          <img src={studentImage} alt="Student Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs font-bold flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg">
                              <Camera className="w-3.5 h-3.5" /> Change
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3">
                          {isUploadingPhoto ? (
                            <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
                          ) : (
                            <Camera className="w-7 h-7 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          )}
                          <p className="text-xs font-black text-indigo-900">Upload Photo</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">JPG / PNG / WEBP</p>
                        </div>
                      )}
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoSelect} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {studentImage && (
                      <button
                        type="button"
                        onClick={() => setStudentImage('')}
                        className="mt-2 text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Fields Grid - Multi Column */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Student Name */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Student Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="Enter student full name"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Class Applied For */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Class Applied For <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={classApplied}
                        onChange={e => setClassApplied(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        {classesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        <option value="2026-2027">2026-2027</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2027-2028">2027-2028</option>
                      </select>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              gender === g
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {g === 'Male' ? '👦 Boy' : '👧 Girl'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Date of Birth
                      </label>
                      <input 
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Aadhaar Number */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Aadhaar Number
                      </label>
                      <input 
                        type="text"
                        maxLength={12}
                        value={aadharNo}
                        onChange={e => setAadharNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit Aadhaar number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PARENT & CONTACT DETAILS */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">2. Parent & Contact Details</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-emerald-100">
                  Primary Contact Info
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Father Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Father Name
                  </label>
                  <input 
                    type="text"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    placeholder="Enter father full name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Mother Name
                  </label>
                  <input 
                    type="text"
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                    placeholder="Enter mother full name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Primary Mobile Phone */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Contact Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Residential Address
                  </label>
                  <textarea 
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter full residential address (Door No, Street, Village/Town, Mandal, District)"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

              </div>
            </div>

            {/* CARD 3: APPLICATION FEE & PAYMENT WITH QR CODE */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-purple-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">3. Application Fee & Payment Mode</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-purple-100">
                  {paymentMethod === 'UPI' ? 'UPI Scan & Receipt Upload' : paymentMethod === 'CASH' ? 'Cash Collection Verification' : 'Pay Later at Office'}
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Fee Controls (Left Column or Full Width if Cash/Later) */}
                <div className={paymentMethod === 'UPI' ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
                  <div className={`grid grid-cols-1 gap-4 ${paymentMethod === 'CASH' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {/* Fee Amount */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Application Fee Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={admissionFee}
                        onChange={e => setAdmissionFee(e.target.value)}
                        placeholder="Enter fee amount (₹)"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={e => {
                          const m = e.target.value;
                          setPaymentMethod(m);
                          if (m !== 'UPI') setPaymentReceipt('');
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                      >
                        <option value="CASH">Cash Payment</option>
                        <option value="UPI">UPI / Online QR Payment</option>
                        <option value="LATER">Pay Later at School Office</option>
                      </select>
                    </div>

                    {/* Cash Received By Teacher (ONLY IF CASH) */}
                    {paymentMethod === 'CASH' && (
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Cash Received By Teacher *</span>
                          <span className="text-[10px] text-amber-600 font-bold">Required</span>
                        </label>
                        <select
                          value={cashReceivedTeacherName}
                          onChange={e => {
                            const selectedName = e.target.value;
                            setCashReceivedTeacherName(selectedName);
                            const found = teachers.find(t => (t.user?.name || t.name) === selectedName);
                            setCashReceivedTeacherId(found?.id || '');
                          }}
                          className="w-full px-4 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
                        >
                          <option value="">-- Select Teacher who received cash --</option>
                          {currentUser.name && (
                            <option value={currentUser.name}>{currentUser.name} (Logged-in User)</option>
                          )}
                          {teachers
                            .filter(t => (t.user?.name || t.name) !== currentUser.name)
                            .map(t => {
                              const tName = t.user?.name || t.name || 'Teacher';
                              const sub = t.subject ? ` (${t.subject})` : '';
                              return (
                                <option key={t.id} value={tName}>
                                  {tName}{sub}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* UPI Payment Receipt Upload Box (ONLY IF UPI) */}
                  {paymentMethod === 'UPI' && (
                    <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Upload Payment Receipt / Transaction Screenshot *</span>
                          <span className="text-[10px] bg-indigo-200 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Mandatory</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-semibold">JPG, PNG, PDF up to 10MB</span>
                      </div>

                      {paymentReceipt ? (
                        <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                              <Check className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                <span>Receipt Attached</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Verified</span>
                              </p>
                              <a 
                                href={resolveFileUrl(paymentReceipt)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 font-medium"
                              >
                                <Eye className="w-3 h-3" /> View uploaded receipt
                              </a>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentReceipt('')}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-indigo-100 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">Scan QR & attach payment confirmation screenshot</p>
                              <p className="text-[11px] text-slate-500">Take a screenshot of successful transaction from PhonePe/GPay</p>
                            </div>
                          </div>
                          <div>
                            <input 
                              type="file" 
                              ref={receiptInputRef} 
                              onChange={handleReceiptSelect} 
                              accept="image/*,application/pdf" 
                              className="hidden" 
                            />
                            <button
                              type="button"
                              disabled={isUploadingReceipt}
                              onClick={() => receiptInputRef.current?.click()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isUploadingReceipt ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              <span>{isUploadingReceipt ? 'Uploading...' : 'Choose Receipt File'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Policy and Info */}
                  <div className={`border rounded-xl p-3 text-xs ${
                    paymentMethod === 'UPI' ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900' :
                    paymentMethod === 'CASH' ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                    'bg-slate-100 border-slate-200 text-slate-800'
                  }`}>
                    <p className="font-bold">Application Fee Collection Policy:</p>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      {paymentMethod === 'UPI' && 'Application fee paid via UPI QR Code with attached receipt will be recorded directly into student admission inquiry records and reflected on the official admission receipt.'}
                      {paymentMethod === 'CASH' && `Cash application fee received by ${cashReceivedTeacherName || 'the assigned teacher'} will be credited into the collection records and reflected on the official admission receipt.`}
                      {paymentMethod === 'LATER' && 'Application fee will be recorded as PENDING and collected at the school accounts desk during physical verification.'}
                    </p>
                  </div>
                </div>

                {/* School UPI QR Code Card (ONLY IF UPI) */}
                {paymentMethod === 'UPI' && (
                  <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 mb-2">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span>School UPI Payment QR Code</span>
                    </div>

                    {/* QR Code Display with Error fallback */}
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                      {directQrUrl && !qrImgError ? (
                        <img 
                          src={directQrUrl} 
                          alt="School UPI QR" 
                          onError={() => setQrImgError(true)} 
                          className="w-36 h-36 object-contain" 
                        />
                      ) : dynamicQrCodeUrl ? (
                        <img 
                          src={dynamicQrCodeUrl} 
                          alt="School UPI QR" 
                          className="w-36 h-36 object-contain" 
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                          QR Code Available
                        </div>
                      )}
                    </div>

                    {/* UPI ID Pill */}
                    {activeUpiId && (
                      <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs">
                        <span className="text-xs font-mono font-bold text-slate-800">{activeUpiId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyUpi(activeUpiId)}
                          title="Copy UPI ID"
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 cursor-pointer transition-colors"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] font-semibold text-slate-500 mt-2">
                      Scan with PhonePe, Google Pay, Paytm or BHIM
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2.5 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Submit Student Registration
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Official A4 Print Modal */}
      {submittedAdmission && (
        <AdmissionPrintModal 
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          admission={submittedAdmission}
          schoolSettings={schoolSettings}
        />
      )}

    </div>
  );
};

export default AdmissionRegistrationPage;
