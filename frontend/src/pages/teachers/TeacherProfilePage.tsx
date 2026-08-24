import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { ArrowLeft, BookOpen, GraduationCap, School, Camera, Printer, Phone, Mail, MapPin, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { useAuth } from '../../hooks/useAuth';

export const TeacherProfilePage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrSuper = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const { id } = useParams();
  const outletContext = useOutletContext<any>();
  const setDynamicTitle = outletContext?.setDynamicTitle;
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchTeacherProfile = async () => {
    try {
      const [profileRes, classesRes]: any = await Promise.all([
        api.get(`/api/teachers/${id}`),
        api.get(`/api/teachers/${id}/assigned-classes`),
      ]);
      setTeacher(profileRes.data);
      setAssignedClasses(classesRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handler (mirrors student profile logic)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');
      // Save URL to teacher record
      await api.put(`/api/teachers/${teacher.id}`, {
        photoUrl: uploadedUrl,
        // keep other fields unchanged (backend merges)
      });
      toast.success('Photo updated successfully!', { id: loadingToast });
      fetchTeacherProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    fetchTeacherProfile();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!teacher) return <div className="text-center py-12">Teacher profile not found.</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 w-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Teacher Profile"
        icon={<Link to="/teachers"><ArrowLeft className="w-6 h-6 text-gray-400 hover:text-indigo-600 cursor-pointer" /></Link>}
        action={
          <div className="flex gap-2 w-full sm:w-auto">
            {isAdminOrSuper && (
              <Link to={`/teachers/${id}/edit`} className="inline-flex items-center justify-center btn-primary bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-amber-500/30 flex-1 sm:flex-none">
                <Edit className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
              </Link>
            )}
            <button onClick={() => window.print()} className="inline-flex items-center justify-center btn-primary flex-1 sm:flex-none">
              <Printer className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Print Profile</span><span className="sm:hidden">Print</span>
            </button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:hidden">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Identity Card */}
          <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-indigo-100/20 border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Photo Section */}
            <div className="relative shrink-0">
              <div className="w-32 h-40 md:w-36 md:h-48 rounded-xl bg-gray-50 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
                <div className="w-full h-full rounded-lg overflow-hidden">
                  {getPhotoUrl(teacher.user?.photoUrl) ? (
                    <img 
                      src={getPhotoUrl(teacher.user.photoUrl)} 
                      alt={teacher.user.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                      <Camera className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute -bottom-3 -right-3 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 transition-transform hover:scale-110">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            
            {/* Main Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{teacher.user.name}</h2>
                <p className="text-indigo-600 font-bold mt-1 text-sm">{teacher.specialization || 'Teacher'}</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                  EMP ID: {teacher.employeeId}
                </span>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                  Joined: {new Date(teacher.joiningDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  {teacher.user.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  {teacher.user.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Academic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-indigo-100/20 border border-gray-100">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  Academic Qualifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Degree / Certification</span>
                    <span className="font-bold text-slate-700">{teacher.qualification || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Specialization</span>
                    <span className="font-bold text-slate-700">{teacher.specialization || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments Sidebar */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-6 lg:p-8 shadow-xl text-white">
                <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <School className="w-4 h-4 text-indigo-300" />
                  </div>
                  Class Assignments
                </h3>
                
                <div className="space-y-3">
                  {assignedClasses.length > 0 ? (
                    assignedClasses.map((item, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold text-xs shrink-0">
                          {item.class.name}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-indigo-100">{item.subject.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Section {item.class.section}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-white/5 rounded-xl border border-white/10 border-dashed">
                      <p className="text-sm text-slate-400 font-medium">No classes assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

    {/* Print-only version (mirrors on-screen layout without interactive controls) */}
    <div className="hidden print:block space-y-6">
      <div className="border-b-4 border-double border-gray-800 pb-3 text-center">
        <h1 className="text-2xl font-black tracking-widest uppercase">JY SCHOOL</h1>
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Official Teacher Registry Dossier</p>
      </div>
      <div className="flex gap-10 items-start">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold">{teacher.user.name}</h2>
          <p className="text-xs text-gray-500">Employee ID: {teacher.employeeId}</p>
          <p className="text-xs text-gray-500">Specialization: {teacher.specialization || 'N/A'}</p>
          <h3 className="font-bold mt-4">Academic Qualifications</h3>
          <p>{teacher.qualification || 'N/A'}</p>
          <h3 className="font-bold mt-4">Class Assignments</h3>
          {assignedClasses.map((item, idx) => (
            <p key={idx}>{item.class.name}-{item.class.section} ({item.subject.name})</p>
          ))}
        </div>
        <div className="w-32 flex-shrink-0">
          <img src={getPhotoUrl(teacher.user.photoUrl)} alt="Teacher Photo" className="w-32 h-40 object-cover" />
        </div>
      </div>
    </div>
    </div>
  );
};
export default TeacherProfilePage;
