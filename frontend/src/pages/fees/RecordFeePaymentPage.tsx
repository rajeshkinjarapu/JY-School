import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { compressImage } from '../../utils/imageCompressor';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Calendar, FileText, Upload, CheckCircle2 } from 'lucide-react';

export const RecordFeePaymentPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [student, setStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, structRes]: any = await Promise.all([
          api.get(`/api/students/${id}`),
          api.get(`/api/fees/structures`),
        ]);
        setStudent(studentRes?.data?.data || studentRes?.data || studentRes);
        setFeeStructures(structRes?.data?.data || structRes?.data || structRes || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const uploadToast = toast.loading('Uploading receipt...');
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

      await api.post('/api/fees/payments', payload);
      toast.success('Payment recorded successfully!');
      navigate(`/students/${id}`); // Return to student profile
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error recording payment');
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!student) return <div className="text-center py-12">Student not found.</div>;

  const availableStructures = feeStructures.filter((s) => s.studentId === student.id || s.classId === student.classId);
  const allPaid = availableStructures.every(s => {
    const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
    return Math.max(0, s.amount - paidSoFar) <= 0;
  });

  const totalAmountToPay = selectedFees.reduce((sum, f) => sum + f.amountPaid, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Record Fee Payment"
        icon={<ArrowLeft className="w-6 h-6 cursor-pointer" onClick={() => navigate(-1)} />}
        action={
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            For: {student.user.name}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

        <div className="xl:col-span-2 space-y-6">
          <form id="payment-form" onSubmit={handlePaymentSubmit} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Fee Selection Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  Select Fee Components
                </h3>
                
                <div className="space-y-3">
                  {allPaid ? (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-emerald-700 font-bold">No pending fees found for this student!</p>
                    </div>
                  ) : (
                    availableStructures.map((s) => {
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      const pendingAmount = Math.max(0, s.amount - paidSoFar);
                      if (pendingAmount <= 0) return null;

                      const isSelected = selectedFees.find(f => f.feeStructureId === s.id);

                      return (
                        <div key={s.id} className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div className="flex items-center justify-between gap-4">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 text-indigo-600 rounded-lg border-2 border-gray-300 focus:ring-indigo-500 transition-all cursor-pointer"
                                  checked={!!isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFees([...selectedFees, { feeStructureId: s.id, amountPaid: pendingAmount }]);
                                    } else {
                                      setSelectedFees(selectedFees.filter(f => f.feeStructureId !== s.id));
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{s.name}</p>
                                <p className="text-xs font-semibold text-rose-500">Pending: ₹{pendingAmount.toLocaleString()}</p>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-indigo-200 shadow-inner">
                                <span className="text-gray-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  className="w-24 text-right font-bold text-indigo-700 outline-none bg-transparent"
                                  value={isSelected.amountPaid}
                                  onChange={(e) => {
                                    setSelectedFees(selectedFees.map(f => f.feeStructureId === s.id ? { ...f, amountPaid: Number(e.target.value) } : f));
                                  }}
                                  max={pendingAmount}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Payment Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Payment Date
                  </label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" /> Payment Method
                  </label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online Transfer</option>
                    <option value="BANK_TRANSFER">Bank Deposit</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI / QR Code</option>
                  </select>
                </div>
              </div>


              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium resize-none h-24"
                  placeholder="Add any internal notes here..."
                />
              </div>

            </div>
          </form>
        </div>

        {/* Summary Card Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20 sticky top-6 border border-white/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-900/20 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 drop-shadow-md">
                Payment Summary
              </h3>
              
              <div className="space-y-4 mb-8 bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                {selectedFees.length === 0 ? (
                  <p className="text-indigo-100 text-sm font-semibold text-center py-2">No fees selected yet.</p>
                ) : (
                  selectedFees.map((f, idx) => {
                    const name = feeStructures.find(s => s.id === f.feeStructureId)?.name;
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-white/10 pb-2 last:border-0 last:pb-0">
                        <span className="text-indigo-50 font-bold">{name}</span>
                        <span className="font-black">₹{f.amountPaid.toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 mb-8">
                <div className="flex flex-col items-center justify-center bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-md shadow-inner">
                  <span className="text-indigo-100 font-extrabold uppercase tracking-widest text-[10px] mb-1">Total Amount</span>
                  <span className="text-5xl font-black text-white tracking-tight drop-shadow-lg">₹{totalAmountToPay.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                form="payment-form"
                disabled={isSubmitting || selectedFees.length === 0}
                className="w-full py-4 bg-white hover:bg-gray-50 text-indigo-700 rounded-xl font-black text-lg shadow-xl shadow-black/10 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Payment'}
              </button>
              <p className="text-center text-xs font-semibold text-indigo-100 mt-4 opacity-80">
                Upon success, you will be redirected to the student's profile.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
