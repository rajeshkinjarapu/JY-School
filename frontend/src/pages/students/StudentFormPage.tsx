import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, UserPlus, User, Users, ShieldCheck, MapPin, Camera, Loader2 } from 'lucide-react';
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

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

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
      const student = res.data?.data || res.data;
      setPhotoUrl(student?.user?.photoUrl || student?.photoUrl || '');
      reset({
        name: student?.user?.name || student?.name || '',
        studentId: student.rollNo,
        phone: student?.user?.phone || student?.phone || '',
        classId: student.classId || '',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        address: student.address || '',
        bloodGroup: student.bloodGroup || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        fatherAadhar: student.fatherAadhar || '',
        motherAadhar: student.motherAadhar || '',
        fatherPhone: student.fatherPhone || '',
        motherPhone: student.motherPhone || '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        guardianRelation: student.guardianRelation || '',
        aadharNo: student.aadharNo || '',
        penNumber: student.penNumber || '',
        childId: student.childId || '',
        apaarId: student.apaarId || '',
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
      navigate(id ? `/students/${id}` : '/students');
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error saving student profile');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F4F7FC] items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading student details...</p>
      </div>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFF] hover:bg-white focus:bg-white border border-indigo-100/90 rounded-xl text-slate-800 placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all';
  const labelClass = 'block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1';

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] overflow-hidden">
      <PageHeader
        title={id ? 'Edit Student Profile' : 'Register New Student'}
        icon={<UserPlus className="w-5 h-5 text-white" />}
        action={
          <Link
            to={id ? `/students/${id}` : '/students'}
            className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Students</span>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* ══ LEFT COLUMN (5 cols): Photo + Personal Info + Govt/UDISE+ IDs ══ */}
            <div className="lg:col-span-5 space-y-5">

              {/* Card 1: Profile Photo & Personal Details */}
              <div className="bg-white rounded-[22px] overflow-hidden border border-indigo-100/90 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.10)]">
                <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-5 py-3 border-b border-indigo-100/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                    Student Identity & Personal Info
                  </h3>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Compact Photo Upload Strip */}
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-gradient-to-r from-[#F5F7FF] to-[#FAF5FF] border border-indigo-100/80">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#EC4899] shadow-md">
                        {photoUrl ? (
                          <img src={getPhotoUrl(photoUrl)} alt="Preview" className="w-full h-full rounded-[14px] object-cover border-2 border-white bg-white" />
                        ) : (
                          <div className="w-full h-full rounded-[14px] border-2 border-white bg-white flex items-center justify-center text-indigo-300 text-[10px] font-black uppercase text-center leading-tight">
                            No<br />Photo
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-1.5 -right-1.5 p-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} className="hidden" />
                        <Camera className="w-3.5 h-3.5" />
                      </label>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#1E1B4B]">Student Passport Photo</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">JPG, PNG, WEBP up to 2MB</p>
                      {isUploading && <p className="text-[11px] font-bold text-indigo-600 mt-1 animate-pulse">Uploading photo...</p>}
                    </div>
                  </div>

                  {/* Personal Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
                      <input type="text" required placeholder="Enter student full name" className={inputClass} {...register('name')} />
                    </div>
                    <div>
                      <label className={labelClass}>Student ID</label>
                      <input type="text" placeholder="Auto-generate if blank" className={inputClass} {...register('studentId')} />
                    </div>
                    <div>
                      <label className={labelClass}>Assign Class</label>
                      <select className={inputClass} {...register('classId')}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Date of Birth</label>
                      <input type="date" className={inputClass} {...register('dob')} />
                    </div>
                    <div>
                      <label className={labelClass}>Gender</label>
                      <select className={inputClass} {...register('gender')}>
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Blood Group</label>
                      <input type="text" placeholder="e.g. O+, A-" className={inputClass} {...register('bloodGroup')} />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Phone</label>
                      <input type="text" placeholder="Primary mobile number" className={inputClass} {...register('phone')} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Government & UDISE+ Identifiers */}
              <div className="bg-white rounded-[22px] overflow-hidden border border-emerald-100/90 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.09)]">
                <div className="bg-gradient-to-r from-[#ECFDF5] via-[#E5FAEF] to-[#E6FAFC] px-5 py-3 border-b border-emerald-100/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] text-white flex items-center justify-center shadow-xs shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                    Govt &amp; UDISE+ Identifiers
                  </h3>
                </div>

                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Student Aadhar Number</label>
                    <input type="text" maxLength={12} placeholder="12-digit Aadhar" className={inputClass} {...register('aadharNo')} />
                  </div>
                  <div>
                    <label className={labelClass}>PEN Number</label>
                    <input type="text" placeholder="UDISE+ PEN" className={inputClass} {...register('penNumber')} />
                  </div>
                  <div>
                    <label className={labelClass}>Child ID</label>
                    <input type="text" placeholder="State Registry ID" className={inputClass} {...register('childId')} />
                  </div>
                  <div>
                    <label className={labelClass}>APAAR ID</label>
                    <input type="text" placeholder="12-digit APAAR ID" className={inputClass} {...register('apaarId')} />
                  </div>
                </div>
              </div>
            </div>

            {/* ══ RIGHT COLUMN (7 cols): Parents & Guardian Info + Address & Submit ══ */}
            <div className="lg:col-span-7 space-y-5">

              {/* Card 3: Parents & Guardian Details */}
              <div className="bg-white rounded-[22px] overflow-hidden border border-purple-100/90 shadow-[0_8px_24px_-6px_rgba(91,33,182,0.10)]">
                <div className="bg-gradient-to-r from-[#F2EDFF] via-[#FFEBF3] to-[#FFF6E5] px-5 py-3 border-b border-purple-100/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                    Parents &amp; Guardian Details
                  </h3>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className={labelClass}>Father&apos;s Name</label>
                      <input type="text" placeholder="Father's full name" className={inputClass} {...register('fatherName')} />
                    </div>
                    <div>
                      <label className={labelClass}>Mother&apos;s Name</label>
                      <input type="text" placeholder="Mother's full name" className={inputClass} {...register('motherName')} />
                    </div>
                    <div>
                      <label className={labelClass}>Father&apos;s Phone Number</label>
                      <input type="tel" maxLength={10} placeholder="10-digit Father Phone" className={inputClass} {...register('fatherPhone')} />
                    </div>
                    <div>
                      <label className={labelClass}>Mother&apos;s Phone Number</label>
                      <input type="tel" maxLength={10} placeholder="10-digit Mother Phone" className={inputClass} {...register('motherPhone')} />
                    </div>
                    <div>
                      <label className={labelClass}>Father&apos;s Aadhar Number</label>
                      <input type="text" maxLength={12} placeholder="12-digit Father Aadhar" className={inputClass} {...register('fatherAadhar')} />
                    </div>
                    <div>
                      <label className={labelClass}>Mother&apos;s Aadhar Number</label>
                      <input type="text" maxLength={12} placeholder="12-digit Mother Aadhar" className={inputClass} {...register('motherAadhar')} />
                    </div>
                  </div>

                  {/* Guardian Sub-Section */}
                  <div className="pt-3 border-t border-indigo-100/80">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-2.5">
                      Guardian Info (Optional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className={labelClass}>Guardian Name</label>
                        <input type="text" placeholder="Guardian's name" className={inputClass} {...register('guardianName')} />
                      </div>
                      <div>
                        <label className={labelClass}>Guardian Relation</label>
                        <input type="text" placeholder="e.g. Uncle, Grandfather" className={inputClass} {...register('guardianRelation')} />
                      </div>
                      <div>
                        <label className={labelClass}>Guardian Phone</label>
                        <input type="tel" maxLength={10} placeholder="10-digit Phone" className={inputClass} {...register('guardianPhone')} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Residential Address & Save Bar */}
              <div className="bg-white rounded-[22px] overflow-hidden border border-amber-100/90 shadow-[0_8px_24px_-6px_rgba(245,158,11,0.09)]">
                <div className="bg-gradient-to-r from-[#FFF6E5] via-[#FFFBEB] to-[#E6F4FF] px-5 py-3 border-b border-amber-100/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center shadow-xs shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Residential Address &amp; Finalize
                  </h3>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Home Address</label>
                    <textarea
                      rows={3}
                      placeholder="Full residential address (Door No, Street, Village / Town, PIN)"
                      className={`${inputClass} resize-none`}
                      {...register('address')}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-indigo-100/70">
                    <p className="text-[11px] font-semibold text-slate-500">
                      {id ? 'Update student records and save changes.' : 'Default login password will be set automatically.'}
                    </p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <Link
                        to={id ? `/students/${id}` : '/students'}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] hover:opacity-95 disabled:opacity-60 text-white font-black text-xs sm:text-sm rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.28)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="uppercase tracking-wider">
                          {isSubmitting ? 'Saving...' : (id ? 'Save Profile' : 'Register Student')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormPage;

