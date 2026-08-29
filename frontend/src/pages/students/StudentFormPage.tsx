import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { PageHeader } from '../../components/UI/PageHeader';

export const StudentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchClassesAndParents = async () => {
    try {
      const classRes: any = await api.get('/api/classes');
      setClasses(classRes.data || classRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/students/${id}`);
      const student = res.data;
      setPhotoUrl(student.user.photoUrl || '');
      reset({
        name: student.user.name,
        studentId: student.rollNo,
        phone: student.user.phone || '',
        classId: student.classId || '',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        address: student.address || '',
        bloodGroup: student.bloodGroup || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        aadharNo: student.aadharNo || '',
        penNumber: student.penNumber || '',
      });
    } catch (e) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndParents();
    fetchStudentData();
  }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading student photo...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(res.data.url);
      toast.success('Photo uploaded successfully!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, photoUrl, ...(id ? {} : { password: 'Student@123' }) };
      if (id) {
        await api.put(`/api/students/${id}`, payload);
        toast.success('Student profile updated successfully!');
      } else {
        await api.post('/api/students', payload);
        toast.success('New student added successfully!');
      }
      navigate('/students');
    } catch (error: any) {
      toast.error(error.message || 'Error saving student profile');
    }
  };

  if (loading) return <div className="text-center py-12">Loading details...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={id ? 'Edit Student Profile' : 'Register New Student'}
        icon={
          <Link to="/students">
            <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-indigo-600 cursor-pointer" />
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
          
          {/* Card 1: Profile Picture */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-100/20 dark:shadow-none p-6 sm:p-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Profile Picture</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-lg">
                  {photoUrl ? (
                    <img src={getPhotoUrl(photoUrl)} alt="Preview" className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-900" />
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-white dark:border-gray-900 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-[10px] font-black uppercase text-center leading-tight">
                      No<br/>Photo
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 cursor-pointer hover:bg-indigo-700 hover:scale-110 transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} className="hidden" />
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Upload a professional photo</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Supported formats: JPG, PNG, WEBP. Max size: 2MB.</p>
                {isUploading && <p className="text-xs font-bold text-indigo-500 animate-pulse">Uploading...</p>}
              </div>
            </div>
          </div>

          {/* Card 2: Personal Details */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-100/20 dark:shadow-none p-6 sm:p-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Full Name <span className="text-red-500">*</span></label>
                <input type="text" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" {...register('name')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Student ID</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="Leave blank to auto-generate" {...register('studentId')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Assign Class</label>
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" {...register('classId')}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Date of Birth</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" {...register('dob')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Gender</label>
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" {...register('gender')}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Additional Details */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-100/20 dark:shadow-none p-6 sm:p-8">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Guardian & Additional Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Father's Name</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="Father's full name" {...register('fatherName')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Mother's Name</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="Mother's full name" {...register('motherName')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Contact Phone</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="Phone number" {...register('phone')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Aadhar Number</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="12-digit Aadhar" {...register('aadharNo')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Blood Group</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="e.g. O+, A-" {...register('bloodGroup')} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">PEN Number</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold" placeholder="Permanent Education Number" {...register('penNumber')} />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">Home Address</label>
                <textarea className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-semibold resize-none" rows={3} placeholder="Full residential address" {...register('address')}></textarea>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 hover:-translate-y-1">
            <Save className="w-6 h-6" />
            <span className="uppercase tracking-widest">{id ? 'Save Profile' : 'Register Student'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentFormPage;

