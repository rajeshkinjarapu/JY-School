import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Calculator, 
  Building2, 
  CalendarDays, 
  User, 
  CreditCard,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Mock data for staff selection
const MOCK_STAFF = [
  { id: '1', name: 'Ramesh Kumar', role: 'Teacher', department: 'Science', baseSalary: 25000, bankAccount: 'XXXX-XXXX-1234', uan: '100XXXXXXXX' },
  { id: '2', name: 'Sujatha Reddy', role: 'Teacher', department: 'Maths', baseSalary: 28000, bankAccount: 'XXXX-XXXX-5678', uan: '100XXXXXXXX' },
  { id: '3', name: 'Venkatesh Rao', role: 'Driver', department: 'Transport', baseSalary: 15000, bankAccount: 'XXXX-XXXX-9012', uan: '100XXXXXXXX' },
];

export default function PayslipPage() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Earnings state
  const [basicPay, setBasicPay] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);

  // Deductions state
  const [pf, setPf] = useState<number>(0);
  const [esi, setEsi] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [unpaidLeaves, setUnpaidLeaves] = useState<number>(0);

  const selectedStaff = MOCK_STAFF.find(s => s.id === selectedStaffId);

  // Auto-fill basic pay when staff is selected
  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStaffId(id);
    const staff = MOCK_STAFF.find(s => s.id === id);
    if (staff) {
      setBasicPay(staff.baseSalary);
      setHra(Math.round(staff.baseSalary * 0.4)); // Example: 40% HRA
      setPf(Math.round(staff.baseSalary * 0.12)); // Example: 12% PF
    } else {
      setBasicPay(0);
      setHra(0);
      setPf(0);
    }
  };

  const totalEarnings = basicPay + hra + allowances + bonus;
  const totalDeductions = pf + esi + tax + unpaidLeaves;
  const netPayable = totalEarnings - totalDeductions;

  const handlePrint = () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member first');
      return;
    }
    
    // In a real app, we might use react-to-print or window.print()
    // For this mockup, we'll trigger browser print and use CSS media queries to only print the slip
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">
      
      {/* Header - Hidden when printing */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/office-tools')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-indigo-600" />
                Staff Payslip Generator
              </h1>
              <p className="text-sm text-gray-500">Generate, preview and print monthly salary slips</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={!selectedStaff}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Payslip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selection Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Employee Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff</label>
                <select 
                  value={selectedStaffId}
                  onChange={handleStaffChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">-- Choose Employee --</option>
                  {MOCK_STAFF.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.role})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Month</label>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h2 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Earnings
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-1">Basic Pay (₹)</label>
                  <input type="number" value={basicPay} onChange={e => setBasicPay(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-1">HRA (₹)</label>
                  <input type="number" value={hra} onChange={e => setHra(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-1">Allowances (₹)</label>
                  <input type="number" value={allowances} onChange={e => setAllowances(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-1">Bonus (₹)</label>
                  <input type="number" value={bonus} onChange={e => setBonus(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Deductions Card */}
          <div className="bg-rose-50 rounded-2xl shadow-sm border border-rose-100 p-6">
            <h2 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-rose-600" />
              Deductions
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-rose-800 mb-1">PF (₹)</label>
                  <input type="number" value={pf} onChange={e => setPf(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-rose-800 mb-1">ESI (₹)</label>
                  <input type="number" value={esi} onChange={e => setEsi(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-rose-800 mb-1">Tax/TDS (₹)</label>
                  <input type="number" value={tax} onChange={e => setTax(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-rose-800 mb-1">Unpaid Leaves (₹)</label>
                  <input type="number" value={unpaidLeaves} onChange={e => setUnpaidLeaves(Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Preview & Printable Area */}
        <div className="lg:col-span-7">
          
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Live Preview</h2>
            {selectedStaff && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Net Pay: {formatCurrency(netPayable)}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 min-h-[600px] print:shadow-none print:border-none print:p-0" id="printable-payslip">
            
            {/* The actual printable slip */}
            {selectedStaff ? (
              <div className="payslip-content">
                
                {/* Company Header */}
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                  <div className="flex justify-center items-center gap-3 mb-2">
                    <Building2 className="w-8 h-8 text-indigo-800" />
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">JY School</h1>
                  </div>
                  <p className="text-gray-600 text-sm">123 Education Hub, Knowledge City, AP - 500001</p>
                  <p className="text-gray-600 text-sm">Email: hr@jyschool.edu | Phone: +91 9876543210</p>
                  <h2 className="text-xl font-bold text-gray-800 mt-4 uppercase tracking-widest border border-gray-300 inline-block px-6 py-1 bg-gray-50 rounded">
                    Payslip for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                {/* Employee Details Box */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 text-sm">
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">Employee Name:</span>
                    <span className="font-bold text-gray-900 uppercase">{selectedStaff.name}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">Employee ID:</span>
                    <span className="font-bold text-gray-900">EMP-2026{selectedStaff.id.padStart(3, '0')}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">Designation:</span>
                    <span className="font-medium text-gray-900">{selectedStaff.role}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">Department:</span>
                    <span className="font-medium text-gray-900">{selectedStaff.department}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">Bank A/C No:</span>
                    <span className="font-medium text-gray-900">{selectedStaff.bankAccount}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-1">
                    <span className="w-32 font-semibold text-gray-600">UAN No:</span>
                    <span className="font-medium text-gray-900">{selectedStaff.uan}</span>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <div className="grid grid-cols-2 border border-gray-800 mb-8 rounded overflow-hidden">
                  
                  {/* Earnings Column */}
                  <div className="border-r border-gray-800">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-800 font-bold text-gray-900 flex justify-between">
                      <span>Earnings</span>
                      <span>Amount</span>
                    </div>
                    <div className="px-4 py-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-700">Basic Pay</span><span className="font-medium text-gray-900">{formatCurrency(basicPay)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-700">House Rent Allowance</span><span className="font-medium text-gray-900">{formatCurrency(hra)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-700">Other Allowances</span><span className="font-medium text-gray-900">{formatCurrency(allowances)}</span></div>
                      {bonus > 0 && <div className="flex justify-between"><span className="text-gray-700">Bonus/Arrears</span><span className="font-medium text-gray-900">{formatCurrency(bonus)}</span></div>}
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div>
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-800 font-bold text-gray-900 flex justify-between">
                      <span>Deductions</span>
                      <span>Amount</span>
                    </div>
                    <div className="px-4 py-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-700">Provident Fund (PF)</span><span className="font-medium text-gray-900">{formatCurrency(pf)}</span></div>
                      {esi > 0 && <div className="flex justify-between"><span className="text-gray-700">ESI</span><span className="font-medium text-gray-900">{formatCurrency(esi)}</span></div>}
                      {tax > 0 && <div className="flex justify-between"><span className="text-gray-700">Tax / TDS</span><span className="font-medium text-gray-900">{formatCurrency(tax)}</span></div>}
                      {unpaidLeaves > 0 && <div className="flex justify-between"><span className="text-gray-700">Unpaid Leaves</span><span className="font-medium text-gray-900">{formatCurrency(unpaidLeaves)}</span></div>}
                    </div>
                  </div>

                  {/* Totals Row */}
                  <div className="col-span-2 grid grid-cols-2 border-t border-gray-800 bg-gray-50 text-sm font-bold">
                    <div className="px-4 py-3 flex justify-between border-r border-gray-800">
                      <span>Total Earnings</span>
                      <span className="text-emerald-700">{formatCurrency(totalEarnings)}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between">
                      <span>Total Deductions</span>
                      <span className="text-rose-700">{formatCurrency(totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Highlight Box */}
                <div className="bg-gray-900 text-white rounded-xl p-6 mb-16 shadow-md flex justify-between items-center print:bg-gray-100 print:text-black print:border print:border-gray-800 print:shadow-none">
                  <div>
                    <h3 className="text-lg text-gray-300 font-medium print:text-gray-700">Net Payable Salary</h3>
                    <p className="text-sm text-gray-400 mt-1 print:text-gray-500">Amount transferred to bank account</p>
                  </div>
                  <div className="text-4xl font-black tracking-tight">{formatCurrency(netPayable)}</div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end px-8 mt-24">
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-48 mb-2"></div>
                    <span className="text-sm font-semibold text-gray-600">Employee Signature</span>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-gray-400 w-48 mb-2"></div>
                    <span className="text-sm font-semibold text-gray-600">Authorized Signatory</span>
                  </div>
                </div>
                
                <div className="mt-12 text-center text-xs text-gray-400 print:block hidden">
                  This is a computer-generated document. No signature is required.
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-lg font-medium text-gray-500">Select an employee to preview payslip</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Print styles block to hide everything except the payslip when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
        }
      `}} />

    </div>
  );
}
