import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera, CreditCard, FileDown, Trash2, Edit2, X
} from 'lucide-react';
import { FeeReceiptPrint } from '../../components/fees/FeeReceiptPrint';
import { PageHeader } from '../../components/UI/PageHeader';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams();
  const outletContext = useOutletContext<any>();
  const setDynamicTitle = outletContext?.setDynamicTitle;
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [student, setStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);
  
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
  const fetchStudentProfile = async () => {
    try {
      const [studentRes, structRes, classRes]: any = await Promise.all([
        api.get(`/api/students/${id}?_t=${Date.now()}`),
        api.get(`/api/fees/structures?_t=${Date.now()}`),
        api.get(`/api/classes?_t=${Date.now()}`),
      ]);
      const studentData = studentRes?.data?.data || studentRes?.data || studentRes;
      const structData = structRes?.data?.data || structRes?.data || structRes || [];
      const classData = classRes?.data?.data || classRes?.data || classRes || [];
      setStudent(studentData);
      setFeeStructures(structData);
      setClasses(classData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... logic remains
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const uploadToast = toast.loading('Uploading payment receipt...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceiptUrl(res.data.url || res.data.data?.url);
      toast.success('Receipt uploaded!', { id: uploadToast });
    } catch (err) {
      toast.error('Failed to upload receipt', { id: uploadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks
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
    // Populate the correct student object structure for FeeReceiptPrint if needed
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
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!student) return <div className="text-center py-12">Student profile not found.</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="print:hidden">
        <PageHeader 
          title={`${student.user.name}'s Profile`}
          icon={
            <Link to="/students">
              <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-indigo-600 cursor-pointer" />
            </Link>
          }
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 lg:p-8 pt-2">
        <div className="w-full space-y-4 print:hidden">
          
          {/* Simple Profile Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden p-4 md:p-6">
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start">
                
                {/* Back Button (Desktop) */}
                <div className="hidden md:block absolute top-6 right-6">
                  <Link 
                    to="/students" 
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Students
                  </Link>
                </div>
                
                {/* Sleek Portrait Avatar */}
                <div className="relative shrink-0 z-10">
                  <div className="w-32 h-40 md:w-36 md:h-48 rounded-xl bg-gray-50 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                    <div className="w-full h-full rounded-lg overflow-hidden">
                      {getPhotoUrl(student.user?.photoUrl) ? (
                        <img 
                          src={getPhotoUrl(student.user.photoUrl)} 
                          alt={student.user.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                          <User2 className="w-10 h-10 mb-1 opacity-40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(isAdmin || user?.role === 'TEACHER') && (
                    <label className="absolute bottom-2 right-2 cursor-pointer flex items-center justify-center w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-transform hover:scale-110 border-2 border-white dark:border-gray-900">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                {/* Core Info */}
                <div className="flex-1 text-center md:text-left w-full">
                  
                  <div className="md:hidden flex justify-center mb-4">
                    <Link 
                      to="/students" 
                      className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Students
                    </Link>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                    {student.user.name}
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setNewStudentName(student.user.name);
                          setShowNameModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                        title="Edit Name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </h2>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                    <Badge variant="info" className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      ID: {student.rollNo}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/50">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                        {student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}
                      </span>
                      {(isAdmin || user?.role === 'TEACHER') && (
                        <button 
                          onClick={() => {
                            setNewClassId(student.classId || '');
                            setShowSectionModal(true);
                          }}
                          className="ml-1 text-purple-400 hover:text-purple-600 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                        Joined {new Date(student.admissionDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {(isAdmin || (user?.role === 'TEACHER' && (user?.teacher as any)?.canEditStudents)) && (
                      <Link
                        to={`/students/${student.id}/edit`}
                        className="bg-white dark:bg-gray-800 text-indigo-600 border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </Link>
                    )}
                    {(isAdmin || user?.role === 'ACCOUNTANT') && (
                      <Link
                        to={`/students/${student.id}/pay-fee`}
                        className="bg-gray-900 text-white flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-800 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Fee</span>
                      </Link>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="hidden md:flex bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 items-center justify-center w-10 h-10 rounded-lg transition-all hover:bg-gray-200"
                      title="Print Profile"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          {/* Details Masonry/Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'TEACHER' ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-4`}>
                
            {/* Demographics Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full">
              <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2 bg-blue-50/30 dark:bg-blue-900/10">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400"><User2 className="w-4 h-4" /></div>
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Demographics</h3>
                  </div>
                  
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Gender</th>
                        <td className="px-3 py-2 font-semibold text-gray-900">{student.gender || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">DOB</th>
                        <td className="px-3 py-2 font-semibold text-gray-900">{student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Blood Grp</th>
                        <td className="px-3 py-2 font-semibold text-rose-600 flex items-center gap-1.5"><Droplet className="w-3 h-3" /> {student.bloodGroup || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Aadhar</th>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-900">{student.aadharNo || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">PEN</th>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-900">{student.penNumber || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

            {/* Family Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full">
              <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2 bg-amber-50/30 dark:bg-amber-900/10">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400"><Users className="w-4 h-4" /></div>
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Family</h3>
                  </div>
                  
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Father</th>
                        <td className="px-3 py-2 font-semibold text-gray-900">{student.fatherName || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Mother</th>
                        <td className="px-3 py-2 font-semibold text-gray-900">{student.motherName || 'N/A'}</td>
                      </tr>
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Guardian</th>
                        <td className="px-3 py-2">
                          {student.parent ? (
                            <div className="space-y-1">
                              <div className="font-bold text-gray-900">{student.parent.user.name}</div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Phone className="w-3 h-3 text-amber-500" /> {student.parent.user.phone || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 font-semibold">No guardian linked.</span>
                          )}
                        </td>
                      </tr>
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <th className="px-3 py-2 w-1/3 font-bold text-gray-500 uppercase bg-gray-50/50">Address</th>
                        <td className="px-3 py-2 text-gray-700 max-w-[150px] truncate" title={student.address}>{student.address || 'No address provided'}</td>
                      </tr>
                    </tbody>
                  </table>
            </div>

            {/* Right Column: Fee Ledger Snapshot */}
            {user?.role !== 'TEACHER' && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-[280px]">
                <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 rounded-lg text-white shadow-md shadow-emerald-500/20"><CreditCard className="w-4 h-4" /></div>
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Fee Ledger</h3>
                  </div>
                </div>
                
                <div className="p-3 flex-1 space-y-2 overflow-y-auto">
                  {feeStructures
                    .filter((s) => s.studentId === student.id || s.classId === student.classId)
                    .map((s) => {
                      const discountRecord = student.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
                      const discount = discountRecord ? discountRecord.amount : 0;
                      const effectiveAmount = s.amount - discount;
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      const pending = Math.max(0, effectiveAmount - paidSoFar);
                      const progress = effectiveAmount > 0 ? Math.min(100, Math.round((paidSoFar / effectiveAmount) * 100)) : 100;
                      
                      return (
                        <div key={s.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{s.name}</span>
                              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => { setDiscountFee(s); setDiscountAmount(effectiveAmount); setShowDiscountModal(true); }} className="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Add Discount"><Edit2 className="w-3 h-3" /></button>
                                  {s.studentId && (
                                    <button onClick={async () => {
                                      if (window.confirm('Are you sure you want to delete this specific fee structure?')) {
                                        try {
                                          await api.delete(`/api/fees/structures/${s.id}`);
                                          toast.success('Fee deleted successfully!');
                                          fetchStudentProfile();
                                        } catch (e: any) {
                                          toast.error(e.message || 'Failed to delete fee');
                                        }
                                      }
                                    }} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Delete Fee"><Trash2 className="w-3 h-3" /></button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {discount > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] line-through text-gray-400">₹{s.amount}</span>
                                  <span className="text-sm font-black text-indigo-600">₹{effectiveAmount}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-black text-indigo-600">₹{s.amount}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-emerald-600">Paid: ₹{paidSoFar}</span>
                            <span className={pending > 0 ? 'text-rose-500' : 'text-gray-400'}>Pending: ₹{pending}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>

          {/* Full Width Transactions Table */}
          {user?.role !== 'TEACHER' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-4">
            <div className="p-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/10">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500 rounded-lg text-white shadow-md shadow-indigo-500/30"><ClipboardCheck className="w-4 h-4" /></div>
                Transaction History
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 dark:bg-gray-800/40 uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Fee Structure</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="hidden md:table-cell px-4 py-2">Method</th>
                    <th className="hidden md:table-cell px-4 py-2">Receipt No</th>
                    <th className="hidden md:table-cell px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {student.feePayments?.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-4 text-center text-xs font-bold text-gray-400">No payment records found.</td></tr>
                  ) : (
                    student.feePayments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{p.feeStructure?.name}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setViewTransaction(p)}
                            className="font-black text-emerald-600 hover:text-emerald-700 underline underline-offset-2 decoration-emerald-300 md:no-underline md:pointer-events-none cursor-pointer text-left"
                            title="Click to view full transaction details"
                          >
                            ₹{p.amountPaid}
                          </button>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="hidden md:table-cell px-4 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${p.method === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.method}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-2 font-mono text-xs font-semibold text-gray-400 truncate max-w-[120px]">{p.receiptNo || 'N/A'}</td>
                        <td className="hidden md:table-cell px-4 py-2 text-right flex items-center justify-end gap-1">
                          <button onClick={() => handlePrintReceipt(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Print Receipt">
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                            <>
                              <button onClick={() => { 
                                setEditingPayment({
                                  ...p,
                                  paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0]
                                }); 
                                setShowEditModal(true); 
                              }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePayment(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

        </div>

      {/* Transaction Details Popup Modal for Mobile */}
      {viewTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 w-full max-w-xs border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Transaction Details</h3>
              <button onClick={() => setViewTransaction(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Fee Structure</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewTransaction.feeStructure?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Amount Paid</span>
                <span className="font-black text-emerald-600 text-sm">₹{viewTransaction.amountPaid}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Date</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(viewTransaction.paymentDate || viewTransaction.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Method</span>
                <span className="font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px]">{viewTransaction.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Receipt No</span>
                <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{viewTransaction.receiptNo || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { handlePrintReceipt(viewTransaction); setViewTransaction(null); }}
                className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-indigo-100 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" /> Receipt
              </button>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                <>
                  <button
                    onClick={() => {
                      setEditingPayment({
                        ...viewTransaction,
                        paymentDate: viewTransaction.paymentDate ? new Date(viewTransaction.paymentDate).toISOString().split('T')[0] : new Date(viewTransaction.createdAt).toISOString().split('T')[0]
                      });
                      setShowEditModal(true);
                      setViewTransaction(null);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePayment(viewTransaction.id);
                      setViewTransaction(null);
                    }}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
             ================= PRINT-ONLY DOSSIER VIEW =================
             ============================================================ */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print\\:hidden { display: none !important; }
        `}
      </style>
      <div className={`hidden ${printPayment ? '' : 'print:flex'} print:w-[210mm] print:h-screen print:max-h-[297mm] bg-white text-black font-sans relative flex-col mx-auto box-border overflow-hidden`}>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-[150mm] h-[150mm] rounded-full border-[20px] border-gray-900 flex items-center justify-center">
             <span className="text-9xl font-black tracking-tighter">JY</span>
          </div>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-[10mm] border-[4px] border-double border-gray-800 pointer-events-none opacity-90" />
        <div className="absolute inset-[11.5mm] border border-gray-400 pointer-events-none" />
        
        <div className="p-[20mm] h-full flex flex-col relative z-10 w-full">
          
          {/* Header */}
          <div className="text-center mb-8 border-b-[3px] border-gray-900 pb-6 relative">
            <h1 className="text-5xl font-black tracking-[0.2em] uppercase text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              JY SCHOOL
            </h1>
            <p className="text-[13px] font-bold uppercase tracking-widest text-gray-700">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
            <div className="mt-6 inline-flex px-12 py-2.5 bg-gray-900 rounded-sm">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-white">
                Official Student Record
              </span>
            </div>
          </div>

          {/* Student ID block */}
          <div className="flex justify-between items-center mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div>
              <h2 className="text-4xl font-black text-gray-900 leading-none mb-4">{student.user.name}</h2>
              <div className="flex gap-6 text-sm font-bold text-gray-700 inline-flex">
                <span className="uppercase tracking-wider">Roll No: <span className="text-black font-black text-lg">{student.rollNo}</span></span>
                <span className="text-gray-400">•</span>
                <span className="uppercase tracking-wider">Class: <span className="text-black font-black text-lg">{student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}</span></span>
              </div>
            </div>
            
            <div className="w-36 h-44 border-4 border-white rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center shadow-md">
              <Avatar 
                src={getPhotoUrl(student.user.photoUrl)} 
                name={student.user.name} 
                size="lg" 
                variant="rectangular" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 flex-grow text-[13px]">
            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Personal Details</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Gender</span>
                <span className="col-span-2 font-bold text-black text-right">{student.gender || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Date of Birth</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Blood Group</span>
                <span className="col-span-2 font-bold text-black text-right">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Admission</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {new Date(student.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-8">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Aadhar No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.aadharNo || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">PEN No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.penNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Family & Contact</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Father Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.fatherName || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Mother Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.motherName || 'N/A'}</span>
              </div>
              
              {student.parent && (
                <>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-4">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Guardian</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.name}</span>
                  </div>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Contact</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.phone || 'N/A'}</span>
                  </div>
                </>
              )}
              
              <div className="flex flex-col gap-1.5 pt-6">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Residential Address</span>
                <span className="text-sm font-bold text-black leading-relaxed p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[72px]">
                  {student.address || 'No address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="mt-auto mb-6 flex justify-between items-end px-6">
            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Class Teacher
              </span>
            </div>
            
            <div className="w-32 h-32 rounded-full border-[3px] border-double border-gray-300 flex items-center justify-center bg-gray-50 -my-4 relative z-0" />

            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Principal / Registrar
              </span>
            </div>
          </div>

          {/* System generated stamp */}
          <div className="text-center pt-4 border-t border-gray-300">
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                System Generated • Date: {new Date().toLocaleDateString('en-IN')} • JY SCHOOL Student Database
             </span>
          </div>

        </div>
      </div>
      </div>



      {/* Change Section Modal */}
      {showSectionModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowSectionModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Class / Section</h3>
              <p className="text-xs text-gray-450 mt-1">For {student.user.name} ({student.rollNo})</p>
            </div>
            
            <form onSubmit={handleChangeSectionSubmit} className="space-y-4">
              <div>
                <label className="label">Select New Class</label>
                <select 
                  value={newClassId} 
                  onChange={(e) => setNewClassId(e.target.value)} 
                  className="input mt-1 w-full"
                  required
                >
                  <option value="">-- Select Class & Section --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section} ({c.academicYear})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowSectionModal(false)} className="flex-1 btn btn-secondary bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 btn btn-primary">{isSubmitting ? 'Updating...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Record Payment Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Tuition Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Collecting for {student.user.name}</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="label mb-2">Select Fee Components & Amount</label>
                <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/20 max-h-48 overflow-y-auto">
                  {(() => {
                    const availableStructures = feeStructures.filter((s) => s.studentId === student.id || s.classId === student.classId);
                    const allPaid = availableStructures.every(s => {
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      return Math.max(0, s.amount - paidSoFar) <= 0;
                    });

                    return (
                      <>
                        {availableStructures.map((s) => {
                          const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                          const pendingAmount = Math.max(0, s.amount - paidSoFar);
                          if (pendingAmount <= 0) return null;

                          const isSelected = selectedFees.find(f => f.feeStructureId === s.id);

                          return (
                            <div key={s.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                  checked={!!isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFees([...selectedFees, { feeStructureId: s.id, amountPaid: pendingAmount }]);
                                    } else {
                                      setSelectedFees(selectedFees.filter(f => f.feeStructureId !== s.id));
                                    }
                                  }}
                                />
                                <div>
                                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{s.name}</p>
                                  <p className="text-[10px] text-gray-500">Pending: ₹{pendingAmount}</p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={isSelected.amountPaid}
                                    onChange={(e) => {
                                      setSelectedFees(selectedFees.map(f => f.feeStructureId === s.id ? { ...f, amountPaid: Number(e.target.value) } : f));
                                    }}
                                    max={pendingAmount}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {allPaid && (
                          <p className="text-xs text-emerald-600 font-bold text-center py-2">No pending fees found for this student!</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {selectedFees.length > 0 && (
                  <div className="mt-3 flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Total Amount to Pay</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Payment Date</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  className="input text-xs" 
                  required
                />
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="input text-xs">
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>


              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Record Payment</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowEditModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Editing receipt: {editingPayment.receiptNo || 'N/A'}</p>
            </div>

            <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
              <div>
                <label className="label">Amount Paid</label>
                <input
                  type="number"
                  required
                  value={editingPayment.amountPaid}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amountPaid: Number(e.target.value) })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select 
                  value={editingPayment.method} 
                  onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value })} 
                  className="input text-xs"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>

              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={editingPayment.paymentDate || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, paymentDate: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  value={editingPayment.remarks || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, remarks: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Update Payment</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Discount Fee Modal */}
      {showDiscountModal && discountFee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowDiscountModal(false)} />
          <div className="relative card w-full max-w-sm p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Fee Amount</h3>
              <p className="text-xs text-gray-450 mt-1">Adjusting fee for {discountFee.name}</p>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div className="flex justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg text-sm mb-4">
                <span className="text-gray-500">Original Fee:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{discountFee.amount}</span>
              </div>

              <div>
                <label className="label">New Fee Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="input text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  Original fee was: <strong className="text-gray-600">₹{discountFee.amount}</strong>. 
                  (Difference: ₹{Math.abs(discountFee.amount - discountAmount)})
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowDiscountModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Save Fee</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Change Name Modal */}
      {showNameModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowNameModal(false)} />
          <div className="relative card w-full max-w-sm p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Student Name</h3>
              <p className="text-xs text-gray-450 mt-1">Change the full name of the student.</p>
            </div>

            <form onSubmit={handleChangeNameSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="input"
                  placeholder="Enter full name"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowNameModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Save Name</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden Print Component */}
      <FeeReceiptPrint payment={printPayment} />
    </div>
  );
};

export default StudentProfilePage;
// FIX: Removed duplicate import of getPhotoUrl

