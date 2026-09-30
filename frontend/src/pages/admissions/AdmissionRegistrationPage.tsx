import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Trash2, CheckCircle2, 
  Printer, Phone, User, 
  CreditCard, RefreshCw, QrCode, Copy, Check, UserCheck, Calendar,
  Upload, FileText, Eye, AlertCircle, Users, Home, BookOpen,
  CheckSquare, Square, Plus, ShieldCheck, MapPin, Sparkles, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AdmissionPrintModal } from './AdmissionPrintModal';
import { AP_LOCATIONS } from '../../utils/apLocations';
import { AP_CASTES } from '../../utils/apCastes';

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


  // 3. Demographics & Previous School
  const [nationality, setNationality] = useState('Indian');
  const [religion, setReligion] = useState('Hindu');
  const [caste, setCaste] = useState('BC-A');
  const [subCaste, setSubCaste] = useState(AP_CASTES.subCastes['BC-A']?.[0] || '');
  const [customSubCaste, setCustomSubCaste] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');

  // 4. Residential Address Cascading Dropdowns
  const [selectedState, setSelectedState] = useState('Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Srikakulam');
  const [selectedMandal, setSelectedMandal] = useState('Narasannapeta');
  const [selectedVillage, setSelectedVillage] = useState('Narasannapeta 1 (Ward 1)');
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

  // Cascading Caste Handlers
  const availableSubCastes = AP_CASTES.subCastes[caste] || ['Other Sub-Caste'];

  const handleCasteChange = (cat: string) => {
    setCaste(cat);
    const subs = AP_CASTES.subCastes[cat] || ['Other Sub-Caste'];
    setSubCaste(subs[0] || '');
    setCustomSubCaste('');
  };

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
    updated[index][field] = field === 'className' ? value : value.toUpperCase();
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

    // Instant local preview for immediate visual feedback
    const localPreview = URL.createObjectURL(file);
    setStudentImage(localPreview);

    setIsUploadingPhoto(true);
    const toastId = toast.loading('Uploading student photo...');
    try {
      const formData = new FormData();
      formData.append('file', file);
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

    // Instant preview for receipt (blob URL for local preview only)
    const localReceipt = URL.createObjectURL(file);
    setPaymentReceipt(localReceipt);

    setIsUploadingReceipt(true);
    const toastId = toast.loading('Uploading payment receipt...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use /share endpoint: saves to disk and returns a proper /uploads/filename URL
      const res = await api.post('/api/uploads/share', formData, {
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
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
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

    const contactMobile = (fatherPhone || motherPhone).trim();
    if (!contactMobile) {
      toast.error("Please enter Father's or Mother's Mobile Number");
      return;
    }
    if (contactMobile.replace(/\D/g, '').length < 10) {
      toast.error("Please enter a valid 10-digit mobile number for Father or Mother");
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
    const finalSubCaste = subCaste === 'Other Sub-Caste' ? customSubCaste : subCaste;
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
        alternatePhone: (fatherPhone && motherPhone && fatherPhone.trim() !== motherPhone.trim()) ? motherPhone.trim() : undefined,

        // Demographics & Previous School
        nationality: nationality.trim() || 'Indian',
        religion: religion.trim() || undefined,
        caste: caste.trim() || undefined,
        subCaste: finalSubCaste.trim() || undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 pb-20 font-sans">
      <PageHeader 
        title="Admission Registration"
        breadcrumbs={currentUser.role ? [
          { label: 'Admissions', href: '/admissions' },
          { label: 'Register Student' }
        ] : [
          { label: 'JY School Online Admissions' }
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Modern Welcome Banner */}
        <div className="relative bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Student Registration</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Please fill out all the details accurately to enroll the student.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 font-black">
              {academicYear.split('-')[0].slice(-2)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</p>
              <p className="text-sm font-black text-slate-700">{academicYear}</p>
            </div>
          </div>
        </div>

        {submittedAdmission ? (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider mb-4">
              Registration Successful
            </span>

            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              {submittedAdmission.studentName}
            </h2>

            <p className="text-slate-500 font-medium mb-8">
              Class Applied: <strong className="text-slate-800">{submittedAdmission.classApplied}</strong> • Academic Year: <strong className="text-slate-800">{submittedAdmission.academicYear || academicYear}</strong>
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 max-w-md mx-auto text-left space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Application No</span>
                <span className="font-mono font-bold text-indigo-600 text-lg">ADM-{new Date().getFullYear()}-{submittedAdmission.id?.slice(0, 6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Primary Contact</span>
                <span className="font-bold text-slate-800">{submittedAdmission.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500">Application Fee</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">₹ {submittedAdmission.admissionFee || '0'} ({submittedAdmission.paymentMethod || 'CASH'})</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
              >
                <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" /> Print Official Form
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Register Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* SECTION 1: STUDENT DETAILS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">1. Student Details</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passport Photo & Identity Information</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start pl-2 md:pl-4">
                  {/* Modern Photo Upload */}
                  <div className="flex flex-col items-center shrink-0 w-full md:w-48 group">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-40 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                        studentImage ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50'
                      }`}
                    >
                      {studentImage ? (
                        <>
                          <img src={resolveFileUrl(studentImage)} alt="Student Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                            <Camera className="w-6 h-6 mb-2" />
                            <span className="text-xs font-bold">Change Photo</span>
                          </div>
                        </>
                      ) : isUploadingPhoto ? (
                        <div className="flex flex-col items-center text-indigo-500 gap-3">
                          <RefreshCw className="w-8 h-8 animate-spin" />
                          <span className="text-xs font-bold">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 gap-3 p-4 text-center group-hover:text-indigo-500 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-700">Upload Photo</span>
                            <span className="block text-[10px] text-slate-400 mt-1 uppercase">JPG / PNG</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" className="hidden" />
                    {studentImage && (
                      <button type="button" onClick={() => setStudentImage('')} className="mt-3 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Student Full Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" required value={studentName} onChange={e => setStudentName(e.target.value.toUpperCase())}
                        placeholder="e.g. Rahul Kumar"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Class Applied For <span className="text-rose-500">*</span></label>
                      <select value={classApplied} onChange={e => setClassApplied(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Academic Year <span className="text-rose-500">*</span></label>
                      <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                        <option value="2026-2027">2026-2027</option>
                        <option value="2027-2028">2027-2028</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Gender <span className="text-rose-500">*</span></label>
                      <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                        {(['MALE', 'FEMALE'] as const).map(g => (
                          <button
                            key={g} type="button" onClick={() => setGender(g)}
                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                              gender === g ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input 
                        type="date" value={dob} onChange={e => setDob(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Aadhaar Number</label>
                      <input 
                        type="text" maxLength={12} value={aadharNo} onChange={e => setAadharNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Mother Tongue</label>
                      <select value={motherTongue} onChange={e => setMotherTongue(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                        <option value="Telugu">Telugu</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Odia">Odia</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PARENT DETAILS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">2. Parent & Guardian Details</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Father, Mother & Contact Info</p>
                  </div>
                </div>

                <div className="space-y-6 pl-2 md:pl-4">
                  {/* Father Details */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h4 className="font-black text-sm text-slate-700 uppercase tracking-wide">Father's Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Name</label>
                        <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value.toUpperCase())} placeholder="Father Name" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Occupation</label>
                        <input type="text" value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value.toUpperCase())} placeholder="e.g. Business" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Aadhaar No</label>
                        <input type="text" maxLength={12} value={fatherAadhar} onChange={e => setFatherAadhar(e.target.value.replace(/\D/g, ''))} placeholder="12-digits" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mobile No</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                          <input type="tel" maxLength={10} value={fatherPhone} onChange={e => setFatherPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digits" className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mother Details */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <h4 className="font-black text-sm text-slate-700 uppercase tracking-wide">Mother's Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Name</label>
                        <input type="text" value={motherName} onChange={e => setMotherName(e.target.value.toUpperCase())} placeholder="Mother Name" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Occupation</label>
                        <input type="text" value={motherOccupation} onChange={e => setMotherOccupation(e.target.value.toUpperCase())} placeholder="e.g. Homemaker" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Aadhaar No</label>
                        <input type="text" maxLength={12} value={motherAadhar} onChange={e => setMotherAadhar(e.target.value.replace(/\D/g, ''))} placeholder="12-digits" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Mobile No</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                          <input type="tel" maxLength={10} value={motherPhone} onChange={e => setMotherPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digits" className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: DEMOGRAPHICS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">3. Demographics & Previous School</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Government Compliance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-2 md:pl-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Nationality</label>
                    <input type="text" value={nationality} onChange={e => setNationality(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Religion</label>
                    <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all">
                      <option value="Hindu">Hindu</option>
                      <option value="Muslim">Muslim</option>
                      <option value="Christian">Christian</option>
                      <option value="Jain">Jain</option>
                      <option value="Sikh">Sikh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Caste Category <span className="text-rose-500">*</span></label>
                    <select value={caste} onChange={e => handleCasteChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all">
                      {AP_CASTES.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Sub-Caste (కులం) <span className="text-rose-500">*</span></label>
                    <select value={subCaste} onChange={e => setSubCaste(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all">
                      {availableSubCastes.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  {subCaste === 'Other Sub-Caste' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Specify Sub-Caste <span className="text-rose-500">*</span></label>
                      <input type="text" value={customSubCaste} onChange={e => setCustomSubCaste(e.target.value.toUpperCase())} placeholder="e.g. Kapu" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all uppercase" />
                    </div>
                  )}

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Previous School</label>
                    <input type="text" value={previousSchool} onChange={e => setPreviousSchool(e.target.value.toUpperCase())} placeholder="Name and location of previous school (if any)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all uppercase" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: ADDRESS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">4. Residential Address</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Location Info</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pl-2 md:pl-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">State <span className="text-rose-500">*</span></label>
                    <select value={selectedState} onChange={e => handleStateChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                      {AP_LOCATIONS.states.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">District <span className="text-rose-500">*</span></label>
                    <select value={selectedDistrict} onChange={e => handleDistrictChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                      {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Mandal <span className="text-rose-500">*</span></label>
                    <select value={selectedMandal} onChange={e => handleMandalChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                      {availableMandals.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Village / Sachivalayam <span className="text-rose-500">*</span></label>
                    <select value={selectedVillage} onChange={e => setSelectedVillage(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                      {availableVillages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  {selectedVillage === 'Other Village/Sachivalayam' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Specify Village <span className="text-rose-500">*</span></label>
                      <input type="text" required value={customVillage} onChange={e => setCustomVillage(e.target.value.toUpperCase())} placeholder="Village Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all uppercase" />
                    </div>
                  )}

                  <div className={selectedVillage === 'Other Village/Sachivalayam' ? "md:col-span-2" : "md:col-span-2 lg:col-span-4"}>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Door No / Street / Landmark</label>
                    <input type="text" value={doorNo} onChange={e => setDoorNo(e.target.value.toUpperCase())} placeholder="e.g. 4-12, Main Road" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all uppercase" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: SIBLINGS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800">5. Sibling Details</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brothers & Sisters</p>
                  </div>
                </div>

                <div className="pl-2 md:pl-4 space-y-6">
                  <div 
                    onClick={() => setHasSiblings(!hasSiblings)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      hasSiblings ? 'bg-amber-50/50 border-amber-400' : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className={hasSiblings ? 'text-amber-500' : 'text-slate-400'}>
                      {hasSiblings ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800">Does the applicant have siblings? (తోబుట్టువులు ఉన్నారా?)</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Check this if the student has a brother or sister studying elsewhere or here.</p>
                    </div>
                  </div>

                  {hasSiblings && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-12 text-center">#</th>
                              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Name</th>
                              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-40">Class</th>
                              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">School</th>
                              <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider w-16 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {siblings.map((sib, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-3">
                                  <input type="text" value={sib.name} onChange={e => handleSiblingChange(idx, 'name', e.target.value)} placeholder="Name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all uppercase" />
                                </td>
                                <td className="p-3">
                                  <select value={sib.className} onChange={e => handleSiblingChange(idx, 'className', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
                                    {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="College">College</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <input type="text" value={sib.schoolName} onChange={e => handleSiblingChange(idx, 'schoolName', e.target.value)} placeholder="School Name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all uppercase" />
                                </td>
                                <td className="p-3 text-center">
                                  {siblings.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveSibling(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button type="button" onClick={handleAddSibling} className="px-5 py-2.5 bg-white border border-amber-300 hover:border-amber-500 text-amber-700 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                          <Plus className="w-4 h-4" /> Add Another Sibling
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 6: PAYMENT */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-800">6. Fee & Payment Mode</h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Fee Collection</p>
                    </div>
                  </div>
                </div>

                <div className="pl-2 md:pl-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className={paymentMethod === 'UPI' ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
                    <div className={`grid grid-cols-1 gap-6 ${paymentMethod === 'CASH' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Application Fee (₹)</label>
                        <input type="number" value={admissionFee} onChange={e => setAdmissionFee(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-purple-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Payment Method <span className="text-rose-500">*</span></label>
                        <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); if (e.target.value !== 'UPI') setPaymentReceipt(''); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all">
                          <option value="CASH">Cash Payment</option>
                          <option value="UPI">UPI / Scan QR</option>
                          <option value="LATER">Pay Later</option>
                        </select>
                      </div>
                      {paymentMethod === 'CASH' && (
                        <div>
                          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Cash Receiver <span className="text-rose-500">*</span></label>
                          <select value={cashReceivedTeacherName} onChange={e => { const selectedName = e.target.value; setCashReceivedTeacherName(selectedName); const found = teachers.find(t => (t.user?.name || t.name) === selectedName); setCashReceivedTeacherId(found?.id || ''); }} className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all">
                            <option value="">-- Select Teacher --</option>
                            {currentUser.name && <option value={currentUser.name}>{currentUser.name} (Logged-in)</option>}
                            {teachers.filter(t => (t.user?.name || t.name) !== currentUser.name).map(t => {
                              const tName = t.user?.name || t.name || 'Teacher';
                              return <option key={t.id} value={tName}>{tName}</option>;
                            })}
                          </select>
                        </div>
                      )}
                    </div>

                    {paymentMethod === 'UPI' && (
                      <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5">
                        <label className="block text-xs font-black text-purple-900 uppercase tracking-wider mb-3">Upload Payment Screenshot <span className="text-rose-500">*</span></label>
                        {paymentReceipt ? (
                          <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800">Receipt Attached</p>
                                <a href={resolveFileUrl(paymentReceipt)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">View Uploaded Image</a>
                              </div>
                            </div>
                            <button type="button" onClick={() => setPaymentReceipt('')} className="text-xs text-rose-500 hover:text-rose-700 font-bold px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors">Remove</button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-2 border-dashed border-purple-200 rounded-xl p-4 cursor-pointer hover:border-purple-400 transition-colors" onClick={() => receiptInputRef.current?.click()}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                {isUploadingReceipt ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-slate-800">Upload Transaction Screenshot</p>
                                <p className="text-xs font-semibold text-slate-500">JPG, PNG, PDF up to 10MB</p>
                              </div>
                            </div>
                            <input type="file" ref={receiptInputRef} onChange={handleReceiptSelect} accept="image/*,application/pdf" className="hidden" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                      <div className="flex items-center gap-2 text-sm font-black text-white/90 mb-4 z-10">
                        <QrCode className="w-5 h-5 text-purple-400" /> School UPI QR Code
                      </div>
                      <div className="p-3 bg-white rounded-2xl shadow-inner z-10">
                        {directQrUrl && !qrImgError ? (
                          <img src={directQrUrl} alt="School UPI QR" onError={() => setQrImgError(true)} className="w-40 h-40 object-contain rounded-xl" />
                        ) : dynamicQrCodeUrl ? (
                          <img src={dynamicQrCodeUrl} alt="School UPI QR" className="w-40 h-40 object-contain rounded-xl" />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">QR Unavailable</div>
                        )}
                      </div>
                      {activeUpiId && (
                        <div className="mt-5 flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 z-10">
                          <span className="text-sm font-mono font-bold text-white">{activeUpiId}</span>
                          <button type="button" onClick={() => handleCopyUpi(activeUpiId)} className="text-purple-300 hover:text-white p-1 rounded transition-colors">
                            {copiedUpi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 7: TERMS */}
            <div className="bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              <div className="p-6 md:p-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">7. Terms and Conditions</h3>
                    <p className="text-xs font-semibold text-rose-300/80 uppercase tracking-wider">Mandatory Agreement</p>
                  </div>
                </div>

                <div className="pl-2 md:pl-4 space-y-6">
                  <div className="bg-black/20 border border-white/10 rounded-2xl p-5 md:p-6 text-slate-300 text-sm font-medium leading-relaxed">
                    <ol className="list-decimal pl-5 space-y-2.5">
                      <li>Student should obey the rules and regulations set by the management.</li>
                      <li>Student would not be allowed to move around the premises of the school without uniform.</li>
                      <li>During school time no visitor is allowed.</li>
                      <li>The management has the right to reject or accept the application. The name of the student will be struck out if the students fail to follow the rules and regulations of the school.</li>
                      <li>In case of any damage done to any of property of the school, the parent would pay the loss equal to the value of damage property.</li>
                      <li>The fee would be collected in 3 terms and mentioned by management. Otherwise fee concession will not be allowed.</li>
                      <li>The fee once paid will not be refunded.</li>
                    </ol>
                  </div>

                  <div 
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      termsAccepted ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={termsAccepted ? 'text-emerald-400' : 'text-slate-500'}>
                      {termsAccepted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm md:text-base">I / We agree to abide by all the Terms and Conditions. <span className="text-rose-400">*</span></p>
                      <p className="text-xs font-semibold text-slate-400 mt-1">By checking this box, the parent/guardian acknowledges full legal responsibility.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="sticky bottom-4 z-40 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-900/5 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <button type="button" onClick={handleResetForm} className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all">
                Clear Form
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Submit Registration Form <ChevronRight className="w-5 h-5 opacity-50" /></>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

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

export default AdmissionRegistrationPage;
