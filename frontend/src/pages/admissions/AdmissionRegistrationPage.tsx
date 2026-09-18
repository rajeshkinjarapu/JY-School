import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Upload, Trash2, CheckCircle2, 
  Printer, ArrowRight, Phone, Calendar, User, 
  BookOpen, CreditCard, MapPin, Sparkles, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AdmissionPrintModal } from './AdmissionPrintModal';

const DEFAULT_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

export const AdmissionRegistrationPage: React.FC = () => {
  const [classesList, setClassesList] = useState<string[]>(DEFAULT_CLASSES);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [classApplied, setClassApplied] = useState('Class 1');
  const [address, setAddress] = useState('');
  const [admissionFee, setAdmissionFee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [studentImage, setStudentImage] = useState('');

  // Uploading state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submitted Application Success State
  const [submittedAdmission, setSubmittedAdmission] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Fetch school classes and settings
  useEffect(() => {
    api.get('/api/classes').then(res => {
      if (res.data?.data && Array.isArray(res.data.data)) {
        const names = res.data.data.map((c: any) => c.name);
        if (names.length > 0) {
          const combined = Array.from(new Set([...DEFAULT_CLASSES, ...names]));
          setClassesList(combined);
        }
      }
    }).catch(() => {});

    api.get('/api/settings').then(res => {
      if (res.data) setSchoolSettings(res.data);
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

      if (res.data?.url) {
        setStudentImage(res.data.url);
        toast.success('Photo uploaded successfully!', { id: toastId });
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Admission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error('Student Name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Parent Phone number is required');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Registering new admission...');

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
        address: address.trim() || undefined,
        studentImage: studentImage || undefined,
        admissionFee: admissionFee.trim() || undefined,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' && admissionFee ? 'COMPLETED' : 'PENDING'
      };

      const res: any = await api.post('/api/admissions/apply', payload);

      if (res.data?.success && res.data?.data) {
        toast.success('Student Registered Successfully!', { id: toastId });
        setSubmittedAdmission(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit admission', { id: toastId });
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
    setStudentImage('');
    setSubmittedAdmission(null);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Admission Registration" 
        icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* SUCCESS CARD AFTER REGISTRATION */}
        {submittedAdmission ? (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden p-8 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200">
              REGISTRATION SUCCESSFUL • అడ్మిషన్ నమోదు పూర్తయింది
            </span>

            <h2 className="text-2xl font-black text-slate-900 mt-3">
              {submittedAdmission.studentName}
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Class Applied: <span className="text-indigo-600 font-bold">{submittedAdmission.classApplied}</span> • App No: <span className="font-mono font-bold text-slate-800">ADM-{submittedAdmission.id?.slice(0, 6).toUpperCase()}</span>
            </p>

            {/* Student Photo Preview in Success Card */}
            {submittedAdmission.studentImage && (
              <div className="mt-4 flex justify-center">
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
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-5 h-5" /> Print Admission Form (PDF)
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Register Another Student
              </button>
            </div>
          </div>
        ) : (

          /* ADMISSION REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CARD 1: STUDENT PHOTO & BASIC INFO */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-indigo-200" />
                  <h3 className="font-black text-sm tracking-wide uppercase">1. Student Details (విద్యార్థి వివరాలు)</h3>
                </div>
                <span className="text-xs bg-white/20 font-bold px-2.5 py-0.5 rounded-full text-white">
                  Passport Photo & Personal Info
                </span>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  
                  {/* Student Photo Picker */}
                  <div className="flex flex-col items-center mx-auto md:mx-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-36 h-44 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner"
                    >
                      {studentImage ? (
                        <>
                          <img src={studentImage} alt="Student Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs font-bold flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg">
                              <Camera className="w-3.5 h-3.5" /> Change Photo
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3">
                          {isUploadingPhoto ? (
                            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                          ) : (
                            <Camera className="w-8 h-8 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          )}
                          <p className="text-xs font-black text-indigo-900">Upload Photo</p>
                          <p className="text-[10px] text-slate-400 mt-1">Click to select (JPG/PNG)</p>
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

                  {/* Fields Grid */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Student Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        Student Full Name (విద్యార్థి పూర్తి పేరు) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="e.g. Kinjarapu Sai Charan"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Class Applied For */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        Class Applied For (చేరే తరగతి) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={classApplied}
                        onChange={e => setClassApplied(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        {classesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        Gender (లింగం) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Male', 'Female'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              gender === g
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {g === 'Male' ? '👦 Boy (Male)' : '👧 Girl (Female)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        Date of Birth (పుట్టిన తేదీ)
                      </label>
                      <input 
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Aadhar Number */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        Aadhar Number (ఆధార్ సంఖ్య)
                      </label>
                      <input 
                        type="text"
                        maxLength={12}
                        value={aadharNo}
                        onChange={e => setAadharNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit Aadhar number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PARENT & CONTACT DETAILS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-5 h-5 text-emerald-200" />
                  <h3 className="font-black text-sm tracking-wide uppercase">2. Parent & Contact Details (తల్లిదండ్రుల వివరాలు)</h3>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Father Name */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Father Name (తండ్రి పేరు)
                  </label>
                  <input 
                    type="text"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    placeholder="e.g. Kinjarapu Appalaraju"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Mother Name (తల్లి పేరు)
                  </label>
                  <input 
                    type="text"
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                    placeholder="e.g. Kinjarapu Lakshmi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Primary Mobile Phone */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Primary Contact Mobile (మొబైల్ సంఖ్య) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">+91</span>
                    <input 
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Residential Address (నివాస చిరునామా)
                  </label>
                  <textarea 
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Village / Town, Mandal, District (e.g. SVL Paradise Campus, Narasannapeta)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

              </div>
            </div>

            {/* CARD 3: ADMISSION FEE & PAYMENT PARTICULARS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-purple-200" />
                  <h3 className="font-black text-sm tracking-wide uppercase">3. Admission Fee & Mode (ఫీజు వివరాలు)</h3>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fee Amount */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Admission Fee Amount (ఫీజు మొత్తం ₹)
                  </label>
                  <input 
                    type="number"
                    value={admissionFee}
                    onChange={e => setAdmissionFee(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Payment Method (చెల్లింపు విధానం)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  >
                    <option value="CASH">Cash Payment (నగదు)</option>
                    <option value="UPI">UPI / Online Transfer</option>
                    <option value="LATER">Pay Later at School Office</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-200 flex items-center gap-2.5 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Submit Student Registration
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
