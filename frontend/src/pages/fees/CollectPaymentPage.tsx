import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Plus, Search, X, CheckCircle2, FileText, ChevronLeft, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const CollectPaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smart student selector states
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Derived unique classes and sections
  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classes.map(c => c.name))).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    classes
      .filter(c => !filterClass || c.name === filterClass)
      .forEach(c => { if (c.section) sections.add(c.section); });
    return Array.from(sections).sort();
  }, [classes, filterClass]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = !filterClass || s.class?.name === filterClass;
      const matchSection = !filterSection || s.class?.section === filterSection;
      const matchName = !searchName || 
        s.user?.name?.toLowerCase().includes(searchName.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchName.toLowerCase());
      return matchClass && matchSection && matchName;
    });
  }, [students, filterClass, filterSection, searchName]);

  const fetchData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/payments?limit=500'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=1000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=500'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=500'),
      ]);
      setPayments(payRes.data || payRes || []);
      setStudents(studRes.data?.data || studRes.data || []);
      setStructures(structRes.data || structRes || []);
      setClasses(classRes.data?.data || classRes.data || classRes || []);
    } catch (e) {
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadToast = toast.loading('Uploading payment receipt...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      setReceiptUrl(url);
      toast.success('Payment receipt uploaded successfully!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload payment receipt.', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedFees.length === 0) {
      toast.error('Please select at least one fee component to pay.');
      return;
    }
    const isAdminOrSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (method === 'UPI' && !utrNumber && !isAdminOrSuperAdmin) {
      toast.error('UTR Reference Number is required for UPI payments.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/fees/payments', {
        studentId,
        payments: selectedFees,
        method,
        remarks,
        utrNumber: method === 'UPI' ? utrNumber : null,
        receiptUrl: method === 'UPI' ? receiptUrl : null,
        paymentDate,
      });
      toast.success('Payment transaction recorded!');
      // Navigate back to fees listing after successful payment
      navigate('/fee-payment');
    } catch (error: any) {
      toast.error(error.message || 'Error recording payment');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/fee-payment" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Collect Payment</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Process new fee payments quickly and securely.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        
        {/* Left Side: Summary & Brand Panel */}
        <div className="lg:w-[400px] flex-shrink-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 lg:p-10 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-6 shadow-xl">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-2">Payment<br/>Summary</h2>
            <p className="text-indigo-100 text-sm leading-relaxed">Review the selected fee components and student details before confirming the transaction.</p>
          </div>

          <div className="relative z-10 mt-10">
            {selectedFees.length > 0 ? (
              <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-2xl animate-scale-in">
                <p className="text-xs font-extrabold text-indigo-200 uppercase tracking-widest mb-1">Total Amount Due</p>
                <p className="text-5xl font-black text-white">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</p>
                
                {selectedStudent && (
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/20">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-lg font-black text-indigo-600">{selectedStudent.user.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{selectedStudent.user.name}</p>
                      <p className="text-xs text-indigo-200 font-medium">{selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-white/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-white/5 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-sm font-bold text-white mb-1">No Student Selected</p>
                <p className="text-xs text-indigo-200">Search for a student and select fees to see the summary here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 bg-white p-6 lg:p-10 lg:pl-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Student Selection */}
            <div className="space-y-4 relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-black text-xs">1</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Identify Student</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Class Filter</label>
                  <select
                    value={filterClass}
                    onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-semibold text-slate-800 transition-all"
                  >
                    <option value="">All Classes</option>
                    {uniqueClassNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Section Filter</label>
                  <select
                    value={filterSection}
                    onChange={(e) => { setFilterSection(e.target.value); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-semibold text-slate-800 transition-all"
                  >
                    <option value="">All Sections</option>
                    {uniqueSections.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative mt-2 z-50">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type student name or roll number..."
                    value={searchName}
                    onFocus={() => setShowStudentDropdown(true)}
                    onChange={(e) => { setSearchName(e.target.value); setShowStudentDropdown(true); }}
                    className="w-full pl-11 pr-10 py-3.5 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 font-semibold text-slate-800 transition-all relative z-50"
                  />
                  {searchName && (
                    <button type="button" onClick={() => { setSearchName(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 transition-colors z-50">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown results (always shows if focused, fixes the bug where users thought it didn't load) */}
                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-scale-in">
                    {filteredStudents.length === 0 ? (
                      <div className="px-6 py-8 text-sm text-slate-500 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <Search className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="font-bold">No students found</p>
                        <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
                      </div>
                    ) : (
                      filteredStudents.slice(0, 20).map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentId(s.id);
                            setSearchName(s.user.name);
                            setSelectedFees([]);
                            setShowStudentDropdown(false);
                          }}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-indigo-50/50 text-left transition-colors border-b border-slate-50 last:border-0 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-indigo-200 group-hover:border-indigo-300 transition-colors">
                            <span className="text-sm font-black text-indigo-600">{s.user.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{s.user.name}</p>
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{s.rollNo} • {s.class ? `${s.class.name}-${s.class.section}` : 'No class'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected student badge */}
              {selectedStudent && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm mt-2 animate-fade-in-up relative z-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md text-white font-black">
                      {selectedStudent.user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">{selectedStudent.user.name}</p>
                      <p className="text-[11px] font-bold text-emerald-600">{selectedStudent.rollNo} • {selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : ''}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              )}
            </div>

            {/* 2. Fee Components */}
            {studentId && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in-up relative z-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">2</div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Select Fees to Pay</h3>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-64 overflow-y-auto shadow-inner">
                  {(() => {
                    const availableStructures = structures.filter((s) => s.studentId === studentId || s.classId === students.find((st) => st.id === studentId)?.classId);
                    const allPaid = availableStructures.every(s => {
                      const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                      return Math.max(0, s.amount - paidSoFar) <= 0;
                    });

                    return (
                      <>
                        {availableStructures.map((s) => {
                          const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                          const pendingAmount = Math.max(0, s.amount - paidSoFar);
                          if (pendingAmount <= 0) return null;
                          const isSelected = selectedFees.find(f => f.feeStructureId === s.id);
                          
                          return (
                            <label key={s.id} className={`flex items-center justify-between p-4 mb-2 last:mb-0 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300'}`}>
                                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                  <p className="text-xs text-pink-600 font-extrabold mt-0.5">Pending: ₹{pendingAmount.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              {isSelected ? (
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100" onClick={(e) => e.preventDefault()}>
                                  <span className="text-sm font-black text-indigo-400">₹</span>
                                  <input
                                    type="number"
                                    className="w-24 text-sm font-black text-indigo-700 bg-transparent border-0 p-0 focus:ring-0 text-right outline-none"
                                    value={isSelected.amountPaid}
                                    onChange={(e) => {
                                      setSelectedFees(selectedFees.map(f => f.feeStructureId === s.id ? { ...f, amountPaid: Number(e.target.value) } : f));
                                    }}
                                    max={pendingAmount}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={!!isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFees([...selectedFees, { feeStructureId: s.id, amountPaid: pendingAmount }]);
                                    } else {
                                      setSelectedFees(selectedFees.filter(f => f.feeStructureId !== s.id));
                                    }
                                  }}
                                />
                              )}
                            </label>
                          );
                        })}
                        {allPaid && (
                          <div className="py-8 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-emerald-700 font-black text-lg">All Cleared!</p>
                            <p className="text-emerald-600/70 text-sm font-semibold mt-1">This student has no pending fee dues.</p>
                          </div>
                        )}
                        {availableStructures.length === 0 && (
                          <div className="py-8 text-center">
                            <p className="text-slate-500 font-bold">No fee structures assigned to this student or class.</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 3. Payment Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100 relative z-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-black text-xs">3</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Date of Payment</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-semibold text-slate-800 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-semibold text-slate-800 transition-all"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online Transfer</option>
                    <option value="BANK_TRANSFER">Bank Deposit</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI / QR Code</option>
                  </select>
                </div>
              </div>

              {/* UPI fields */}
              {method === 'UPI' && (
                <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-5 space-y-4 animate-scale-in">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-violet-500" />
                    <p className="text-xs font-black text-violet-600 uppercase tracking-widest">UPI Reference</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                        UTR / Trans ID
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')
                          ? <span className="ml-2 text-emerald-500 normal-case tracking-normal font-semibold">(Optional for Admin)</span>
                          : <span className="ml-1 text-red-500">*</span>
                        }
                      </label>
                      <input
                        type="text"
                        required={!(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')}
                        placeholder="e.g. 12-digit transaction number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-violet-200 rounded-xl bg-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 font-semibold text-slate-800 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Upload Receipt (Optional)</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 cursor-pointer bg-white border border-violet-200 rounded-xl"
                      />
                      {isUploading && <span className="text-[10px] font-bold text-violet-500 block mt-2 animate-pulse">Uploading...</span>}
                      {receiptUrl && <span className="text-[10px] font-bold text-emerald-600 block mt-2">✓ Uploaded Successfully</span>}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared pending balance for term 1"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-100 relative z-0">
              <button
                type="submit"
                disabled={isSubmitting || selectedFees.length === 0}
                className="w-full py-4 text-base font-black rounded-xl text-white bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 shadow-[0_10px_30px_rgba(139,92,246,0.3)] transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? 'Processing Payment...' : `Complete Payment of ₹${selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}`}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CollectPaymentPage;
