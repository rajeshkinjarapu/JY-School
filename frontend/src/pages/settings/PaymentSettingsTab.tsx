import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Save, UploadCloud, CreditCard, Landmark, QrCode } from 'lucide-react';
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
    <div className="bg-white border border-emerald-100/90 rounded-[24px] shadow-sm overflow-hidden">
      {/* Soft Pastel Header Strip */}
      <div className="bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-[#E6FFFA] px-6 py-5 border-b border-emerald-100/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Payment &amp; Bank Setup</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure school bank account and UPI QR Code for online &amp; mobile app fee payments
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 text-[11px] font-extrabold">
          <QrCode className="w-3.5 h-3.5" />
          <span>{upiId ? 'UPI Active' : 'Pending UPI'}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Bank Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              Account Number
            </label>
            <input
              type="text"
              placeholder="e.g. 3xxxxxx5678"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              IFSC Code
            </label>
            <input
              type="text"
              placeholder="e.g. SBIN0001234"
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              UPI ID (PhonePe / GPay / Paytm)
            </label>
            <input
              type="text"
              placeholder="e.g. schoolname@ybl"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">
              Official Fee Payment QR Code
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F8FAFF] border border-emerald-100">
              {qrCodePreview && (
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-emerald-400 bg-white p-1 shadow-sm shrink-0">
                  <img
                    src={qrCodePreview.startsWith('blob:') ? qrCodePreview : `http://66.116.252.191:19998${qrCodePreview}`}
                    alt="QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              )}
              <div className="flex-1 w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 bg-white rounded-2xl cursor-pointer hover:bg-emerald-50/40 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                    <UploadCloud className="w-7 h-7 text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">
                      <span className="text-emerald-600 font-extrabold">Click to upload QR image</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Payment Setup'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
