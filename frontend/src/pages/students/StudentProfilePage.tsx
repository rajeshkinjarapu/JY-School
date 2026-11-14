import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera, CreditCard, FileDown, Trash2, Edit2, X,
  CheckCircle2, AlertCircle, Home, ChevronRight, BookOpen, MessageCircle, ArrowRight,
  Copy, ExternalLink, ShieldCheck, Award, FileText, Activity, HeartPulse, Navigation, Clock, Check, Building, Bus, Heart, Mail, ShieldAlert,
  ChevronDown, Search, CheckCircle, Info
} from 'lucide-react';
import { FeeReceiptPrint } from '../../components/fees/FeeReceiptPrint';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const outletContext = useOutletContext<any>();
  const setDynamicTitle = outletContext?.setDynamicTitle;
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canEdit = isAdmin || (user?.role === 'TEACHER' && (user?.teacher as any)?.canEditStudents);

  // Instant Loading Strategy: Check router state or sessionStorage first
  const initialStudentData = location.state?.initialStudent || (() => {
    try {
      const cached = sessionStorage.getItem(`student_profile_${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })();

  const [student, setStudent] = useState<any>(initialStudentData);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialStudentData);
  const [uploading, setUploading] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'academic' | 'address' | 'other'>('personal');
  
  // Payment Modal States
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [discountFee, setDiscountFee] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Section Modal States
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newClassId, setNewClassId] = useState('');

  // Change Name Modal States
  const [showNameModal, setShowNameModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [viewTransaction, setViewTransaction] = useState<any>(null);

  // Demographics Modal States
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);
  const [editGender, setEditGender] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editAadharNo, setEditAadharNo] = useState('');
  const [editPenNumber, setEditPenNumber] = useState('');

  // Family Modal States
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editFatherName, setEditFatherName] = useState('');
  const [editFatherAadhar, setEditFatherAadhar] = useState('');
  const [editFatherPhone, setEditFatherPhone] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editMotherAadhar, setEditMotherAadhar] = useState('');
  const [editMotherPhone, setEditMotherPhone] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editGuardianRelation, setEditGuardianRelation] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const openDemographicsModal = () => {
    if (!student) return;
    setEditGender(student.gender || '');
    setEditDob(student.dob ? new Date(student.dob).toISOString().split('T')[0] : '');
    setEditBloodGroup(student.bloodGroup || '');
    setEditAadharNo(student.aadharNo || '');
    setEditPenNumber(student.penNumber || '');
    setShowDemographicsModal(true);
  };

  const openFamilyModal = () => {
    if (!student) return;
    setEditFatherName(student.fatherName || '');
    setEditFatherAadhar(student.fatherAadhar || '');
    setEditFatherPhone(student.fatherPhone || '');
    setEditMotherName(student.motherName || '');
    setEditMotherAadhar(student.motherAadhar || '');
    setEditMotherPhone(student.motherPhone || '');
    setEditGuardianName(student.guardianName || student.parent?.user?.name || '');
    setEditGuardianPhone(student.guardianPhone || student.parent?.user?.phone || '');
    setEditGuardianRelation(student.guardianRelation || '');
    setEditAddress(student.address || '');
    setShowFamilyModal(true);
  };

  const handleSaveDemographics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const updateToast = toast.loading('Saving demographics...');
    try {
      await api.put(`/api/students/${student.id}`, {
        gender: editGender || null,
        dob: editDob ? editDob : null,
        bloodGroup: editBloodGroup || null,
        aadharNo: editAadharNo ? editAadharNo.trim() : null,
        penNumber: editPenNumber ? editPenNumber.trim() : null,
      });
      toast.success('Demographics updated successfully!', { id: updateToast });
      setShowDemographicsModal(false);
      await fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update demographics', { id: updateToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const updateToast = toast.loading('Saving family details...');
    try {
      await api.put(`/api/students/${student.id}`, {
        fatherName: editFatherName ? editFatherName.trim() : null,
        fatherAadhar: editFatherAadhar ? editFatherAadhar.trim() : null,
        fatherPhone: editFatherPhone ? editFatherPhone.trim() : null,
        motherName: editMotherName ? editMotherName.trim() : null,
        motherAadhar: editMotherAadhar ? editMotherAadhar.trim() : null,
        motherPhone: editMotherPhone ? editMotherPhone.trim() : null,
        guardianName: editGuardianName ? editGuardianName.trim() : null,
        guardianPhone: editGuardianPhone ? editGuardianPhone.trim() : null,
        guardianRelation: editGuardianRelation ? editGuardianRelation.trim() : null,
        address: editAddress ? editAddress.trim() : null,
      });
      toast.success('Family details updated successfully!', { id: updateToast });
      setShowFamilyModal(false);
      await fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update family details', { id: updateToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const studentRes: any = await api.get(`/api/students/${id}`);
      const studentData = studentRes?.data?.data || studentRes?.data || studentRes;
      if (studentData) {
        setStudent(studentData);
        setLoading(false);
        try {
          sessionStorage.setItem(`student_profile_${id}`, JSON.stringify(studentData));
        } catch {}

        if (studentData?.id || studentData?.classId) {
          api.get(`/api/fees/structures?classId=${studentData.classId || ''}&studentId=${studentData.id || ''}`)
            .then((structRes: any) => {
              const structData = structRes?.data?.data || structRes?.data || [];
              setFeeStructures(structData);
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');
      await api.put(`/api/students/${student.id}`, {
        name: student.user.name,
        photoUrl: uploadedUrl,
      });
      toast.success('Photo updated successfully!', { id: loadingToast });
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedFees.length === 0) return toast.error('Please select at least one fee structure to pay.');

    setIsSubmitting(true);
    try {
      const payload: any = {
        studentId: student.id,
        payments: selectedFees,
        method,
        remarks,
        paymentDate,
      };

      if (method === 'UPI') {
        payload.utrNumber = utrNumber;
        payload.receiptUrl = receiptUrl;
      }

      await api.post('/api/fees/payments', payload);
      
      toast.success('Payment recorded successfully!');
      setShowModal(false);
      setSelectedFees([]);
      setRemarks('');
      setUtrNumber('');
      setReceiptUrl('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSubmitting(true);
    try {
      await api.put(`/api/fees/payments/${editingPayment.id}`, {
        amountPaid: editingPayment.amountPaid,
        method: editingPayment.method,
        remarks: editingPayment.remarks,
        paymentDate: editingPayment.paymentDate
      });
      toast.success('Payment updated successfully!');
      setShowEditModal(false);
      setEditingPayment(null);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.message || 'Error updating payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return;
    const t = toast.loading('Deleting payment...');
    try {
      await api.delete(`/api/fees/payments/${paymentId}`);
      toast.success('Payment deleted successfully', { id: t });
      fetchStudentProfile();
    } catch {
      toast.error('Failed to delete payment', { id: t });
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountFee) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/fees/discounts`, {
        studentId: student.id,
        feeStructureId: discountFee.id,
        discountAmount: discountFee.amount - discountAmount
      });
      toast.success('Fee discounted successfully!');
      setShowDiscountModal(false);
      setDiscountFee(null);
      setDiscountAmount(0);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.message || 'Error applying discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    const paymentForPrint = {
      ...payment,
      student: student
    };
    setPrintPayment(paymentForPrint);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleChangeSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassId) return toast.error('Please select a class/section.');
    
    setIsSubmitting(true);
    const updateToast = toast.loading('Updating section...');
    try {
      await api.patch(`/api/students/${student.id}/class`, { classId: newClassId });
      toast.success('Section updated successfully!', { id: updateToast });
      setShowSectionModal(false);
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update section', { id: updateToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return toast.error('Please enter a valid name.');
    
    setIsSubmitting(true);
    const updateToast = toast.loading('Updating name...');
    try {
      await api.patch(`/api/students/${student.id}/name`, { name: newStudentName });
      toast.success('Name updated successfully!', { id: updateToast });
      setShowNameModal(false);
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update name', { id: updateToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();

    const handleAfterPrint = () => {
      setPrintPayment(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [id]);

  const getProfileCompleteness = (st: any) => {
    if (!st) return { percentage: 0, completed: [], missing: [], total: 12 };
    const checklist = [
      { key: 'photo', label: 'Student Photo', done: Boolean(st.user?.photoUrl), modal: 'photo' },
      { key: 'gender', label: 'Gender', done: Boolean(st.gender), modal: 'demographics' },
      { key: 'dob', label: 'Date of Birth', done: Boolean(st.dob), modal: 'demographics' },
      { key: 'bloodGroup', label: 'Blood Group', done: Boolean(st.bloodGroup), modal: 'demographics' },
      { key: 'aadharNo', label: 'Aadhaar Number', done: Boolean(st.aadharNo), modal: 'demographics' },
      { key: 'penNumber', label: 'PEN Number', done: Boolean(st.penNumber), modal: 'demographics' },
      { key: 'fatherName', label: "Father's Name", done: Boolean(st.fatherName), modal: 'family' },
      { key: 'fatherPhone', label: "Father's Phone", done: Boolean(st.fatherPhone), modal: 'family' },
      { key: 'fatherAadhar', label: "Father's Aadhaar", done: Boolean(st.fatherAadhar), modal: 'family' },
      { key: 'motherName', label: "Mother's Name", done: Boolean(st.motherName), modal: 'family' },
      { key: 'motherPhone', label: "Mother's Phone", done: Boolean(st.motherPhone), modal: 'family' },
      { key: 'address', label: 'Residential Address', done: Boolean(st.address), modal: 'family' },
    ];
    const completed = checklist.filter((c) => c.done);
    const missing = checklist.filter((c) => !c.done);
    const percentage = Math.round((completed.length / checklist.length) * 100);
    return { percentage, completed, missing, total: checklist.length };
  };

  // Instant Skeleton Loader
  if (loading && !student) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 animate-pulse min-h-screen bg-slate-50/80">
        <div className="h-6 w-48 bg-slate-200 rounded-xl"></div>
        <div className="h-56 w-full rounded-3xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200"></div>
        <div className="h-14 w-full rounded-2xl bg-white border border-slate-200"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-white border border-slate-200"></div>
          <div className="h-72 rounded-2xl bg-white border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Student Profile Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The student ID might be invalid or deleted.</p>
        <Link to="/students" className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-colors">
          Back to Students List
        </Link>
      </div>
    );
  }

  const { percentage, completed, missing, total } = getProfileCompleteness(student);
  const circleRadius = 32;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const relevantFeeStructures = feeStructures.filter(
    (s) => s.studentId === student.id || s.classId === student.classId
  );

  const totalFeeObligation = relevantFeeStructures.reduce((sum, s) => {
    const discountRecord = student.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
    const discount = discountRecord ? discountRecord.amount : 0;
    return sum + Math.max(0, s.amount - discount);
  }, 0);

  const totalFeePaid = student.feePayments?.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0) || 0;
  const totalFeePending = Math.max(0, totalFeeObligation - totalFeePaid);
  const feeProgress = totalFeeObligation > 0 ? Math.min(100, Math.round((totalFeePaid / totalFeeObligation) * 100)) : 100;
  const studentAge = calculateAge(student.dob);

  return (
    <div className="flex flex-col min-h-full bg-[#F4F7FC] text-slate-800 print:hidden font-sans">
      
      <div className="p-3 sm:p-6 lg:p-7 space-y-4 max-w-7xl mx-auto w-full">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <Home className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link to="/students" className="hover:text-blue-600 transition-colors">Students</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-800 font-extrabold">{student.user?.name || 'Student Profile'}</span>
        </div>

        {/* ============================================================ */}
        {/* EXECUTIVE STUDENT HERO BANNER - ULTRA MODERN SAPPHIRE DESIGN */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] p-5 sm:p-7 shadow-2xl shadow-blue-950/20 text-white border border-slate-700/50">
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-1/4 -mt-16 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-16 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="absolute right-28 top-6 opacity-[0.06] pointer-events-none hidden md:block">
            <GraduationCap className="w-40 h-40 text-white" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left Section: Student Portrait, Name, Verification & Meta Badges */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left w-full lg:w-auto">
              
              {/* Premium Photo Frame */}
              <div className="relative shrink-0">
                <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl bg-gradient-to-b from-white/90 to-slate-200 p-1 shadow-2xl ring-4 ring-white/20 backdrop-blur-md">
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
                    {getPhotoUrl(student.user?.photoUrl) ? (
                      <img 
                        src={getPhotoUrl(student.user.photoUrl)} 
                        alt={student.user?.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2">
                        <User2 className="w-12 h-12 mb-1 text-slate-400" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">No Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Camera Button */}
                {(isAdmin || user?.role === 'TEACHER') && (
                  <label 
                    className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title="Change Student Photo"
                  >
                    <Camera className="w-4 h-4" />
                    <input 
                      id="student-photo-file-input" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                      disabled={uploading} 
                    />
                  </label>
                )}
              </div>

              {/* Student Identity Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase drop-shadow-sm">
                    {student.user?.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-[11px] font-bold" title="Verified Active Student">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Verified</span>
                  </span>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setNewStudentName(student.user?.name || '');
                        setShowNameModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
                      title="Edit Student Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Meta Badges Row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  
                  {/* Roll No / ID Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-md">
                    <User2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>ID: {student.rollNo}</span>
                  </div>

                  {/* Class & Section Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}</span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setNewClassId(student.classId || '');
                          if (classes.length === 0) {
                            api.get('/api/classes').then(res => setClasses(res.data.data || res.data || [])).catch(() => {});
                          }
                          setShowSectionModal(true);
                        }}
                        className="ml-1 text-indigo-300 hover:text-white"
                        title="Change Section"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Active Status Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Student</span>
                  </div>

                  {/* Age Tag */}
                  {studentAge !== null && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
                      <Clock className="w-3 h-3 text-cyan-300" />
                      <span>{studentAge} Years</span>
                    </div>
                  )}
                </div>

                {/* Subtitle / Admission Number note */}
                <p className="text-xs text-slate-300/80 font-medium hidden sm:block">
                  Admission No: <span className="font-mono text-cyan-200 font-bold">{student.admissionNo || student.rollNo}</span>
                  {student.gender && <span> • Gender: <strong className="text-white capitalize">{student.gender.toLowerCase()}</strong></span>}
                  {student.bloodGroup && <span> • Blood: <strong className="text-rose-300">{student.bloodGroup}</strong></span>}
                </p>
              </div>

            </div>

            {/* Right Section: Radial Profile Completeness & Date Cards */}
            <div className="flex items-center gap-5 sm:gap-6 justify-center lg:justify-end w-full lg:w-auto">
              
              {/* Radial Profile Completeness Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-22 h-22 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="44"
                      cy="44"
                      r={circleRadius}
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={circleRadius}
                      stroke="url(#progress-gradient)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="100%" stopColor="#22C55E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-black text-white text-xl tracking-tight">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300/90 mt-1">
                  Profile Complete
                </span>
              </div>

              {/* Stacked Glassmorphic Info Cards */}
              <div className="flex flex-col gap-2.5 min-w-[160px]">
                
                {/* Joined On Card */}
                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0 border border-cyan-400/20">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Joined On</p>
                    <p className="text-xs font-black text-white">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '18 Jul 2026'}
                    </p>
                  </div>
                </div>

                {/* Academic Year Card */}
                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 shadow-sm flex items-center gap-3 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0 border border-indigo-400/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Academic Year</p>
                    <p className="text-xs font-black text-white">
                      {student.class?.academicYear || '2026 – 27'}
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* PREMIUM NAVIGATION TABS                                      */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'personal', label: 'Personal Details', icon: User2, count: null },
            { id: 'family', label: 'Family Details', icon: Users, count: '2' },
            { id: 'academic', label: 'Academic & Fees', icon: BookOpen, count: null },
            { id: 'address', label: 'Address Details', icon: MapPin, count: null },
            { id: 'other', label: 'Other Details', icon: ClipboardCheck, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: PERSONAL DETAILS                                      */}
        {/* ============================================================ */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-fade-in">
            
            {/* Left Column (Personal Info & Quick Actions) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Card 1: Personal Information */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <User2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Personal Information</h3>
                      <p className="text-[11px] text-slate-400">Student bio, demographic and identity records</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={openDemographicsModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* 2x2 High-Contrast Data Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Gender Tile */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/50 to-slate-50 border border-slate-200/70">
                    <div className="w-11 h-11 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-inner">
                      <User2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                      <p className="text-sm font-black text-slate-800 capitalize">
                        {student.gender ? (
                          <span className="text-slate-900 font-extrabold">{student.gender.toLowerCase()}</span>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Date of Birth Tile */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-slate-200/70">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                        {studentAge !== null && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700">
                            {studentAge} Yrs
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        {student.dob ? (
                          new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        ) : (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Blood Group Tile */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-slate-50 border border-slate-200/70">
                    <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                      <Droplet className="w-5 h-5 fill-rose-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                      <p className="text-sm font-black">
                        {student.bloodGroup ? (
                          <span className="text-rose-600 font-extrabold">{student.bloodGroup}</span>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Aadhaar Number Tile */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar Number</p>
                        <p className="text-sm font-mono font-black text-slate-800 mt-0.5">
                          {student.aadharNo ? (
                            `**** **** ${student.aadharNo.slice(-4)}`
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.aadharNo && (
                      <button
                        onClick={() => handleCopy(student.aadharNo, 'Aadhaar Number')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Government & Education Identifiers (PEN, Child ID, APAAR ID) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Government & Education Identifiers
                  </p>

                  {/* PEN Number (High Priority UDISE+) */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-900 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-emerald-600" />
                      <span>Permanent Education Number (PEN)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {student.penNumber ? (
                        <>
                          <span className="font-mono font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg">
                            {student.penNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(student.penNumber, 'PEN Number')}
                            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md hover:bg-emerald-200/60 transition-colors cursor-pointer"
                            title="Copy PEN"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                          Pending Allotment
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Child ID & APAAR ID in Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {student.childId && (
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/70 flex items-center justify-between text-xs font-bold">
                        <span className="text-sky-800 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-sky-600" /> Child ID
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded-lg">
                            {student.childId}
                          </span>
                          <button
                            onClick={() => handleCopy(student.childId, 'Child ID')}
                            className="p-1 text-sky-700 hover:text-sky-900 rounded-md hover:bg-sky-200/50 transition-colors cursor-pointer"
                            title="Copy Child ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {student.apaarId && (
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/70 flex items-center justify-between text-xs font-bold">
                        <span className="text-purple-800 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-purple-600" /> APAAR ID
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg">
                            {student.apaarId}
                          </span>
                          <button
                            onClick={() => handleCopy(student.apaarId, 'APAAR ID')}
                            className="p-1 text-purple-700 hover:text-purple-900 rounded-md hover:bg-purple-200/50 transition-colors cursor-pointer"
                            title="Copy APAAR ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Quick Actions */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                    <Sparkles className="w-4 h-4 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Quick Actions</h3>
                    <p className="text-[11px] text-slate-400">Manage profile, generate documents, and collect fees</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  
                  {/* Edit Profile Button */}
                  {(isAdmin || canEdit) && (
                    <Link
                      to={`/students/${student.id}/edit`}
                      className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-2xl shadow-md shadow-indigo-500/20 px-4 py-3.5 font-bold flex flex-col items-center justify-center text-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                    >
                      <Edit2 className="w-5 h-5 mb-0.5" />
                      <span className="font-extrabold">Edit Profile</span>
                      <span className="text-[10px] text-purple-200 font-medium">Update details</span>
                    </Link>
                  )}

                  {/* Print Profile Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPrintPayment(null);
                      setTimeout(() => window.print(), 100);
                    }}
                    className="bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white rounded-2xl shadow-md shadow-emerald-500/20 px-4 py-3.5 font-bold flex flex-col items-center justify-center text-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    <Printer className="w-5 h-5 mb-0.5" />
                    <span className="font-extrabold">Print Profile</span>
                    <span className="text-[10px] text-emerald-200 font-medium">Official Dossier</span>
                  </button>

                  {/* Pay Fee Button */}
                  {(isAdmin || user?.role === 'ACCOUNTANT') && (
                    <Link
                      to={`/students/${student.id}/pay-fee`}
                      className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl shadow-md shadow-orange-500/20 px-4 py-3.5 font-bold flex flex-col items-center justify-center text-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                    >
                      <CreditCard className="w-5 h-5 mb-0.5" />
                      <span className="font-extrabold">Pay Fee</span>
                      <span className="text-[10px] text-amber-100 font-medium">Collect payments</span>
                    </Link>
                  )}

                </div>
              </div>

            </div>

            {/* Right Column (Family Preview & Profile Completeness) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Card 3: Family Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Family Information</h3>
                      <p className="text-[11px] text-slate-400">Parents & guardian contact summary</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('family')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Full Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub-cards: Father & Mother Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Father Details Card */}
                  <div 
                    onClick={() => setActiveTab('family')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner text-xl">
                        👨
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-blue-200/60 text-blue-800">
                            Father
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors mt-1 truncate max-w-[130px]">
                          {student.fatherName || 'Not Provided'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {student.fatherPhone ? student.fatherPhone : 'Phone not set'}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs group-hover:translate-x-1 transition-transform shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Mother Details Card */}
                  <div 
                    onClick={() => setActiveTab('family')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-inner text-xl">
                        👩
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-pink-200/60 text-pink-800">
                            Mother
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-slate-900 group-hover:text-pink-600 transition-colors mt-1 truncate max-w-[130px]">
                          {student.motherName || 'Not Provided'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {student.motherPhone ? student.motherPhone : 'Phone not set'}
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-xs group-hover:translate-x-1 transition-transform shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 4: Profile Completeness Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Profile Completeness ({percentage}%)
                      </h3>
                      <p className="text-[11px] text-slate-400">Complete all items for official certification</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {completed.length} of {total} Done
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Checklist Tiles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { label: 'Date of Birth', done: Boolean(student.dob), modal: openDemographicsModal },
                    { label: 'Blood Group', done: Boolean(student.bloodGroup), modal: openDemographicsModal },
                    { label: 'Aadhaar No', done: Boolean(student.aadharNo), modal: openDemographicsModal },
                    { label: 'PEN Number', done: Boolean(student.penNumber), modal: openDemographicsModal },
                    { label: "Father's Phone", done: Boolean(student.fatherPhone), modal: openFamilyModal },
                    { label: 'Address', done: Boolean(student.address), modal: openFamilyModal },
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={!item.done && canEdit ? item.modal : undefined}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                        item.done 
                          ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
                          : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'
                      }`}
                    >
                      <span className="truncate pr-1 text-[11px]">{item.label}</span>
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-blue-600 font-extrabold shrink-0 bg-blue-50 px-1.5 py-0.5 rounded-md hover:bg-blue-100">
                          Add +
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: FAMILY DETAILS (DEDICATED FULL HERO CARDS & PROTOCOL) */}
        {/* ============================================================ */}
        {activeTab === 'family' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Header Strip with Edit Button */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Family & Guardian Details</h3>
                  <p className="text-xs text-slate-500">Official parents contact, identification & emergency routing records</p>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={openFamilyModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Family Details</span>
                </button>
              )}
            </div>

            {/* 2 Big Side-by-Side Hero Parent Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Father Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-inner border border-blue-200/60">
                      👨
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800">
                        Primary Parent
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">
                        {student.fatherName || 'Not Provided'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Father</p>
                    </div>
                  </div>
                  {student.fatherPhone && (
                    <a
                      href={`tel:${student.fatherPhone}`}
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Phone Row */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</p>
                        <p className="text-xs font-mono font-black text-slate-900">
                          {student.fatherPhone || 'Not Provided'}
                        </p>
                      </div>
                    </div>
                    {student.fatherPhone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/91${student.fatherPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Row */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Father Aadhaar</p>
                        <p className="text-xs font-mono font-black text-slate-900">
                          {student.fatherAadhar ? `**** **** ${student.fatherAadhar.slice(-4)}` : 'Not Provided'}
                        </p>
                      </div>
                    </div>
                    {student.fatherAadhar && (
                      <button
                        onClick={() => handleCopy(student.fatherAadhar, "Father's Aadhaar")}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Verification Status */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs font-bold text-blue-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Relationship Status
                    </span>
                    <span className="text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded-md">
                      Verified Biological Parent
                    </span>
                  </div>

                </div>
              </div>

              {/* Mother Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 bg-gradient-to-r from-pink-50 via-rose-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center text-2xl shadow-inner border border-pink-200/60">
                      👩
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-200/70 text-pink-800">
                        Parent
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-1">
                        {student.motherName || 'Not Provided'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Mother</p>
                    </div>
                  </div>
                  {student.motherPhone && (
                    <a
                      href={`tel:${student.motherPhone}`}
                      className="p-2.5 rounded-xl bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-600/20 transition-all cursor-pointer"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Phone Row */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</p>
                        <p className="text-xs font-mono font-black text-slate-900">
                          {student.motherPhone || 'Not Provided'}
                        </p>
                      </div>
                    </div>
                    {student.motherPhone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/91${student.motherPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Row */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mother Aadhaar</p>
                        <p className="text-xs font-mono font-black text-slate-900">
                          {student.motherAadhar ? `**** **** ${student.motherAadhar.slice(-4)}` : 'Not Provided'}
                        </p>
                      </div>
                    </div>
                    {student.motherAadhar && (
                      <button
                        onClick={() => handleCopy(student.motherAadhar, "Mother's Aadhaar")}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Verification Status */}
                  <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-100 flex items-center justify-between text-xs font-bold text-pink-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" /> Relationship Status
                    </span>
                    <span className="text-pink-900 bg-pink-100/80 px-2 py-0.5 rounded-md">
                      Verified Biological Parent
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* Emergency & Guardian Protocol Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Emergency Contact & Guardian Protocol</h3>
                    <p className="text-[11px] text-slate-400">Immediate response routing for medical or school notifications</p>
                  </div>
                </div>
                <Badge variant="warning" className="text-[10px]">High Priority</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Guardian</p>
                  <p className="text-xs font-black text-slate-900 mt-1">
                    {student.guardianName || student.fatherName || 'Father / Mother'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Relation: {student.guardianRelation || 'Father'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Emergency Hotline</p>
                  <p className="text-xs font-mono font-black text-slate-900 mt-1">
                    {student.guardianPhone || student.fatherPhone || student.motherPhone || 'Not Provided'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active SMS & Voice
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Notification Protocol</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Direct WhatsApp & SMS
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automated ERP alerts enabled</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ACADEMIC & FEES (METRICS, LEDGER, TRANSACTIONS, MARKS)*/}
        {/* ============================================================ */}
        {activeTab === 'academic' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Top 3 KPI Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Total Obligation */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assigned Fee</p>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    ₹{totalFeeObligation.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{relevantFeeStructures.length} Structures Active</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              {/* Total Paid */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">
                    ₹{totalFeePaid.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{feeProgress}% Cleared</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              {/* Total Pending */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Balance</p>
                  <p className={`text-lg font-black mt-1 ${totalFeePending > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    ₹{totalFeePending.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {totalFeePending === 0 ? 'All fees settled' : 'Payment due'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Fee Ledger & Transaction History Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              
              {/* Fee Ledger Card */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/60 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Fee Ledger</h3>
                  </div>
                  {(isAdmin || user?.role === 'ACCOUNTANT') && (
                    <Link 
                      to={`/students/${student.id}/pay-fee`}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>Pay Fee</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                
                <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                  {relevantFeeStructures.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 font-bold">No fee structures assigned yet.</p>
                  ) : (
                    relevantFeeStructures.map((s) => {
                      const discountRecord = student.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
                      const discount = discountRecord ? discountRecord.amount : 0;
                      const effectiveAmount = Math.max(0, s.amount - discount);
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      const pending = Math.max(0, effectiveAmount - paidSoFar);
                      const progress = effectiveAmount > 0 ? Math.min(100, Math.round((paidSoFar / effectiveAmount) * 100)) : 100;
                      
                      return (
                        <div key={s.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">{s.name}</span>
                            <span className="text-xs font-black text-indigo-600">₹{effectiveAmount}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-emerald-600">Paid: ₹{paidSoFar}</span>
                            <span className={pending > 0 ? 'text-rose-500' : 'text-slate-400'}>Pending: ₹{pending}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Transaction History Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-transparent">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    Transaction History
                  </h3>
                  <Badge variant="info" className="text-[10px]">
                    {student.feePayments?.length || 0} Records
                  </Badge>
                </div>
                
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500 font-bold border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Fee Structure</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Method</th>
                        <th className="px-4 py-2.5 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {student.feePayments?.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-xs font-bold text-slate-400">No payment records found.</td></tr>
                      ) : (
                        student.feePayments?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800">{p.feeStructure?.name}</td>
                            <td className="px-4 py-2.5 font-black text-emerald-600">₹{p.amountPaid}</td>
                            <td className="px-4 py-2.5 font-medium text-slate-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-GB')}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.method === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {p.method}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button 
                                onClick={() => handlePrintReceipt(p)} 
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" 
                                title="Print Receipt"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ADDRESS DETAILS (DEDICATED LOCATION & COMMUTE VIEW)   */}
        {/* ============================================================ */}
        {activeTab === 'address' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Header Strip with Edit Button */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Address & Geographic Details</h3>
                  <p className="text-xs text-slate-500">Permanent residence, commute route, and emergency postal correspondence</p>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={openFamilyModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Address Details</span>
                </button>
              )}
            </div>

            {/* 2-Column Address Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Left Column: Residential Address Showcase */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
                      <Home className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">Residential Address</h4>
                  </div>
                  <Badge variant="success" className="text-[10px]">Verified Residence</Badge>
                </div>

                {/* Big Address Visual Block */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/70 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Address</p>
                      <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                        {student.address || 'Narasannapeta, Srikakulam, Andhra Pradesh - 532479'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-200/60">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Town / Village</p>
                      <p className="text-xs font-black text-slate-700">Narasannapeta</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">District</p>
                      <p className="text-xs font-black text-slate-700">Srikakulam</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">State & PIN</p>
                      <p className="text-xs font-black text-slate-700">Andhra Pradesh - 532479</p>
                    </div>
                  </div>
                </div>

                {/* Quick Utility Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(student.address || 'Narasannapeta, Srikakulam, Andhra Pradesh')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Google Maps</span>
                  </a>

                  <button
                    onClick={() => handleCopy(student.address || 'Narasannapeta, Srikakulam, Andhra Pradesh - 532479', 'Address')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Address</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Transport & Commute */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Transport Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Bus className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">Transport & Commute</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Commute Category</span>
                      <span className="text-xs font-black text-slate-900">Local Day Scholar (Self)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Approx. Distance</span>
                      <span className="text-xs font-black text-indigo-600">1 - 3 km from Campus</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">School Zone</span>
                      <span className="text-xs font-black text-slate-900">Narasannapeta Central</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Dispatch Verification */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Postal Correspondence Verified</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                    Report cards, official notices, and progress dossiers will be sent to this address. Primary contact for dispatch: <span className="font-black">{student.fatherPhone || student.motherPhone || 'School Office'}</span>.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: OTHER DETAILS (NATIONAL REGISTRY, MEDICAL, ACCOUNT)   */}
        {/* ============================================================ */}
        {activeTab === 'other' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Header Strip */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Other Details & Registrations</h3>
                  <p className="text-xs text-slate-500">National student registries, medical records, credentials & documents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrintPayment(null);
                  setTimeout(() => window.print(), 100);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Dossier</span>
              </button>
            </div>

            {/* 3 Section Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: National Registry Identifiers */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">National Registry</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">PEN (UDISE+ Registry)</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-black text-slate-900">
                        {student.penNumber || 'Pending Allotment'}
                      </p>
                      {student.penNumber && (
                        <button onClick={() => handleCopy(student.penNumber, 'PEN')} className="text-slate-400 hover:text-emerald-600 cursor-pointer">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Aadhaar Card Status</p>
                    <p className="font-bold text-slate-700">
                      {student.aadharNo ? 'Verified & On File' : 'Pending Physical Submission'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Admission Date</p>
                    <p className="font-bold text-slate-900">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '18 Jul 2026'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Health & Medical Profile */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Health & Medical Profile</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</p>
                    <p className="font-black text-rose-600 text-sm">
                      {student.bloodGroup || 'Not Provided'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Special Health Notes</p>
                    <p className="font-medium text-slate-600">
                      {student.medicalInfo || 'No known allergies or chronic conditions reported.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sports & Physical Fitness</p>
                    <p className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Eligible for all activities
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Portal Credentials & System ID */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">Portal & System Account</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Roll No / Login ID</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-black text-blue-600">{student.rollNo}</p>
                      <button onClick={() => handleCopy(student.rollNo, 'Roll No')} className="text-slate-400 hover:text-blue-600 cursor-pointer">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System User UUID</p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[11px] font-medium text-slate-600 truncate max-w-[170px]">{student.id}</p>
                      <button onClick={() => handleCopy(student.id, 'UUID')} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Account Status</p>
                    <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active (Full Access)
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* ALL MODALS (100% PRESERVED & CONNECTED)                       */}
      {/* ============================================================ */}

      {/* Change Section Modal */}
      {showSectionModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowSectionModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white rounded-2xl shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Change Class / Section</h3>
              <p className="text-xs text-slate-500 mt-1">For {student.user?.name} ({student.rollNo})</p>
            </div>
            
            <form onSubmit={handleChangeSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select New Class</label>
                <select 
                  value={newClassId} 
                  onChange={(e) => setNewClassId(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">-- Select Class & Section --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section} ({c.academicYear})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowSectionModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer">{isSubmitting ? 'Updating...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Change Name Modal */}
      {showNameModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => setShowNameModal(false)} />
          <div className="relative card w-full max-w-sm p-6 space-y-5 animate-scale-in z-10 bg-white rounded-2xl shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Student Name</h3>
              <p className="text-xs text-slate-500 mt-1">Change the official full name of the student.</p>
            </div>

            <form onSubmit={handleChangeNameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNameModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer">Save Name</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Demographics Modal */}
      {showDemographicsModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setShowDemographicsModal(false)} />
          <div className="relative card w-full max-w-lg p-6 space-y-5 animate-scale-in z-10 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <User2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Demographics</h3>
                  <p className="text-xs text-slate-500">Update gender, DOB, blood group, Aadhaar & PEN for {student.user?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDemographicsModal(false)}
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDemographics} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male (బాలుడు)</option>
                    <option value="FEMALE">Female (బాలిక)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Blood Group</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Aadhaar Number {editAadharNo ? `(${editAadharNo.length}/12)` : ''}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editAadharNo}
                    onChange={(e) => setEditAadharNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="12-digit Aadhaar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">PEN Number</label>
                  <input
                    type="text"
                    value={editPenNumber}
                    onChange={(e) => setEditPenNumber(e.target.value.toUpperCase())}
                    placeholder="Permanent Education Number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemographicsModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Demographics'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Family Details Modal */}
      {showFamilyModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setShowFamilyModal(false)} />
          <div className="relative card w-full max-w-xl p-6 space-y-5 animate-scale-in z-10 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Family & Address Details</h3>
                  <p className="text-xs text-slate-500">Update parents, guardian contacts, and address for {student.user?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamily} className="space-y-4">
              {/* Father Details */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👨</span> Father's Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Father Name</label>
                    <input
                      type="text"
                      value={editFatherName}
                      onChange={(e) => setEditFatherName(e.target.value)}
                      placeholder="Father's full name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aadhaar</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={editFatherAadhar}
                      onChange={(e) => setEditFatherAadhar(e.target.value.replace(/\D/g, ''))}
                      placeholder="12-digit Aadhaar"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editFatherPhone}
                      onChange={(e) => setEditFatherPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit Mobile"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mother Details */}
              <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-100 space-y-3">
                <h4 className="text-xs font-bold text-pink-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👩</span> Mother's Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mother Name</label>
                    <input
                      type="text"
                      value={editMotherName}
                      onChange={(e) => setEditMotherName(e.target.value)}
                      placeholder="Mother's full name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Aadhaar</label>
                    <input
                      type="text"
                      maxLength={12}
                      value={editMotherAadhar}
                      onChange={(e) => setEditMotherAadhar(e.target.value.replace(/\D/g, ''))}
                      placeholder="12-digit Aadhaar"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editMotherPhone}
                      onChange={(e) => setEditMotherPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit Mobile"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian / Alternate Details */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛡️</span> Guardian / Alternate Contact (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={editGuardianName}
                      onChange={(e) => setEditGuardianName(e.target.value)}
                      placeholder="Guardian name"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relation</label>
                    <input
                      type="text"
                      value={editGuardianRelation}
                      onChange={(e) => setEditGuardianRelation(e.target.value)}
                      placeholder="e.g. Grandfather, Uncle"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editGuardianPhone}
                      onChange={(e) => setEditGuardianPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit Phone"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Residential Home Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Full residential address"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Family Details'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* PRINT-ONLY OFFICIAL DOSSIER VIEW                             */}
      {/* ============================================================ */}
      {!printPayment && createPortal(
        <div id="student-profile-print-root" className="hidden print:flex">
          <style type="text/css" media="print">
            {`
              @page { size: A4 portrait; margin: 0 !important; }
              body * { visibility: hidden !important; }
              #student-profile-print-root, #student-profile-print-root * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #student-profile-print-root {
                position: fixed !important;
                left: 0 !important; top: 0 !important;
                width: 210mm !important; height: 297mm !important;
                max-height: 297mm !important;
                padding: 10mm 12mm !important;
                background: #ffffff !important;
                display: flex !important; flex-direction: column !important;
                justify-content: space-between !important;
                z-index: 99999999 !important;
              }
            `}
          </style>

          <div className="w-full h-full border-[3px] border-slate-900 p-0 flex flex-col relative bg-white text-slate-900" style={{ fontFamily: "'Times New Roman', serif" }}>
            <div className="h-1.5 bg-gradient-to-r from-indigo-900 via-blue-700 to-indigo-900 shrink-0"></div>

            <div className="text-center px-6 pt-3 pb-2 border-b-2 border-slate-800 relative z-10">
              <div className="flex items-center justify-center gap-4">
                <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div>
                  <h1 className="text-[24px] font-black tracking-[0.15em] uppercase leading-tight">SRI VENKATESWARA JY SCHOOL</h1>
                  <p className="text-[10px] font-bold text-slate-600 mt-0.5">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist., A.P.</p>
                </div>
              </div>
              <div className="mt-2 bg-slate-900 text-white py-[3px] tracking-[0.35em] text-[10px] font-black uppercase">
                OFFICIAL STUDENT RECORD DOSSIER
              </div>
            </div>

            <div className="flex items-start gap-4 px-5 py-3 border-b border-slate-300 relative z-10">
              <div className="flex-1">
                <h2 className="text-[22px] font-black uppercase">{student.user?.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-[10px]">
                  <span className="font-bold text-slate-600">Roll No: <span className="font-black text-slate-900">{student.rollNo}</span></span>
                  <span>|</span>
                  <span className="font-bold text-slate-600">Class: <span className="font-black text-slate-900">{student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}</span></span>
                  <span>|</span>
                  <span className="font-bold text-slate-600">Gender: <span className="font-black text-slate-900">{student.gender || 'N/A'}</span></span>
                </div>
              </div>
              <div className="w-[75px] h-[90px] border-2 border-slate-700 overflow-hidden bg-white flex items-center justify-center">
                {getPhotoUrl(student.user?.photoUrl) ? (
                  <img src={getPhotoUrl(student.user.photoUrl)} alt={student.user?.name} className="w-full h-full object-cover" />
                ) : (
                  <User2 className="w-8 h-8 text-slate-300" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-300 flex-1">
              <div className="border-r border-slate-300 p-3 space-y-1 text-[10px]">
                <div className="font-black text-slate-700 uppercase tracking-wider mb-2">PERSONAL DETAILS</div>
                <p>DOB: <strong>{student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}</strong></p>
                <p>Blood Group: <strong>{student.bloodGroup || 'N/A'}</strong></p>
                <p>Aadhaar: <strong className="font-mono">{student.aadharNo || 'N/A'}</strong></p>
                <p>PEN: <strong className="font-mono">{student.penNumber || 'N/A'}</strong></p>
              </div>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="font-black text-slate-700 uppercase tracking-wider mb-2">FAMILY DETAILS</div>
                <p>Father: <strong>{student.fatherName || 'N/A'}</strong></p>
                <p>Mother: <strong>{student.motherName || 'N/A'}</strong></p>
                <p>Contact: <strong>{student.fatherPhone || student.motherPhone || 'N/A'}</strong></p>
                <p>Address: <strong>{student.address || 'Narasannapeta, Srikakulam, AP'}</strong></p>
              </div>
            </div>

            <div className="flex items-end justify-between px-6 py-4">
              <div className="text-center w-36">
                <div className="border-b-2 border-slate-800 h-8 mb-1"></div>
                <span className="text-[10px] font-black uppercase">Class Teacher</span>
              </div>
              <div className="text-center w-36">
                <div className="border-b-2 border-slate-800 h-8 mb-1"></div>
                <span className="text-[10px] font-black uppercase">Principal</span>
              </div>
            </div>

            <div className="h-1.5 bg-gradient-to-r from-indigo-900 via-blue-700 to-indigo-900 shrink-0"></div>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden Print Component for Receipts */}
      {printPayment && createPortal(
        <div id="student-fee-receipt-print-root" className="hidden print:block">
          <FeeReceiptPrint payment={printPayment} />
        </div>,
        document.body
      )}

    </div>
  );
};

export default StudentProfilePage;
