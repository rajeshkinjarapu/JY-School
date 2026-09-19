import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Trash2, CheckCircle2, 
  Printer, Phone, User, 
  CreditCard, RefreshCw, QrCode, Copy, Check, UserCheck, Calendar,
  Upload, FileText, Eye, AlertCircle, Users, Home, BookOpen,
  CheckSquare, Square, Plus, ShieldCheck, MapPin, Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AdmissionPrintModal } from './AdmissionPrintModal';
import { AP_LOCATIONS } from '../../utils/apLocations';

const STANDARD_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

interface SiblingItem {
  name: string;
  className: string;
  schoolName: string;
}

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

  // 1. Student Details State
  const [studentName, setStudentName] = useState('');
  const [classApplied, setClassApplied] = useState('Class 1');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [dob, setDob] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [motherTongue, setMotherTongue] = useState('Telugu');
  const [studentImage, setStudentImage] = useState('');

  // 2. Parent Particulars
  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [fatherAadhar, setFatherAadhar] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');

  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherAadhar, setMotherAadhar] = useState('');
  const [motherPhone, setMotherPhone] = useState('');

  const [phone, setPhone] = useState(''); // Primary contact phone
  const [alternatePhone, setAlternatePhone] = useState('');

  // 3. Demographics & Previous School
  const [nationality, setNationality] = useState('Indian');
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('BC-A');
  const [subCaste, setSubCaste] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');

  // 4. Residential Address Cascading Dropdowns
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Srikakulam');
  const [selectedMandal, setSelectedMandal] = useState('Narasannapeta');
  const [selectedVillage, setSelectedVillage] = useState('Narasannapeta Main (Ward 1)');
  const [customVillage, setCustomVillage] = useState('');
  const [doorNo, setDoorNo] = useState('');

  // 5. Sibling Details
  const [hasSiblings, setHasSiblings] = useState(false);
  const [siblings, setSiblings] = useState<SiblingItem[]>([
    { name: '', className: 'Class 1', schoolName: '' }
  ]);

  // 6. Application Fee & Payment
  const [admissionFee, setAdmissionFee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // 7. Terms and Conditions Acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Uploading state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submitted Application Success State
  const [submittedAdmission, setSubmittedAdmission] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sync primary phone with fatherPhone or motherPhone if empty
  useEffect(() => {
    if (!phone && fatherPhone) setPhone(fatherPhone);
  }, [fatherPhone, phone]);

  // Fetch initial data: teachers, settings, config, current user
  useEffect(() => {
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

  // Cascading Address Handlers
  const availableDistricts = AP_LOCATIONS.districts[selectedState] || ['Other District'];
  const availableMandals = AP_LOCATIONS.mandals[selectedDistrict] || ['Other Mandal'];
  const availableVillages = AP_LOCATIONS.villages[selectedMandal] || ['Other Village/Sachivalayam'];

  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const dists = AP_LOCATIONS.districts[st] || ['Other District'];
    setSelectedDistrict(dists[0] || '');
    const mnds = AP_LOCATIONS.mandals[dists[0]] || ['Other Mandal'];
    setSelectedMandal(mnds[0] || '');
    const vils = AP_LOCATIONS.villages[mnds[0]] || ['Other Village/Sachivalayam'];
    setSelectedVillage(vils[0] || '');
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    const mnds = AP_LOCATIONS.mandals[dist] || ['Other Mandal'];
    setSelectedMandal(mnds[0] || '');
    const vils = AP_LOCATIONS.villages[mnds[0]] || ['Other Village/Sachivalayam'];
    setSelectedVillage(vils[0] || '');
  };

  const handleMandalChange = (mnd: string) => {
    setSelectedMandal(mnd);
    const vils = AP_LOCATIONS.villages[mnd] || ['Other Village/Sachivalayam'];
    setSelectedVillage(vils[0] || '');
  };

  // Sibling Helpers
  const handleAddSibling = () => {
    setSiblings([...siblings, { name: '', className: 'Class 1', schoolName: '' }]);
  };

  const handleRemoveSibling = (index: number) => {
    setSiblings(siblings.filter((_, i) => i !== index));
  };

  const handleSiblingChange = (index: number, field: keyof SiblingItem, value: string) => {
    const updated = [...siblings];
    updated[index][field] = value;
    setSiblings(updated);
  };

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
      formData.append('image', file);
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setStudentImage(url);
        toast.success('Photo uploaded successfully!', { id: toastId });
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err: any) {
      console.error('Photo Upload Error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Payment Receipt Upload (for UPI)
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
      formData.append('image', file);
      const res = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setPaymentReceipt(url);
        toast.success('Receipt uploaded successfully!', { id: toastId });
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err: any) {
      console.error('Receipt Upload Error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload receipt', { id: toastId });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Helper to construct image URL
  const resolveFileUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_URL || 'http://66.116.252.191:19998';
    return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  // Active School UPI Config
  const activeUpiId = qrConfig?.upiId || schoolSettings?.upiId || 'jyschool@upi';
  const directQrUrl = resolveFileUrl(qrConfig?.qrCodeUrl || schoolSettings?.qrCodeUrl);
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${activeUpiId}&pn=JY%20School&cu=INR${admissionFee ? `&am=${admissionFee}` : ''}`
  )}`;

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

    const contactMobile = (phone || fatherPhone || motherPhone).trim();
    if (!contactMobile) {
      toast.error('At least one Contact Mobile Number (Father/Mother/Primary) is required');
      return;
    }
    if (contactMobile.replace(/\D/g, '').length < 10) {
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

    // Mandatory Terms Acceptance Check
    if (!termsAccepted) {
      toast.error('Please read and tick the Terms and Conditions agreement checkbox before submitting');
      return;
    }

    // Build consolidated residence address
    const finalVillage = selectedVillage === 'Other Village/Sachivalayam' ? customVillage : selectedVillage;
    const addressParts = [
      doorNo.trim(),
      finalVillage.trim(),
      selectedMandal.trim(),
      selectedDistrict.trim(),
      selectedState.trim()
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    // Filter valid siblings if enabled
    const validSiblings = hasSiblings
      ? siblings.filter(s => s.name.trim().length > 0)
      : [];

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting student registration...');

    try {
      const payload = {
        studentName: studentName.trim(),
        classApplied,
        academicYear,
        gender,
        dob: dob || undefined,
        aadharNo: aadharNo.trim() || undefined,
        motherTongue: motherTongue.trim() || undefined,
        studentImage: studentImage || undefined,

        // Parents info
        fatherName: fatherName.trim() || undefined,
        fatherOccupation: fatherOccupation.trim() || undefined,
        fatherAadhar: fatherAadhar.trim() || undefined,
        fatherPhone: fatherPhone.trim() || undefined,

        motherName: motherName.trim() || undefined,
        motherOccupation: motherOccupation.trim() || undefined,
        motherAadhar: motherAadhar.trim() || undefined,
        motherPhone: motherPhone.trim() || undefined,

        phone: contactMobile,
        alternatePhone: alternatePhone.trim() || undefined,

        // Demographics & Previous School
        nationality: nationality.trim() || 'Indian',
        religion: religion.trim() || undefined,
        caste: caste.trim() || undefined,
        subCaste: subCaste.trim() || undefined,
        previousSchool: previousSchool.trim() || undefined,

        // Residence
        state: selectedState,
        district: selectedDistrict,
        mandal: selectedMandal,
        village: finalVillage || undefined,
        doorNo: doorNo.trim() || undefined,
        address: fullAddress,

        // Siblings
        hasSiblings,
        siblingsData: hasSiblings ? JSON.stringify(validSiblings) : 'NA',

        // Fee & Payment
        admissionFee: admissionFee.trim() || undefined,
        paymentMethod,
        paymentReceipt: paymentMethod === 'UPI' ? paymentReceipt : undefined,
        cashReceivedByName: paymentMethod === 'CASH' ? cashReceivedTeacherName : undefined,
        cashReceivedById: paymentMethod === 'CASH' ? cashReceivedTeacherId : undefined,
        paymentStatus: (paymentMethod === 'CASH' || (paymentMethod === 'UPI' && paymentReceipt)) && admissionFee ? 'COMPLETED' : 'PENDING',

        // Terms
        termsAccepted: true,
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
    setClassApplied('Class 1');
    setAcademicYear('2026-2027');
    setGender('MALE');
    setDob('');
    setAadharNo('');
    setMotherTongue('Telugu');
    setStudentImage('');

    setFatherName('');
    setFatherOccupation('');
    setFatherAadhar('');
    setFatherPhone('');

    setMotherName('');
    setMotherOccupation('');
    setMotherAadhar('');
    setMotherPhone('');

    setPhone('');
    setAlternatePhone('');

    setNationality('Indian');
    setReligion('Hindu');
    setCaste('BC-A');
    setSubCaste('');
    setPreviousSchool('');

    setSelectedState('Andhra Pradesh');
    setSelectedDistrict('Srikakulam');
    setSelectedMandal('Narasannapeta');
    setSelectedVillage('Narasannapeta Main (Ward 1)');
    setCustomVillage('');
    setDoorNo('');

    setHasSiblings(false);
    setSiblings([{ name: '', className: 'Class 1', schoolName: '' }]);

    setAdmissionFee('');
    setPaymentMethod('CASH');
    setPaymentReceipt('');
    setTermsAccepted(false);

    setSubmittedAdmission(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Header */}
      <PageHeader 
        title="Student Admission Registration"
        breadcrumbs={[
          { label: 'Admissions', href: '/admissions' },
          { label: 'Register Student' }
        ]}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        
        {/* User Identity / Staff Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registering Desk / Operator</p>
              <p className="text-sm font-black text-slate-800">
                {currentUser.name || 'School Accounts / Admission Desk'} 
                <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {currentUser.role || 'STAFF'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Academic Year: <strong className="text-indigo-700">{academicYear}</strong></span>
          </div>
        </div>

        {/* Success Modal / Post Submission View */}
        {submittedAdmission ? (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
              Application Submitted Successfully
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {submittedAdmission.studentName}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Class Applied: <strong className="text-slate-800">{submittedAdmission.classApplied}</strong> • Academic Year: <strong className="text-slate-800">{submittedAdmission.academicYear || academicYear}</strong>
            </p>

            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Application Number:</span>
                <span className="font-mono font-bold text-indigo-600">ADM-{new Date().getFullYear()}-{submittedAdmission.id?.slice(0, 6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Primary Contact Phone:</span>
                <span className="font-bold text-slate-800">{submittedAdmission.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Application Fee:</span>
                <span className="font-bold text-emerald-700">₹ {submittedAdmission.admissionFee || '0'} ({submittedAdmission.paymentMethod || 'CASH'})</span>
              </div>
              {submittedAdmission.cashReceivedByName && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Cash Received By:</span>
                  <span className="font-bold text-amber-800">{submittedAdmission.cashReceivedByName}</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Official Admission Form (A4)
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Register Another Student
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* CARD 1: STUDENT DETAILS */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">1. Student Details</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-indigo-100">
                  Passport Photo & Identity
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Photo Upload Box */}
                  <div className="flex flex-col items-center shrink-0 w-full md:w-44">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-36 h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${
                        studentImage ? 'border-indigo-500 bg-slate-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
                      }`}
                    >
                      {studentImage ? (
                        <>
                          <img src={resolveFileUrl(studentImage)} alt="Student Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                            <Camera className="w-5 h-5" /> Change Photo
                          </div>
                        </>
                      ) : isUploadingPhoto ? (
                        <div className="flex flex-col items-center text-slate-400 gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-[11px] font-semibold text-indigo-600">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 gap-2 p-3 text-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Upload Photo</span>
                          <span className="text-[10px] text-slate-400">JPG / PNG / WEBP</span>
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

                  {/* Student Fields Grid */}
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

                    {/* Academic Year (Strictly Clean) */}
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
                        <option value="2027-2028">2027-2028</option>
                      </select>
                    </div>

                    {/* Gender (MALE, FEMALE Buttons) */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['MALE', 'FEMALE'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              gender === g
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {g}
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Student Aadhaar Number */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Student Aadhaar Number
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

                    {/* Mother Tongue */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Mother Tongue (మాతృభాష)
                      </label>
                      <select
                        value={motherTongue}
                        onChange={e => setMotherTongue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिन्दी)</option>
                        <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PARENT & GUARDIAN DETAILS */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-emerald-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">2. Parent & Guardian Details</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-emerald-100">
                  Father, Mother & Contact Info
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Father Details Sub-Block */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Father's Information</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Father's Name</label>
                      <input 
                        type="text"
                        value={fatherName}
                        onChange={e => setFatherName(e.target.value)}
                        placeholder="Enter father name"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Occupation</label>
                      <input 
                        type="text"
                        value={fatherOccupation}
                        onChange={e => setFatherOccupation(e.target.value)}
                        placeholder="e.g. Business / Agriculture / Govt"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Aadhaar No</label>
                      <input 
                        type="text"
                        maxLength={12}
                        value={fatherAadhar}
                        onChange={e => setFatherAadhar(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit Aadhaar"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Mobile No</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input 
                          type="tel"
                          maxLength={10}
                          value={fatherPhone}
                          onChange={e => setFatherPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit mobile"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mother Details Sub-Block */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mother's Information</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Mother's Name</label>
                      <input 
                        type="text"
                        value={motherName}
                        onChange={e => setMotherName(e.target.value)}
                        placeholder="Enter mother name"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Occupation</label>
                      <input 
                        type="text"
                        value={motherOccupation}
                        onChange={e => setMotherOccupation(e.target.value)}
                        placeholder="e.g. Homemaker / Employee"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Aadhaar No</label>
                      <input 
                        type="text"
                        maxLength={12}
                        value={motherAadhar}
                        onChange={e => setMotherAadhar(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit Aadhaar"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-600 uppercase mb-1">Mobile No</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input 
                          type="tel"
                          maxLength={10}
                          value={motherPhone}
                          onChange={e => setMotherPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="10-digit mobile"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary & Alternate Mobile row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Primary Contact Mobile Number <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-indigo-600 font-bold">Main for SMS/WhatsApp</span>
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
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Alternate Mobile Number</span>
                      <span className="text-[10px] text-slate-500 font-medium">Emergency Backup</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">+91</span>
                      <input 
                        type="tel"
                        maxLength={10}
                        value={alternatePhone}
                        onChange={e => setAlternatePhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Alternate 10-digit mobile"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 3: DEMOGRAPHICS, RELIGION & PREVIOUS SCHOOL */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-sky-950 to-sky-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">3. Demographics, Caste & Previous School</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-sky-100">
                  Government Compliance & History
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nationality */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Nationality
                  </label>
                  <input 
                    type="text"
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Religion
                  </label>
                  <select
                    value={religion}
                    onChange={e => setReligion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  >
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Christian">Christian</option>
                    <option value="Jain">Jain</option>
                    <option value="Sikh">Sikh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Caste */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Caste Category
                  </label>
                  <select
                    value={caste}
                    onChange={e => setCaste(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  >
                    <option value="OC">OC (General)</option>
                    <option value="BC-A">BC-A</option>
                    <option value="BC-B">BC-B</option>
                    <option value="BC-C">BC-C</option>
                    <option value="BC-D">BC-D</option>
                    <option value="BC-E">BC-E</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Sub-Caste */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Sub-Caste
                  </label>
                  <input 
                    type="text"
                    value={subCaste}
                    onChange={e => setSubCaste(e.target.value)}
                    placeholder="Enter sub-caste"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>

                {/* Name of the School Previously Studying / Studied */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Name of the School Previously Studied / Studying
                  </label>
                  <input 
                    type="text"
                    value={previousSchool}
                    onChange={e => setPreviousSchool(e.target.value)}
                    placeholder="Enter previous school name and location (or NA if fresher)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: RESIDENTIAL ADDRESS (Cascading Dropdowns) */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-teal-950 to-teal-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-teal-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">4. Residential Address</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-teal-100">
                  State ➔ District ➔ Mandal ➔ Sachivalayam / Village
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. State Dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={e => handleStateChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                  >
                    {AP_LOCATIONS.states.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* 2. District Dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                  >
                    {availableDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Mandal Dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Mandal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMandal}
                    onChange={e => handleMandalChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                  >
                    {availableMandals.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Village / Sachivalayam Dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Village / Sachivalayam <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVillage}
                    onChange={e => setSelectedVillage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                  >
                    {availableVillages.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Village text box if 'Other' selected */}
                {selectedVillage === 'Other Village/Sachivalayam' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Specify Village / Colony Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={customVillage}
                      onChange={e => setCustomVillage(e.target.value)}
                      placeholder="Type village or ward name"
                      className="w-full px-4 py-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                    />
                  </div>
                )}

                {/* 5. Door No / Street / Landmark */}
                <div className={selectedVillage === 'Other Village/Sachivalayam' ? "sm:col-span-2" : "sm:col-span-2 lg:col-span-4"}>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Door No, Street Name & Landmark
                  </label>
                  <input 
                    type="text"
                    value={doorNo}
                    onChange={e => setDoorNo(e.target.value)}
                    placeholder="e.g. D.No 4-12, Main Street, Near Sai Baba Temple"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
                  />
                </div>

              </div>
            </div>

            {/* CARD 5: SIBLING DETAILS */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-amber-950 to-amber-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">5. Sibling Details</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-amber-100">
                  Brothers & Sisters
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Siblings Toggle Question */}
                <div 
                  onClick={() => setHasSiblings(!hasSiblings)}
                  className="flex items-center gap-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  <div className="text-amber-700">
                    {hasSiblings ? <CheckSquare className="w-5 h-5 text-amber-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-950">Does the applicant have siblings? (తోబుట్టువులు ఉన్నారా?)</p>
                    <p className="text-xs text-amber-800">Tick if student has brother(s) or sister(s). If no siblings, leave unticked (marked as NA).</p>
                  </div>
                </div>

                {/* Sibling Dynamic Table */}
                {hasSiblings && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase tracking-wider">
                          <tr>
                            <th className="p-3 w-12 text-center">S.No</th>
                            <th className="p-3">Sibling Name</th>
                            <th className="p-3 w-40">Class</th>
                            <th className="p-3">Where He / She Studying (School Name)</th>
                            <th className="p-3 w-16 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {siblings.map((sib, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60">
                              <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2.5">
                                <input 
                                  type="text"
                                  value={sib.name}
                                  onChange={e => handleSiblingChange(idx, 'name', e.target.value)}
                                  placeholder="Enter sibling full name"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </td>
                              <td className="p-2.5">
                                <select
                                  value={sib.className}
                                  onChange={e => handleSiblingChange(idx, 'className', e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                >
                                  {classesList.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                  <option value="College">College / Higher Studies</option>
                                  <option value="Other">Other</option>
                                </select>
                              </td>
                              <td className="p-2.5">
                                <input 
                                  type="text"
                                  value={sib.schoolName}
                                  onChange={e => handleSiblingChange(idx, 'schoolName', e.target.value)}
                                  placeholder="e.g. JY School / Govt High School"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                {siblings.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSibling(idx)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title="Remove sibling row"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddSibling}
                        className="px-3.5 py-1.5 bg-white border border-amber-300 hover:border-amber-400 text-amber-900 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-amber-50 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-600" /> Add Another Sibling
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CARD 6: APPLICATION FEE & PAYMENT WITH QR CODE */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-purple-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">6. Application Fee & Payment Mode</h3>
                </div>
                <span className="text-xs bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-purple-100">
                  {paymentMethod === 'UPI' ? 'UPI Scan & Receipt Upload' : paymentMethod === 'CASH' ? 'Cash Collection Verification' : 'Pay Later at Office'}
                </span>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Fee Controls */}
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

                    <p className="text-[11px] text-slate-500 mt-2 font-medium">
                      Scan and pay with any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* CARD 7: FOLLOWING TERMS AND CONDITIONS SHOULD STRICTLY BE FOLLOWED */}
            <div className="bg-white rounded-2xl shadow-xs border border-rose-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-300" />
                  <h3 className="font-black text-sm tracking-wide uppercase">7. Terms and Conditions (Strictly Followed)</h3>
                </div>
                <span className="text-xs bg-rose-500/30 text-rose-200 font-bold px-2.5 py-0.5 rounded-full border border-rose-400/30">
                  Mandatory Declaration
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 sm:p-5 text-slate-700 text-xs leading-relaxed space-y-2.5 font-medium">
                  <p className="font-black text-rose-900 text-xs uppercase tracking-wider mb-2">
                    Following terms and conditions should strictly be followed:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-800">
                    <li>Student should obey the rules and regulations set by the management.</li>
                    <li>Student would not be allowed to move around the premises of the school without uniform.</li>
                    <li>During school time no visitor is allowed.</li>
                    <li>During school time parents should not approach teachers without the permission of the management.</li>
                    <li>The management has the right to reject or accept the application. The name of the student will be struck out if the students fail to follow the rules and regulations of the school.</li>
                    <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
                    <li>In case of the decision of the management would be final and the concerned parties would accept the management’s decisions final.</li>
                    <li>If the student will remain absent from school for 10 days without information his/her name will be struck out from the school. Parent has to take prior permission for the students absence.</li>
                    <li>The students has pay all dues again to be readmitted.</li>
                    <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.</li>
                    <li>The fee once paid will not be refunded.</li>
                  </ol>
                </div>

                {/* Mandatory Agreement Checkbox */}
                <div 
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    termsAccepted ? 'bg-emerald-50/70 border-emerald-500' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-emerald-600">
                    {termsAccepted ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-black text-slate-900 cursor-pointer">
                      I / We have read, understood, and solemnly agree to abide by all the above 11 Terms and Conditions & School Code of Conduct. <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      By checking this box, the parent/guardian acknowledges full legal responsibility for student compliance and school fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON ROW */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Student Admission Application</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Official Print Modal */}
      {showPrintModal && submittedAdmission && (
        <AdmissionPrintModal
          admission={submittedAdmission}
          schoolSettings={schoolSettings}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
