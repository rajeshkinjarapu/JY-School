import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { api } from '../../services/api';
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
      toast.error(`Failed to ${isApprove ? 'approve' : 'reject'} payment`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Fee Approvals</CardTitle>
          <CardDescription>Verify and approve fee payments submitted by students via the app</CardDescription>
        </CardHeader>
        <CardContent>
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => setSelectedScreenshot(`http://66.116.252.191:19998${p.screenshotUrl}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No Image</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                          onClick={() => handleApprove(p.id, true)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                          onClick={() => handleApprove(p.id, false)}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg">Payment Proof Screenshot</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedScreenshot(null)}>
                <X className="w-5 h-5" />
              </Button>
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
