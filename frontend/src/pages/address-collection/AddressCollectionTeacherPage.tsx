import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { User, MapPin, Phone, CheckCircle2, Navigation, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const AddressCollectionTeacherPage: React.FC = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: '',
  });
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response: any = await api.get('/api/teachers', { params: { limit: 500 } });
        const list = extractArray(response);
        setTeachers(
          list.map((t: any) => ({
            id: t.id,
            name: t.user?.name || 'Unknown',
          }))
        );
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'referenceTeacherId' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mobileNo || !formData.mobileNo.trim()) {
      toast.error('Please enter Mobile Number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/address-collection', formData);
      toast.success('Address collected successfully!');
      setFormData({
        studentName: '',
        fatherName: '',
        village: '',
        mandal: '',
        mobileNo: '',
        alternateMobileNo: '',
        referenceTeacherId: '',
      });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Student Address Collection"
        icon={<MapPin className="w-5 h-5 text-white" />}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto pb-12">
          <div className="bg-white rounded-[22px] shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)] border border-[#DDD7F3] overflow-hidden">
            <div className="bg-gradient-to-r from-[#F2EDFF] to-[#EAF2FF] px-6 py-5 border-b border-indigo-100 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-center shadow-md shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1E1B4B]">Student Survey &amp; Address Entry</h2>
                <p className="text-xs font-medium text-slate-500">Collect student residential and contact details for reference</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Student Name <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="Enter student full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Father Name <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="Enter father's name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Village / Town <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="Village / Town"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Mandal <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="mandal"
                      value={formData.mandal}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="Mandal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="mobileNo"
                      value={formData.mobileNo}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="10 digit mobile no"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Alternate Mobile <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="alternateMobileNo"
                      value={formData.alternateMobileNo}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      placeholder="Alternate number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Reference Teacher</span>
                    <span className="text-slate-400 font-medium lowercase">(defaults to you if empty)</span>
                  </label>
                  <select
                    name="referenceTeacherId"
                    value={formData.referenceTeacherId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer transition"
                  >
                    <option value="">-- Self (Default) --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-5 border-t border-indigo-50 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-extrabold text-xs sm:text-sm bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{loading ? 'Submitting...' : 'Submit Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressCollectionTeacherPage;
