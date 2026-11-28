import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useLocation, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { Badge } from '../../components/UI/Badge';
import { PageHeader } from '../../components/UI/PageHeader';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera, CreditCard, FileDown, Trash2, Edit2, X,
  CheckCircle2, AlertCircle, Home, ChevronRight, BookOpen, MessageCircle, ArrowRight,
  Copy, ExternalLink, ShieldCheck, Award, FileText, Activity, HeartPulse, Navigation, Clock, Check, Building, Bus, Heart, Mail, ShieldAlert,
  ChevronDown, Search, CheckCircle, Info, Plus, Percent, Tag, Coins, RotateCcw
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
  const [discountFinalFee, setDiscountFinalFee] = useState<number>(0);
  const [discountRemarks, setDiscountRemarks] = useState<string>('');
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
  const [editChildId, setEditChildId] = useState('');
  const [editApaarId, setEditApaarId] = useState('');

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

  // Helper: Format 12-digit Aadhaar as "XXXX XXXX XXXX"
  const formatAadhaar = (val?: string | null) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
    }
    return String(val).trim();
  };

  const openDemographicsModal = () => {
    if (!student) return;
    setEditGender(student.gender || '');
    setEditDob(student.dob ? new Date(student.dob).toISOString().split('T')[0] : '');
    setEditBloodGroup(student.bloodGroup || '');
    setEditAadharNo(student.aadharNo || '');
    setEditPenNumber(student.penNumber || '');
    setEditChildId(student.childId || '');
    setEditApaarId(student.apaarId || '');
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
        childId: editChildId ? editChildId.trim() : null,
        apaarId: editApaarId ? editApaarId.trim() : null,
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

  const openDiscountModal = (s: any) => {
    const discountRecord = student?.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
    const existingConcession = discountRecord ? Number(discountRecord.amount) || 0 : 0;
    setDiscountFee(s);
    setDiscountAmount(existingConcession);
    setDiscountFinalFee(Math.max(0, s.amount - existingConcession));
    setDiscountRemarks(discountRecord?.remarks || '');
    setShowDiscountModal(true);
  };

  const handleDiscountAmountChange = (concession: number) => {
    const base = discountFee?.amount || 0;
    const cleanConcession = Math.max(0, Math.min(base, concession));
    setDiscountAmount(cleanConcession);
    setDiscountFinalFee(base - cleanConcession);
  };

  const handleFinalFeeChange = (finalFee: number) => {
    const base = discountFee?.amount || 0;
    const cleanFinalFee = Math.max(0, Math.min(base, finalFee));
    setDiscountFinalFee(cleanFinalFee);
    setDiscountAmount(base - cleanFinalFee);
  };

  const handleApplyDiscount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!discountFee) return;
    setIsSubmitting(true);
    const concession = Math.max(0, Number(discountAmount) || 0);
    try {
      await api.post(`/api/fees/discounts`, {
        studentId: student.id,
        feeStructureId: discountFee.id,
        discountAmount: concession,
        remarks: discountRemarks || null
      });
      toast.success(concession > 0 ? `₹${concession.toLocaleString('en-IN')} concession applied successfully!` : 'Concession reset successfully!');
      setShowDiscountModal(false);
      setDiscountFee(null);
      setDiscountAmount(0);
      setDiscountFinalFee(0);
      setDiscountRemarks('');
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error applying discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!discountFee) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/fees/discounts`, {
        studentId: student.id,
        feeStructureId: discountFee.id,
        discountAmount: 0,
        remarks: null
      });
      toast.success('Fee concession removed successfully!');
      setShowDiscountModal(false);
      setDiscountFee(null);
      setDiscountAmount(0);
      setDiscountFinalFee(0);
      setDiscountRemarks('');
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error removing discount');
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
    if (!st) return { percentage: 0, completed: [], missing: [], total: 14 };
    const checklist = [
      { key: 'photo', label: 'Student Photo', done: Boolean(st.user?.photoUrl), modal: 'photo' },
      { key: 'gender', label: 'Gender', done: Boolean(st.gender), modal: 'demographics' },
      { key: 'dob', label: 'Date of Birth', done: Boolean(st.dob), modal: 'demographics' },
      { key: 'bloodGroup', label: 'Blood Group', done: Boolean(st.bloodGroup), modal: 'demographics' },
      { key: 'aadharNo', label: 'Aadhaar Number', done: Boolean(st.aadharNo), modal: 'demographics' },
      { key: 'penNumber', label: 'PEN Number', done: Boolean(st.penNumber), modal: 'demographics' },
      { key: 'childId', label: 'Child ID', done: Boolean(st.childId), modal: 'demographics' },
      { key: 'apaarId', label: 'APAAR ID', done: Boolean(st.apaarId), modal: 'demographics' },
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
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col">
        <div className="h-16 w-full bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 opacity-90 animate-pulse" />
        <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-5 animate-pulse">
          <div className="h-5 w-52 bg-indigo-100 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-4 space-y-4">
              <div className="h-80 rounded-[26px] bg-white border border-indigo-100/80 shadow-sm" />
              <div className="h-44 rounded-[24px] bg-white border border-slate-200/80 shadow-sm" />
            </div>
            <div className="lg:col-span-8 space-y-4">
              <div className="h-14 rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
              <div className="h-72 rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
              <div className="h-56 rounded-2xl bg-white border border-slate-200/80 shadow-sm" />
            </div>
          </div>
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

  const studentChecklist = [
    { label: 'Student Photo', done: Boolean(student?.user?.photoUrl), action: () => document.getElementById('student-photo-file-input')?.click() },
    { label: 'Date of Birth', done: Boolean(student?.dob), action: openDemographicsModal },
    { label: 'Gender', done: Boolean(student?.gender), action: openDemographicsModal },
    { label: 'Blood Group', done: Boolean(student?.bloodGroup), action: openDemographicsModal },
    { label: 'Aadhaar Number', done: Boolean(student?.aadharNo), action: openDemographicsModal },
    { label: 'PEN Number (UDISE+)', done: Boolean(student?.penNumber), action: openDemographicsModal },
    { label: 'Child ID', done: Boolean(student?.childId), action: openDemographicsModal },
    { label: 'APAAR ID', done: Boolean(student?.apaarId), action: openDemographicsModal },
    { label: 'Class & Section', done: Boolean(student?.classId), action: () => {
      setNewClassId(student?.classId || '');
      if (classes.length === 0) {
        api.get('/api/classes').then(res => setClasses(res.data.data || res.data || [])).catch(() => {});
      }
      setShowSectionModal(true);
    } },
  ];
  const studentCompletedCount = studentChecklist.filter(item => item.done).length;
  const studentPercentage = Math.round((studentCompletedCount / studentChecklist.length) * 100);

  const primaryParentPhone = student.fatherPhone || student.motherPhone || student.guardianPhone || '';
  const whatsappPhone = primaryParentPhone.replace(/\D/g, '');

  return (
    <div className="flex flex-col min-h-full bg-[#F5F7FB] text-slate-800 print:hidden font-sans">
      
      {/* Unified Top Bar matching all ERP Pages */}
      <PageHeader
        title="Student Profile"
        icon={<GraduationCap className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/students"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Students</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setPrintPayment(null);
                setTimeout(() => window.print(), 100);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Profile</span>
            </button>
            {(isAdmin || canEdit) && (
              <Link
                to={`/students/${student.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold shadow-sm transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            )}
            {(isAdmin || user?.role === 'ACCOUNTANT') && (
              <Link
                to={`/students/${student.id}/pay-fee`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-extrabold shadow-sm transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Fee</span>
              </Link>
            )}
          </div>
        }
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-4">
        
        {/* Clean Light Breadcrumb & Session Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Link to="/" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Home className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link to="/students" className="hover:text-indigo-600 transition-colors">Students</Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-800 font-extrabold truncate max-w-[200px] sm:max-w-none">{student.user?.name || 'Student Profile'}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-indigo-100 text-[11px] font-bold text-indigo-700 shadow-2xs">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <span>JY High School • {student.class?.academicYear || '2026 – 27'}</span>
          </span>
        </div>

        {/* ============================================================ */}
        {/* MODERN LIGHT PASTEL 2-COLUMN BENTO WORKSPACE                 */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT STICKY IDENTITY & SNAPSHOT RAIL */}
          <div className="lg:col-span-4 lg:sticky lg:top-5 space-y-4">

            {/* Card A: Clean Light Pastel Student Identity Card */}
            <div className="bg-white rounded-[26px] border border-indigo-100/90 shadow-sm overflow-hidden">
              
              {/* Soft Pastel Header Strip (No Dark Hero Banner) */}
              <div className="h-20 bg-gradient-to-r from-[#EBF3FF] via-[#F4EEFF] to-[#FFF0F6] border-b border-indigo-100/60 px-4 pt-3.5 flex items-start justify-between relative">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/85 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  <span>Verified Profile</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active Student</span>
                </span>
              </div>

              {/* Portrait + Identity Content */}
              <div className="-mt-11 px-5 pb-5 flex flex-col items-center text-center">
                
                {/* Student Portrait Frame */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-[22px] bg-white p-1.5 shadow-md ring-4 ring-white border border-indigo-100">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#EEF4FF] to-[#F5EEFF] flex items-center justify-center relative">
                      {getPhotoUrl(student.user?.photoUrl) ? (
                        <img 
                          src={getPhotoUrl(student.user.photoUrl)} 
                          alt={student.user?.name} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-indigo-300 p-2">
                          <User2 className="w-11 h-11 mb-0.5 text-indigo-400" />
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Camera Upload Button */}
                  {(isAdmin || user?.role === 'TEACHER') && (
                    <label 
                      className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md ring-2 ring-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
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

                {/* Student Name & Edit Action */}
                <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {student.user?.name}
                  </h1>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setNewStudentName(student.user?.name || '');
                        setShowNameModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                      title="Edit Student Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Admission No: <span className="font-mono font-bold text-indigo-700">{student.admissionNo || student.rollNo}</span>
                  {student.gender && <span className="capitalize"> • {student.gender.toLowerCase()}</span>}
                </p>

                {/* Soft Pastel Meta Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(student.rollNo, 'Student ID')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#EEF4FF] text-[#3730A3] border border-[#DCE6FF] hover:bg-[#E2ECFF] transition-colors cursor-pointer"
                    title="Click to Copy Student ID"
                  >
                    <Hash className="w-3 h-3 text-indigo-500" />
                    <span>{student.rollNo}</span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#F4EEFF] text-[#6D28D9] border border-[#E6DBFF]">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                    <span>{student.class ? `${student.class.name} - ${student.class.section}` : 'Not Enrolled'}</span>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setNewClassId(student.classId || '');
                          if (classes.length === 0) {
                            api.get('/api/classes').then(res => setClasses(res.data.data || res.data || [])).catch(() => {});
                          }
                          setShowSectionModal(true);
                        }}
                        className="ml-0.5 text-violet-500 hover:text-violet-800 cursor-pointer"
                        title="Change Section"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {studentAge !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#FFF5E8] text-[#B45309] border border-[#FDE2BE]">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{studentAge} Yrs</span>
                    </span>
                  )}

                  {student.bloodGroup && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#FFF0F2] text-[#BE123C] border border-[#FFD6DC]">
                      <Droplet className="w-3 h-3 text-rose-500 fill-rose-500" />
                      <span>{student.bloodGroup}</span>
                    </span>
                  )}
                </div>

                {/* 2-Column Mini Pastel Summary Strip */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-4 pt-4 border-t border-slate-100 text-left">
                  <div className="bg-[#F3F8FF] border border-[#E1ECFF] rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined On</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '18 Jul 2026'}
                    </p>
                  </div>

                  <div className="bg-[#F6F3FF] border border-[#E8E0FF] rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Session</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {student.class?.academicYear || '2026 – 27'}
                    </p>
                  </div>
                </div>

                {/* Quick Parent Contact Strip */}
                {primaryParentPhone && (
                  <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    <a
                      href={`tel:${primaryParentPhone}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-emerald-700 border border-emerald-200/70 text-xs font-extrabold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Parent</span>
                    </a>
                    <a
                      href={`https://wa.me/${whatsappPhone.length === 10 ? '91' + whatsappPhone : whatsappPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#EEF4FF] hover:bg-[#E0EAFF] text-indigo-700 border border-indigo-200/70 text-xs font-extrabold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

              </div>
            </div>

            {/* Card B: Fee Snapshot & Quick Actions */}
            <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">Fee & Account Snapshot</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Live financial clearance</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {feeProgress}% Paid
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#D1FAE5]">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Paid</p>
                  <p className="text-sm font-black text-emerald-900 mt-0.5">₹{totalFeePaid.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF6EB] border border-[#FFE1BA]">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending Due</p>
                  <p className="text-sm font-black text-amber-900 mt-0.5">₹{totalFeePending.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                  style={{ width: `${feeProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(isAdmin || canEdit) && (
                  <Link
                    to={`/students/${student.id}/edit`}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#F3F0FF] hover:bg-[#E7E0FF] text-indigo-700 border border-indigo-100 text-[11px] font-extrabold transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPrintPayment(null);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-emerald-700 border border-emerald-100 text-[11px] font-extrabold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                {(isAdmin || user?.role === 'ACCOUNTANT') && (
                  <Link
                    to={`/students/${student.id}/pay-fee`}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl bg-[#FFF4E8] hover:bg-[#FFE6CC] text-amber-800 border border-amber-200/70 text-[11px] font-extrabold transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Fee</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Card C: Profile Completeness Card */}
            <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-4 flex items-center gap-3.5">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 88 88">
                  <circle
                    cx="44"
                    cy="44"
                    r={circleRadius}
                    stroke="rgba(99, 102, 241, 0.14)"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r={circleRadius}
                    stroke="url(#pastel-progress-grad)"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="pastel-progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xs font-black text-slate-800">{percentage}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900">Profile Completeness</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{completed.length} of {total} key details saved</p>
                {percentage < 100 && canEdit && (
                  <button
                    type="button"
                    onClick={openDemographicsModal}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Complete Missing ({missing.length})
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT WORKSPACE: NAVIGATION TABS + CONTENT */}
          <div className="lg:col-span-8 space-y-4 min-w-0">

            {/* ============================================================ */}
            {/* PREMIUM PASTEL NAVIGATION TABS                               */}
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
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                        : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/25 text-white' : 'bg-indigo-50 text-indigo-600'
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
          <div className="space-y-4 animate-fade-in">
            
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
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/50 to-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-inner">
                        <User2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                        <p className="text-sm font-black text-slate-800 capitalize mt-0.5">
                          {student.gender ? (
                            <span className="text-slate-900 font-extrabold">{student.gender.toLowerCase()}</span>
                          ) : (
                            <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!student.gender && canEdit && (
                      <button
                        onClick={openDemographicsModal}
                        className="px-2.5 py-1 text-[11px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>

                  {/* Date of Birth Tile */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
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
                    {!student.dob && canEdit && (
                      <button
                        onClick={openDemographicsModal}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>

                  {/* Blood Group Tile */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/50 to-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Droplet className="w-5 h-5 fill-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                        <p className="text-sm font-black mt-0.5">
                          {student.bloodGroup ? (
                            <span className="text-rose-600 font-extrabold">{student.bloodGroup}</span>
                          ) : (
                            <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!student.bloodGroup && canEdit && (
                      <button
                        onClick={openDemographicsModal}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>

                  {/* Aadhaar Number Tile - UNMASKED & FULL DIGITS */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar Number</p>
                        <p className="text-sm font-mono font-black text-slate-900 mt-0.5 tracking-wider">
                          {student.aadharNo ? (
                            formatAadhaar(student.aadharNo)
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.aadharNo ? (
                      <button
                        onClick={() => handleCopy(student.aadharNo, 'Aadhaar Number')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      canEdit && (
                        <button
                          onClick={openDemographicsModal}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      )
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                            Pending Allotment
                          </span>
                          {canEdit && (
                            <button
                              onClick={openDemographicsModal}
                              className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Child ID & APAAR ID in Grid - ALWAYS VISIBLE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Child ID */}
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/70 flex items-center justify-between text-xs font-bold">
                      <span className="text-sky-800 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-sky-600" /> Child ID
                      </span>
                      <div className="flex items-center gap-1.5">
                        {student.childId ? (
                          <>
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
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-sans text-[11px]">Not Provided</span>
                            {canEdit && (
                              <button
                                onClick={openDemographicsModal}
                                className="px-2 py-0.5 text-[10px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* APAAR ID */}
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/70 flex items-center justify-between text-xs font-bold">
                      <span className="text-purple-800 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-purple-600" /> APAAR ID
                      </span>
                      <div className="flex items-center gap-1.5">
                        {student.apaarId ? (
                          <>
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
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-sans text-[11px]">Not Provided</span>
                            {canEdit && (
                              <button
                                onClick={openDemographicsModal}
                                className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Card 2: Institutional & Academic Enrollment Profile */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Institutional Enrollment Status</h3>
                      <p className="text-[11px] text-slate-400">Current class, section, session & academic standing</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setNewClassId(student.classId || '');
                        if (classes.length === 0) {
                          api.get('/api/classes').then(res => setClasses(res.data.data || res.data || [])).catch(() => {});
                        }
                        setShowSectionModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Change Section</span>
                    </button>
                  )}
                </div>

                {/* 2x2 Enrollment Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Class & Section */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white border border-indigo-100/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                        Enrolled Grade
                      </span>
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-base font-black text-slate-900 mt-2">
                      {student.class ? `${student.class.name} - ${student.class.section}` : 'Not Enrolled'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Class Teacher: {student.class?.classTeacher?.user?.name || 'Assigned Staff'}
                    </p>
                  </div>

                  {/* Academic Session */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-white border border-blue-100/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        Academic Year
                      </span>
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-base font-black text-slate-900 mt-2">
                      {student.class?.academicYear || '2026 – 2027'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Admission: {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '18 Jul 2026'}
                    </p>
                  </div>

                  {/* Student Roll No */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/60 via-slate-50 to-white border border-sky-100/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
                        Student ID / Roll
                      </span>
                      <button
                        onClick={() => handleCopy(student.rollNo, 'Student ID')}
                        className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                        title="Copy Roll No"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-base font-mono font-black text-slate-900 mt-2">
                      {student.rollNo}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Institutional Roll Identity
                    </p>
                  </div>

                  {/* Institutional Status */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/60 via-slate-50 to-white border border-emerald-100/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Student Status
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-base font-black text-emerald-950 mt-2 flex items-center gap-1.5">
                      <span>Active Student</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Full Privileges & Enrolled
                    </p>
                  </div>

                </div>

                {/* Campus & Institution Info Footer */}
                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">JY High School, Narasannapeta</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">Regular Day Scholar</span>
                </div>
              </div>

              {/* Card 4: Student Health & Medical Safety Profile */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Student Health & Medical Safety</h3>
                      <p className="text-[11px] text-slate-400">Blood group, fitness classification & campus emergency care</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={openDemographicsModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Update Blood
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  
                  {/* Blood Group Highlight Card */}
                  <div className="sm:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                        Emergency Blood
                      </span>
                      <Droplet className="w-4 h-4 text-white/80 fill-white" />
                    </div>
                    <div className="my-2">
                      <span className="text-3xl font-black tracking-tight">
                        {student.bloodGroup || 'N/A'}
                      </span>
                    </div>
                    <p className="text-[10px] text-rose-100 font-medium">
                      {student.bloodGroup ? 'Verified Category' : 'Blood group not set'}
                    </p>
                  </div>

                  {/* Physical Fitness & Activity Notes */}
                  <div className="sm:col-span-7 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fitness & Activity Clearance</span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1">
                        Fit for Physical Education, Sports & Activities
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {student.medicalInfo || 'No chronic health issues or allergies reported.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>First-Aid Ready</span>
                      </span>
                      <span className="font-semibold text-slate-400">Annual Checkup</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 5: Student Records Completeness (100% Student Focus) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3.5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Student Records Verification ({studentPercentage}%)
                      </h3>
                      <p className="text-[11px] text-slate-400">Institutional validation of student's personal documentation</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {studentCompletedCount} of {studentChecklist.length} Verified
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${studentPercentage}%` }}
                  />
                </div>

                {/* Checklist Tiles Grid - 100% STUDENT RECORDS ONLY */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {studentChecklist.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={!item.done && canEdit ? item.action : undefined}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                        item.done 
                          ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-600 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer'
                      }`}
                    >
                      <span className="truncate pr-1 text-[11px]">{item.label}</span>
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-blue-600 font-extrabold shrink-0 bg-blue-50 px-1.5 py-0.5 rounded-md hover:bg-blue-100 border border-blue-200/50">
                          Add +
                        </span>
                      )}
                    </div>
                  ))}
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
                        <p className="text-xs font-mono font-black text-slate-900 mt-0.5">
                          {student.fatherPhone ? (
                            student.fatherPhone
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.fatherPhone ? (
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
                    ) : (
                      canEdit && (
                        <button
                          onClick={openFamilyModal}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Phone
                        </button>
                      )
                    )}
                  </div>

                  {/* Aadhaar Row - FULL UNMASKED AADHAAR */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Father Aadhaar</p>
                        <p className="text-xs font-mono font-black text-slate-900 tracking-wider mt-0.5">
                          {student.fatherAadhar ? (
                            formatAadhaar(student.fatherAadhar)
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.fatherAadhar ? (
                      <button
                        onClick={() => handleCopy(student.fatherAadhar, "Father's Aadhaar")}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      canEdit && (
                        <button
                          onClick={openFamilyModal}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Aadhaar
                        </button>
                      )
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
                        <p className="text-xs font-mono font-black text-slate-900 mt-0.5">
                          {student.motherPhone ? (
                            student.motherPhone
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.motherPhone ? (
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
                    ) : (
                      canEdit && (
                        <button
                          onClick={openFamilyModal}
                          className="px-2.5 py-1 text-[11px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Phone
                        </button>
                      )
                    )}
                  </div>

                  {/* Aadhaar Row - FULL UNMASKED AADHAAR */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mother Aadhaar</p>
                        <p className="text-xs font-mono font-black text-slate-900 tracking-wider mt-0.5">
                          {student.motherAadhar ? (
                            formatAadhaar(student.motherAadhar)
                          ) : (
                            <span className="text-amber-600 font-sans font-bold text-xs">Not Provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {student.motherAadhar ? (
                      <button
                        onClick={() => handleCopy(student.motherAadhar, "Mother's Aadhaar")}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Copy Aadhaar"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      canEdit && (
                        <button
                          onClick={openFamilyModal}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Aadhaar
                        </button>
                      )
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
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Fee Ledger</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin || user?.role === 'ACCOUNTANT') && (
                      <Link 
                        to={`/students/${student.id}/pay-fee`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 border border-emerald-200/80 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>Pay Fee</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
                  {relevantFeeStructures.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 font-bold">No fee structures assigned yet.</p>
                  ) : (
                    relevantFeeStructures.map((s) => {
                      const discountRecord = student.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
                      const discount = discountRecord ? Number(discountRecord.amount) || 0 : 0;
                      const effectiveAmount = Math.max(0, s.amount - discount);
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0) || 0;
                      const pending = Math.max(0, effectiveAmount - paidSoFar);
                      const progress = effectiveAmount > 0 ? Math.min(100, Math.round((paidSoFar / effectiveAmount) * 100)) : 100;
                      
                      return (
                        <div key={s.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-2.5 transition-all">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">{s.name}</span>
                                {discount > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200 shadow-2xs">
                                    <Tag className="w-2.5 h-2.5" />
                                    -₹{discount.toLocaleString('en-IN')} Concession
                                  </span>
                                )}
                              </div>
                              {discount > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  Base: <span className="line-through font-semibold text-slate-500">₹{s.amount.toLocaleString('en-IN')}</span>
                                  {discountRecord?.remarks && <span className="italic ml-1 text-slate-400">({discountRecord.remarks})</span>}
                                </p>
                              )}
                            </div>

                            <div className="text-right flex flex-col items-end gap-1 shrink-0">
                              <span className="text-xs font-black text-indigo-600">
                                ₹{effectiveAmount.toLocaleString('en-IN')}
                              </span>
                              {(isAdmin || user?.role === 'ACCOUNTANT') && (
                                <button
                                  type="button"
                                  onClick={() => openDiscountModal(s)}
                                  className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-indigo-200/80 active:scale-95 shadow-2xs"
                                  title="Edit Fee / Apply Concession or Discount"
                                >
                                  <Edit2 className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>{discount > 0 ? 'Edit Discount' : 'Edit / Discount'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-emerald-600">Paid: ₹{paidSoFar.toLocaleString('en-IN')} ({progress}%)</span>
                            <span className={pending > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}>
                              {pending > 0 ? `Pending: ₹${pending.toLocaleString('en-IN')}` : 'Cleared'}
                            </span>
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
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {student.feePayments?.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-xs font-bold text-slate-400">No payment records found.</td></tr>
                      ) : (
                        student.feePayments?.map((p: any) => {
                          const dateObj = p.paymentDate ? new Date(p.paymentDate) : (p.createdAt ? new Date(p.createdAt) : null);
                          const isEpoch1970 = dateObj && dateObj.getFullYear() <= 1970;
                          const displayDate = isEpoch1970 && p.createdAt 
                            ? new Date(p.createdAt).toLocaleDateString('en-GB') 
                            : (dateObj ? dateObj.toLocaleDateString('en-GB') : 'N/A');

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-slate-800">
                                <div>{p.feeStructure?.name || 'Fee Payment'}</div>
                                {p.remarks && <div className="text-[10px] text-slate-400 font-normal">{p.remarks}</div>}
                              </td>
                              <td className="px-4 py-2.5 font-black text-emerald-600">₹{(p.amountPaid || 0).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2.5 font-medium text-slate-500">
                                <span>{displayDate}</span>
                                {isEpoch1970 && (
                                  <span className="block text-[9px] text-amber-600 font-semibold">(auto-corrected)</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.method === 'UPI' ? 'bg-purple-100 text-purple-700' : p.method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {p.method}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={() => handlePrintReceipt(p)} 
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" 
                                    title="Print Official Receipt"
                                  >
                                    <FileDown className="w-4 h-4" />
                                  </button>
                                  {(isAdmin || user?.role === 'ACCOUNTANT') && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setEditingPayment({
                                            id: p.id,
                                            amountPaid: p.amountPaid,
                                            method: p.method,
                                            remarks: p.remarks || '',
                                            paymentDate: p.paymentDate && new Date(p.paymentDate).getFullYear() > 1970 
                                              ? new Date(p.paymentDate).toISOString().split('T')[0] 
                                              : (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                                            feeStructureName: p.feeStructure?.name
                                          });
                                          setShowEditModal(true);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" 
                                        title="Edit Payment Record"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeletePayment(p.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" 
                                        title="Delete Payment Record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
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

        </div>

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
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
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
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Permanent Education Number (PEN)</label>
                  <input
                    type="text"
                    value={editPenNumber}
                    onChange={(e) => setEditPenNumber(e.target.value.toUpperCase())}
                    placeholder="UDISE+ Permanent Education Number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Child ID</label>
                  <input
                    type="text"
                    value={editChildId}
                    onChange={(e) => setEditChildId(e.target.value.trim())}
                    placeholder="Child ID / State ID"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">APAAR ID</label>
                  <input
                    type="text"
                    value={editApaarId}
                    onChange={(e) => setEditApaarId(e.target.value.trim())}
                    placeholder="APAAR ID (12-digit)"
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

      {/* Edit Fee / Discount Concession Modal */}
      {showDiscountModal && discountFee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setShowDiscountModal(false)} />
          <div className="relative card w-full max-w-lg p-6 space-y-5 animate-scale-in z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Fee Concession & Discount</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {student.user?.name} • <span className="font-bold text-slate-700">{discountFee.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Standard Base</span>
                <span className="text-xs sm:text-sm font-black text-slate-800">₹{(discountFee.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="block text-[10px] font-bold text-amber-600 uppercase">Concession</span>
                <span className="text-xs sm:text-sm font-black text-amber-700">-₹{(Number(discountAmount) || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-emerald-600 uppercase">New Net Fee</span>
                <span className="text-xs sm:text-sm font-black text-indigo-700">₹{Math.max(0, (discountFee.amount || 0) - (Number(discountAmount) || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              {/* Concession Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Concession Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min={0}
                      max={discountFee.amount || 0}
                      value={discountAmount === 0 ? '' : discountAmount}
                      onChange={(e) => handleDiscountAmountChange(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-amber-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Amount deducted from standard fee</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or New Net Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min={0}
                      max={discountFee.amount || 0}
                      value={discountFinalFee === 0 && discountAmount === discountFee.amount ? '0' : (discountFinalFee || (discountFee.amount - discountAmount))}
                      onChange={(e) => handleFinalFeeChange(Number(e.target.value) || 0)}
                      placeholder={String(discountFee.amount || 0)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Final amount student should pay</p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Concession Shortcuts
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[1000, 2000, 3000, 5000].map((amt) => {
                    if (amt >= (discountFee.amount || 0)) return null;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleDiscountAmountChange(amt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${discountAmount === amt ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                      >
                        ₹{amt.toLocaleString('en-IN')} off
                      </button>
                    );
                  })}
                  {[10, 20, 50].map((pct) => {
                    const concession = Math.round(((discountFee.amount || 0) * pct) / 100);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleDiscountAmountChange(concession)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${discountAmount === concession ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                      >
                        {pct}% off
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleDiscountAmountChange(discountFee.amount || 0)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${discountAmount === discountFee.amount ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'}`}
                  >
                    100% Free Waiver
                  </button>
                </div>
              </div>

              {/* Remarks / Concession Reason */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Reason / Concession Category
                </label>
                <input
                  type="text"
                  value={discountRemarks}
                  onChange={(e) => setDiscountRemarks(e.target.value)}
                  placeholder="e.g., Sibling discount, Staff child, Merit scholarship, Financial concession"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Sibling Discount', 'Staff Ward', 'Merit Scholarship', 'Management Concession', 'Special Approval'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDiscountRemarks(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${discountRemarks === cat ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                      +{cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Impact Calculation Card */}
              {(() => {
                const paidForThis = student.feePayments?.filter((p: any) => p.feeStructureId === discountFee.id).reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0) || 0;
                const newEffective = Math.max(0, (discountFee.amount || 0) - (Number(discountAmount) || 0));
                const newPending = Math.max(0, newEffective - paidForThis);
                return (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Original Base Fee:</span>
                      <span className="font-bold">₹{(discountFee.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Discount / Concession:</span>
                      <span>-₹{(Number(discountAmount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-indigo-900 font-black border-t border-indigo-200/60 pt-1">
                      <span>Adjusted Student Obligation:</span>
                      <span>₹{newEffective.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Already Paid So Far:</span>
                      <span className="font-bold">₹{paidForThis.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-black text-rose-600 border-t border-indigo-200/60 pt-1">
                      <span>Remaining Balance Due:</span>
                      <span>₹{newPending.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  {(student.feeDiscounts?.some((d: any) => d.feeStructureId === discountFee.id && Number(d.amount) > 0)) && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      disabled={isSubmitting}
                      className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                    >
                      Remove Concession
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Update Fee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Payment Record Modal */}
      {showEditModal && editingPayment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setShowEditModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white border border-slate-200 rounded-2xl shadow-2xl">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Payment Record</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingPayment.feeStructureName || 'Fee Payment'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editingPayment.amountPaid}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amountPaid: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={editingPayment.paymentDate}
                  onChange={(e) => setEditingPayment({ ...editingPayment, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Correct incorrect or 1970 dates</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={editingPayment.method}
                  onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR (PhonePe / GPay)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editingPayment.remarks}
                  onChange={(e) => setEditingPayment({ ...editingPayment, remarks: e.target.value })}
                  placeholder="Optional remarks"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
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
                <div className="font-black text-slate-700 uppercase tracking-wider mb-2">PERSONAL & GOVT DETAILS</div>
                <p>DOB: <strong>{student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}</strong></p>
                <p>Blood Group: <strong>{student.bloodGroup || 'N/A'}</strong></p>
                <p>Aadhaar: <strong className="font-mono">{student.aadharNo ? formatAadhaar(student.aadharNo) : 'N/A'}</strong></p>
                <p>PEN: <strong className="font-mono">{student.penNumber || 'N/A'}</strong></p>
                {student.childId && <p>Child ID: <strong className="font-mono">{student.childId}</strong></p>}
                {student.apaarId && <p>APAAR ID: <strong className="font-mono">{student.apaarId}</strong></p>}
              </div>
              <div className="p-3 space-y-1 text-[10px]">
                <div className="font-black text-slate-700 uppercase tracking-wider mb-2">FAMILY DETAILS</div>
                <p>Father: <strong>{student.fatherName || 'N/A'}</strong></p>
                {student.fatherAadhar && <p>Father Aadhaar: <strong className="font-mono">{formatAadhaar(student.fatherAadhar)}</strong></p>}
                <p>Mother: <strong>{student.motherName || 'N/A'}</strong></p>
                {student.motherAadhar && <p>Mother Aadhaar: <strong className="font-mono">{formatAadhaar(student.motherAadhar)}</strong></p>}
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
