import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Check, X, Eye, FileText, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

interface PendingPayment {
  id: string;
  studentId: string;
  amountPaid: number;
  method: string;
  utrNumber: string | null;
  screenshotUrl: string | null;
  status: string;
  createdAt: string;
  student: {
    rollNo: string;
    user?: { name: string };
    class?: { name: string; section: string };
  };
  feeStructure: {
    name: string;
    amount: number;
  };
}

export const PendingFeeApprovals: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/admin/pending?limit=50');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id: string, isApprove: boolean) => {
    if (!window.confirm(`Are you sure you want to ${isApprove ? 'approve' : 'reject'} this payment?`)) return;

    try {
      const status = isApprove ? 'PAID' : 'REJECTED';
      const res = await api.put(`/fees/admin/approve/${id}`, { status });
      if (res.data.success) {
        toast.success(`Payment ${status.toLowerCase()} successfully`);
        fetchPending();
      }
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} payment`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900">Pending Fee Approvals</h2>
        <p className="text-sm text-gray-500 mt-1">Review and approve fee payments submitted by students.</p>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border rounded-lg bg-gray-50/50">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No pending fee approvals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Fee Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method/UTR</th>
                  <th className="px-4 py-3 text-center">Proof</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.student?.user?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">
                        {p.student?.class ? `${p.student.class.name}-${p.student.class.section}` : ''} | {p.student?.rollNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.feeStructure?.name || 'Fee'}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ₹{p.amountPaid}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        {p.method}
                      </span>
                      {p.utrNumber && <div className="text-xs text-gray-500 mt-1">UTR: {p.utrNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.screenshotUrl ? (
                        <button 
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" 
                          onClick={() => setSelectedScreenshot(`http://66.116.252.191:19998${p.screenshotUrl}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </button>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No Image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApproval(p.id, 'APPROVED')}
                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm h-9 px-4 py-2"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(p.id, 'REJECTED')}
                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-9 px-4 py-2 text-rose-600 hover:text-rose-700"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Payment Proof Reference</h3>
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center items-center">
              <img 
                src={selectedScreenshot} 
                alt="Payment Proof" 
                className="max-w-full h-auto max-h-[70vh] object-contain rounded border shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Image+Not+Found';
                }}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <Button onClick={() => setSelectedScreenshot(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
