import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera 
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchStudentProfile = async () => {
    try {
      const res: any = await api.get(`/api/students/${id}`);
      setStudent(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      // 1. Upload the image to backend
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');

      // 2. Save the uploaded URL to the student database
      await api.put(`/api/students/${student.id}`, {
        name: student.user.name,
        photoUrl: uploadedUrl,
      });

      toast.success('Photo updated successfully!', { id: loadingToast });
      // 3. Refresh profile details
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!student) return <div className="text-center py-12">Student profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:max-w-full print:p-0">
      
      {/* ================= SCREEN-ONLY VIEW (Hidden in print) ================= */}
      <div className="space-y-6 print:hidden">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <Link 
            to="/students" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-xs font-bold shadow-md hover:scale-102 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Profile</span>
          </button>
        </div>

        {/* Profile ID Card Details */}
        <div className="relative overflow-hidden card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <Avatar 
              name={student.user.name} 
              src={student.user.photoUrl} 
              size="lg" 
              variant="rectangular" 
              className="w-28 h-36 md:w-32 md:h-40 rounded-2xl ring-4 ring-primary-500/10 shadow-lg object-cover" 
            />
            {/* Upload Button */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl transition-colors border border-primary-200 dark:border-gray-700 shadow-sm hover:scale-102 active:scale-98 select-none">
              <Camera className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload} 
                disabled={uploading}
              />
            </label>
          </div>
          
          <div className="relative z-10 flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {student.user.name}
              </h2>
              <div className="flex justify-center md:justify-start gap-1.5">
                <Badge variant="info" className="px-2.5 py-0.5 font-bold tracking-wide">
                  Roll No: {student.rollNo}
                </Badge>
                <Badge variant="success" className="px-2.5 py-0.5 font-bold tracking-wide">
                  Class: {student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}
                </Badge>
              </div>
            </div>
            
            <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold flex items-center justify-center md:justify-start gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary-500" />
              <span>Academic Profile Ledger Roster</span>
            </p>
          </div>
        </div>

        {/* Grid details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card Left: Student Profile Details */}
          <div className="card p-6 md:col-span-2 space-y-6">
            <h3 className="font-extrabold text-lg border-b pb-2.5 text-gray-955 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Academic Profile Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <User2 className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Gender</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.gender || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Droplet className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Blood Group</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.bloodGroup || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <ClipboardCheck className="w-4.5 h-4.5 text-teal-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Admission Date</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Users className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Father's Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.fatherName || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Users className="w-4.5 h-4.5 text-pink-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mother's Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.motherName || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Fingerprint className="w-4.5 h-4.5 text-purple-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aadhar Number</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.aadharNo || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Hash className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">PEN Number</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.penNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Home Address</span>
              <p className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 font-semibold text-gray-700 dark:text-gray-300">
                {student.address || 'No address provided'}
              </p>
            </div>
          </div>

          {/* Profile Card Right: Guardian Contact */}
          <div className="card p-6 space-y-6">
            <h3 className="font-extrabold text-lg border-b pb-2.5 text-gray-950 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" />
              <span>Guardian Contact</span>
            </h3>

            {student.parent ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Name</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">{student.parent.user.name}</span>
                </div>
                {user?.role !== 'STUDENT' && student.parent.user.email && (
                  <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{student.parent.user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{student.parent.user.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Relation</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.parent.relation || 'Guardian'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No guardian details linked to this profile.</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
             ================= PRINT-ONLY DOSSIER VIEW =================
             ============================================================ */}
      <div className="hidden print:block print:w-full print:h-[297mm] print:m-0 bg-white text-black font-sans relative" style={{ pageBreakAfter: 'always', margin: 0, padding: 0 }}>
        {/* Decorative Border */}
        <div className="absolute inset-6 border-[6px] border-double border-gray-800 pointer-events-none rounded-xl opacity-90" />
        <div className="absolute inset-7 border border-gray-400 pointer-events-none rounded-lg" />
        
        <div className="p-14 h-full flex flex-col relative z-10">
          
          {/* Header */}
          <div className="text-center mb-10 border-b-2 border-gray-900 pb-8 relative">
            <h1 className="text-4xl font-black tracking-[0.2em] uppercase text-gray-900 mb-3">
              JY SCHOOL
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-600">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
            <div className="mt-6 inline-flex px-10 py-2 bg-gray-900 rounded-sm">
              <span className="text-sm font-black uppercase tracking-[0.25em] text-white">
                Official Student Record
              </span>
            </div>
          </div>

          {/* Student ID block */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h2 className="text-4xl font-black text-gray-900 leading-none mb-4">{student.user.name}</h2>
              <div className="flex gap-6 text-sm font-bold text-gray-700 bg-gray-100 px-6 py-3 rounded-lg border border-gray-200 shadow-sm inline-flex">
                <span>Roll No: <span className="text-black font-black">{student.rollNo}</span></span>
                <span>•</span>
                <span>Class: <span className="text-black font-black">{student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}</span></span>
              </div>
            </div>
            
            <div className="w-36 h-48 border-4 border-gray-200 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center relative shadow-sm">
              <Avatar 
                name={student.user.name} 
                src={student.user.photoUrl} 
                size="lg" 
                variant="rectangular" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 flex-grow text-sm">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Personal Details</h3>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Gender</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.gender || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Date of Birth</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Blood Group</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Admission Date</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">
                  {new Date(student.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 mt-8">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Aadhar Number</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.aadharNo || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">PEN Number</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.penNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Family & Contact Details</h3>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Father's Name</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.fatherName || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Mother's Name</span>
                <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.motherName || 'N/A'}</span>
              </div>
              
              {student.parent && (
                <>
                  <div className="flex flex-col gap-1.5 mt-4">
                    <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Guardian Name ({student.parent.relation || 'Guardian'})</span>
                    <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.parent.user.name}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Contact Number</span>
                    <span className="text-base font-bold text-black border-b border-dashed border-gray-300 pb-1">{student.parent.user.phone || 'N/A'}</span>
                  </div>
                </>
              )}
              
              <div className="flex flex-col gap-1.5 pt-4">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Residential Address</span>
                <span className="text-base font-bold text-black leading-relaxed border-b border-dashed border-gray-300 pb-1 min-h-[48px]">
                  {student.address || 'No address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="mt-20 mb-8 flex justify-between items-end px-10">
            <div className="text-center w-64">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-4"></div>
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                Class Teacher Signature
              </span>
            </div>
            
            <div className="w-36 h-36 rounded-full border-[3px] border-gray-200 flex items-center justify-center bg-gray-50/50 -my-6">
               <span className="text-gray-300 font-bold uppercase tracking-[0.2em] text-[10px] rotate-[-25deg]">School Seal / Stamp</span>
            </div>

            <div className="text-center w-64">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-4"></div>
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                Principal / Registrar
              </span>
            </div>
          </div>

          {/* System generated stamp */}
          <div className="text-center mt-auto pt-6 border-t border-gray-200">
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                System Generated Document • Date: {new Date().toLocaleDateString('en-IN')} • JY SCHOOL Database
             </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default StudentProfilePage;
