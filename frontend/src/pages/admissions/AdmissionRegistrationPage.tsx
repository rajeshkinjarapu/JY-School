import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Camera, Trash2, CheckCircle2, 
  Printer, Phone, User, 
  CreditCard, RefreshCw
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
        address: address.trim() || undefined,
        studentImage: studentImage || undefined,
        admissionFee: admissionFee.trim() || undefined,
        paymentMethod,
        paymentStatus: paymentMethod === 'CASH' && admissionFee ? 'COMPLETED' : 'PENDING'
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
    setStudentImage('');
    setSubmittedAdmission(null);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Admission Registration" 
        icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
      />

      {/* Main Container - Optimized Width & Sleek Padding */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-5 py-4">

        {/* SUCCESS CARD AFTER REGISTRATION */}
        {submittedAdmission ? (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden p-6 sm:p-8 text-center max-w-xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 uppercase tracking-wide">
              Registration Successful
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3">
              {submittedAdmission.studentName}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Class Applied: <span className="text-indigo-600 font-bold">{submittedAdmission.classApplied}</span> • App No: <span className="font-mono font-bold text-slate-800">ADM-{submittedAdmission.id?.slice(0, 6).toUpperCase()}</span>
            </p>

            {/* Student Photo Preview */}
            {submittedAdmission.studentImage && (
              <div className="mt-4 flex justify-center">
                <img 
                  src={submittedAdmission.studentImage} 
                  alt="Student" 
                  className="w-24 h-28 object-cover rounded-xl border-2 border-indigo-200 shadow-md"
                />
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Admission Form (PDF)
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Register Another Student
              </button>
            </div>
          </div>
        ) : (

          /* ADMISSION REGISTRATION FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CARD 1: STUDENT PHOTO & BASIC INFO */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-300" />
                  <h3 className="font-black text-xs sm:text-sm tracking-wide uppercase">1. Student Details</h3>
                </div>
                <span className="text-[11px] bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-indigo-100">
                  Passport Photo & Particulars
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  
                  {/* Student Photo Picker */}
                  <div className="flex flex-col items-center mx-auto sm:mx-0 shrink-0">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-28 h-36 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-xs"
                    >
                      {studentImage ? (
                        <>
                          <img src={studentImage} alt="Student Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-[11px] font-bold flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg">
                              <Camera className="w-3 h-3" /> Change
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          {isUploadingPhoto ? (
                            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-1.5" />
                          ) : (
                            <Camera className="w-6 h-6 text-indigo-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                          )}
                          <p className="text-[11px] font-black text-indigo-900">Upload Photo</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">JPG / PNG</p>
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
                        className="mt-1.5 text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Fields Grid */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Student Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Student Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="e.g. Kinjarapu Sai Charan"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Class Applied For */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Class Applied For <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={classApplied}
                        onChange={e => setClassApplied(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      >
                        {classesList.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
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
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Date of Birth
                      </label>
                      <input 
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Aadhaar Number */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                        Aadhaar Number
                      </label>
                      <input 
                        type="text"
                        maxLength={12}
                        value={aadharNo}
                        onChange={e => setAadharNo(e.target.value.replace(/\D/g, ''))}
                        placeholder="12-digit Aadhaar number"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PARENT & CONTACT DETAILS */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-300" />
                  <h3 className="font-black text-xs sm:text-sm tracking-wide uppercase">2. Parent & Contact Details</h3>
                </div>
                <span className="text-[11px] bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-emerald-100">
                  Primary Contact Info
                </span>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Father Name */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Father Name
                  </label>
                  <input 
                    type="text"
                    value={fatherName}
                    onChange={e => setFatherName(e.target.value)}
                    placeholder="e.g. Kinjarapu Appalaraju"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Mother Name
                  </label>
                  <input 
                    type="text"
                    value={motherName}
                    onChange={e => setMotherName(e.target.value)}
                    placeholder="e.g. Kinjarapu Lakshmi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

                {/* Primary Mobile Phone */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
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
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Residential Address
                  </label>
                  <textarea 
                    rows={2}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Door No, Street, Village/Town, Mandal, District"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>

              </div>
            </div>

            {/* CARD 3: ADMISSION FEE & PAYMENT */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-purple-950 to-purple-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-300" />
                  <h3 className="font-black text-xs sm:text-sm tracking-wide uppercase">3. Admission Fee & Payment</h3>
                </div>
                <span className="text-[11px] bg-white/15 font-semibold px-2.5 py-0.5 rounded-full text-purple-100">
                  Fee Collection Mode
                </span>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Fee Amount */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Admission Fee Amount (₹)
                  </label>
                  <input 
                    type="number"
                    value={admissionFee}
                    onChange={e => setAdmissionFee(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="UPI">UPI / Online Payment</option>
                    <option value="LATER">Pay Later at School Office</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
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
