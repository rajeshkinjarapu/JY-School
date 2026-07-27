import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Share2, Trash2, Edit3, ClipboardList } from 'lucide-react';
import api from '../../../api/axios';
import { LoadingSpinner } from '../../../components/UI/LoadingSpinner';
import { Badge } from '../../../components/UI/Badge';
import toast from 'react-hot-toast';

export const FormManagerPage: React.FC = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchForms = async () => {
    try {
      const res: any = await api.get('/api/forms');
      setForms(res.data || res);
    } catch (error) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    try {
      await api.delete(`/api/forms/${id}`);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (error) {
      toast.error('Failed to delete form');
    }
  };

  const copyPublicLink = (id: string) => {
    const url = `${window.location.origin}/forms/public/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Public link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Form Manager</h2>
          <p className="text-gray-500 text-sm">Create and manage dynamic forms.</p>
        </div>
        <button
          onClick={() => navigate('/office-tools/forms/builder')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Form
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><LoadingSpinner /></div>
      ) : forms.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Forms Found</h3>
          <p className="text-gray-500 mb-6">Create your first form to start collecting responses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{form.title}</h3>
                <Badge variant={form.isActive ? 'success' : 'default'}>
                  {form.isActive ? 'Active' : 'Closed'}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">
                {form.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <span>{form._count?.submissions || 0} Responses</span>
                <span>{new Date(form.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/office-tools/forms/${form.id}/responses`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tooltip-trigger"
                    title="View Responses"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => copyPublicLink(form.id)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors tooltip-trigger"
                    title="Copy Public Link"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tooltip-trigger"
                    title="Delete Form"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
