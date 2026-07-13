import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export const TeacherFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchTeacherData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/teachers/${id}`);
      const teacher = res.data;
      reset({
        name: teacher.user.name,
        email: teacher.user.email,
        phone: teacher.user.phone || '',
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
        joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
      });
    } catch (e) {
      toast.error('Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const onSubmit = async (data: any) => {
    try {
      if (id) {
        await api.put(`/api/teachers/${id}`, data);
        toast.success('Teacher details updated successfully!');
      } else {
        await api.post('/api/teachers', data);
        toast.success('New teacher added successfully!');
      }
      navigate('/teachers');
    } catch (error: any) {
      toast.error(error.message || 'Error saving teacher details');
    }
  };

  if (loading) return <div className="text-center py-12">Loading details...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Teachers
      </Link>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? 'Edit Teacher Details' : 'Add New Teacher'}
          </h2>
          <p className="text-sm text-gray-500">
            Set up credentials and academic qualifications.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" {...register('name')} />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" required className="input" {...register('email')} />
            </div>

            {!id && (
              <div>
                <label className="label">Password</label>
                <input type="password" required className="input" placeholder="Create temporary password" {...register('password')} />
              </div>
            )}

            <div>
              <label className="label">Contact Phone</label>
              <input type="text" className="input" {...register('phone')} />
            </div>

            <div>
              <label className="label">Qualification</label>
              <input type="text" placeholder="e.g. M.Sc Mathematics" className="input" {...register('qualification')} />
            </div>

            <div>
              <label className="label">Specialization</label>
              <input type="text" placeholder="e.g. Calculus, Algebra" className="input" {...register('specialization')} />
            </div>

            <div>
              <label className="label">Joining Date</label>
              <input type="date" className="input" {...register('joiningDate')} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            <span>Save Details</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default TeacherFormPage;
