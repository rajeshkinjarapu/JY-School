import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, UploadCloud, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export const PaymentSettingsTab: React.FC = () => {
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/api/settings');
      const settings = res.data;
      if (settings) {
        setBankName(settings.bankName || '');
        setBankAccountNumber(settings.bankAccountNumber || '');
        setBankIfsc(settings.bankIfsc || '');
        setUpiId(settings.upiId || '');
        if (settings.qrCodeUrl) {
          setQrCodePreview(settings.qrCodeUrl);
        }
      }
    } catch (e) {
      toast.error('Failed to load payment settings');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrCodeFile(file);
      setQrCodePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('bankName', bankName);
      formData.append('bankAccountNumber', bankAccountNumber);
      formData.append('bankIfsc', bankIfsc);
      formData.append('upiId', upiId);
      if (qrCodeFile) {
        formData.append('qrCode', qrCodeFile);
      }

      await api.put('/api/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Payment settings saved successfully!');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Error updating payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-800 rounded-3xl p-8 shadow-xl max-w-3xl mx-auto transform transition-all duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400">Payment & Bank Setup</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure school bank details and UPI QR Code for mobile app payments.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Bank Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Account Number</label>
            <input
              type="text"
              placeholder="e.g. 3xxxxxx5678"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">IFSC Code</label>
            <input
              type="text"
              placeholder="e.g. SBIN0001234"
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">UPI ID (PhonePe / GPay)</label>
            <input
              type="text"
              placeholder="e.g. schoolname@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Upload UPI QR Code</label>
            <div className="flex items-center gap-6">
              {qrCodePreview && (
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md flex-shrink-0">
                  <img src={qrCodePreview.startsWith('blob:') ? qrCodePreview : `http://66.116.252.191:19998${qrCodePreview}`} alt="QR Code" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {isSaving ? <span className="animate-spin text-xl">⏳</span> : <Save className="w-5 h-5" />}
            {isSaving ? 'Saving...' : 'Save Payment Setup'}
          </button>
        </div>
      </form>
    </div>
  );
};
