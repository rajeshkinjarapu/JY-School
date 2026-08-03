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
      const [structRes, classRes]: any = await Promise.all([
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=2000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=2000'),
      ]);
      setStructures(structRes.data || structRes || []);
      setClasses(classRes.data?.data || classRes.data || classRes || []);
    } catch (e) {
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic student search
  useEffect(() => {
    if (user?.role === 'STUDENT') return;
    
    // Prevent refetching when a student is selected and their name populates the search bar
    if (selectedStudent && searchName === selectedStudent.user.name) {
      return;
    }

    const fetchStudents = async () => {
      try {
        const params = new URLSearchParams();
        params.append('limit', '50');
        if (filterClass) {
          const selectedClass = classes.find(c => c.name === filterClass && (!filterSection || c.section === filterSection));
          if (selectedClass) params.append('classId', selectedClass.id);
          else {
            const firstMatch = classes.find(c => c.name === filterClass);
            if (firstMatch) params.append('classId', firstMatch.id);
          }
        }
        if (searchName) {
          params.append('search', searchName);
        }
        const res = await api.get(`/api/students?${params.toString()}`);
        setStudents(res.data?.data || res.data || []);
      } catch (e) {
        console.error('Failed to search students', e);
      }
    };
    const timeout = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timeout);
  }, [filterClass, filterSection, searchName, classes, user, selectedStudent]);

  const fetchStudentPayments = async (id: string) => {
    try {
      const res = await api.get(`/api/fees/payments?studentId=${id}&limit=2000`);
      setPayments(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch student payments', e);
    }
  };

  // Fetch payments for selected student
  useEffect(() => {
    if (!studentId) {
      setPayments([]);
      return;
    }
    fetchStudentPayments(studentId);
  }, [studentId]);

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
      
      // Auto refresh the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
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
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 lg:p-8 flex items-start justify-center">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/fee-payment" className="p-2.5 rounded-2xl bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm border border-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Collect Fee</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Record a new payment transaction</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Side: Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. Student Selection */}
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-200/60 relative z-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-black shadow-sm">1</div>
                  <h3 className="text-lg font-black text-slate-800">Identify Student</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Class Filter</label>
                    <select
                      value={filterClass}
                      onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }}
                      className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      <option value="">All Classes</option>
                      {uniqueClassNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Section Filter</label>
                    <select
                      value={filterSection}
                      onChange={(e) => { setFilterSection(e.target.value); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }}
                      className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      <option value="">All Sections</option>
                      {uniqueSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative z-50">
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type student name or roll number..."
                      value={searchName}
                      onFocus={() => setShowStudentDropdown(true)}
                      onChange={(e) => { setSearchName(e.target.value); setShowStudentDropdown(true); }}
                      className="w-full pl-13 pr-12 py-4 text-base border-2 border-slate-200 rounded-2xl bg-white outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 font-bold text-slate-800 transition-all shadow-sm relative z-50"
                    />
                    {searchName && (
                      <button type="button" onClick={() => { setSearchName(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); setShowStudentDropdown(true); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-500 bg-slate-100 hover:bg-pink-50 p-1.5 rounded-lg transition-all z-50 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showStudentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto animate-scale-in">
                      {filteredStudents.length === 0 ? (
                        <div className="px-6 py-10 text-sm text-slate-500 text-center flex flex-col items-center">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                            <Search className="w-6 h-6 text-slate-300" />
                          </div>
                          <p className="font-bold text-base text-slate-700">No students found</p>
                          <p className="text-xs font-medium mt-1">Try adjusting your filters or search term.</p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {filteredStudents.slice(0, 20).map(s => (
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
                              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-indigo-50 text-left transition-all group"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-indigo-200 group-hover:border-indigo-300 group-hover:shadow-sm transition-all">
                                <span className="text-base font-black text-indigo-600">{s.user.name?.[0]?.toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{s.user.name}</p>
                                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{s.rollNo} • {s.class ? `${s.class.name}-${s.class.section}` : 'No class'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedStudent && (
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm mt-4 animate-fade-in-up relative z-0">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-md text-white font-black text-lg ring-4 ring-emerald-100">
                        {selectedStudent.user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-black text-emerald-950">{selectedStudent.user.name}</p>
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">{selectedStudent.rollNo} • {selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : ''}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Fee Components */}
              {studentId && (
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-200/60 animate-fade-in-up relative z-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-sm">2</div>
                    <h3 className="text-lg font-black text-slate-800">Select Fees</h3>
                  </div>

                  <div className="bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-3 max-h-72 overflow-y-auto">
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
                              <label key={s.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-3 last:mb-0 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'bg-white border-indigo-400 shadow-md ring-4 ring-indigo-50' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'}`}>
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                  <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300'}`}>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-800">{s.name}</p>
                                    <p className="text-[11px] text-pink-600 font-black mt-1 uppercase tracking-wider bg-pink-50 inline-block px-2 py-0.5 rounded-md">Pending: ₹{pendingAmount.toLocaleString()}</p>
                                  </div>
                                </div>
                                
                                {isSelected ? (
                                  <div className="flex items-center gap-2 bg-indigo-50/80 px-4 py-2 rounded-xl border border-indigo-200 shadow-inner" onClick={(e) => e.preventDefault()}>
                                    <span className="text-sm font-black text-indigo-400">₹</span>
                                    <input
                                      type="number"
                                      className="w-24 text-base font-black text-indigo-700 bg-transparent border-0 p-0 focus:ring-0 text-right outline-none"
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
                            <div className="py-10 flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-white shadow-sm border border-emerald-100">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                              </div>
                              <p className="text-emerald-700 font-black text-xl">All Cleared!</p>
                              <p className="text-emerald-600/70 text-sm font-bold mt-1.5">This student has no pending fee dues.</p>
                            </div>
                          )}
                          {availableStructures.length === 0 && (
                            <div className="py-12 text-center">
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
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-200/60 relative z-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-black shadow-sm">3</div>
                  <h3 className="text-lg font-black text-slate-800">Transaction Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Date of Payment</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 font-bold text-slate-800 transition-all cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Payment Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 font-bold text-slate-800 transition-all cursor-pointer"
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
                  <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-6 mb-5 animate-scale-in">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-violet-100 rounded-lg"><Wallet className="w-4 h-4 text-violet-600" /></div>
                      <p className="text-xs font-black text-violet-800 uppercase tracking-widest">UPI Details</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">
                          UTR / Trans ID (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12-digit transaction number"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          className="w-full px-5 py-3.5 text-sm border-2 border-violet-200 rounded-2xl bg-white outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 font-bold text-slate-800 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Upload Receipt (Optional)</label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 cursor-pointer bg-white border-2 border-violet-200 rounded-2xl transition-all"
                        />
                        {isUploading && <span className="text-[11px] font-black text-violet-500 block mt-2 ml-1 animate-pulse">Uploading...</span>}
                        {receiptUrl && <span className="text-[11px] font-black text-emerald-600 block mt-2 ml-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Uploaded</span>}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Remarks / Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared pending balance for term 1"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button inside form for mobile visibility */}
              <div className="lg:hidden pt-4 pb-10">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedFees.length === 0}
                  className="w-full py-4 text-base font-black rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-200 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : `Confirm Payment of ₹${selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}`}
                  {!isSubmitting && <CheckCircle2 className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Sticky Summary Panel */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                
                <div className="relative z-10 flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <Wallet className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white">Payment Summary</h2>
                    <p className="text-xs font-bold text-indigo-300/80 mt-0.5 uppercase tracking-widest">Review & Confirm</p>
                  </div>
                </div>

                <div className="relative z-10">
                  {selectedFees.length > 0 ? (
                    <div className="animate-scale-in">
                      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {selectedFees.map((fee, idx) => {
                          const name = structures.find(s => s.id === fee.feeStructureId)?.name || 'Fee';
                          return (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                              <span className="text-sm font-medium text-indigo-100 truncate pr-4">{name}</span>
                              <span className="text-sm font-black text-white whitespace-nowrap">₹{fee.amountPaid.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="bg-black/20 rounded-3xl p-6 border border-white/10 shadow-inner mb-6 backdrop-blur-sm">
                        <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Total Amount</p>
                        <p className="text-4xl font-black text-white tracking-tight">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</p>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="hidden lg:flex w-full py-4 text-base font-black rounded-2xl text-slate-900 bg-white hover:bg-indigo-50 shadow-xl shadow-black/20 transform transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                        {!isSubmitting && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-white/5">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                        <FileText className="w-7 h-7 text-white/40" />
                      </div>
                      <p className="text-base font-black text-white mb-1.5">No Fees Selected</p>
                      <p className="text-xs text-indigo-200/70 font-medium leading-relaxed">Search for a student and select the fees you wish to collect.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              {studentId && payments.length > 0 && (
                <div className="mt-6 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Recent Transactions</h3>
                  </div>
                  <div className="space-y-3">
                    {payments.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-black text-slate-800">{p.feeStructure?.name || 'Fee'}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-black text-emerald-600">₹{p.amountPaid?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectPaymentPage;
