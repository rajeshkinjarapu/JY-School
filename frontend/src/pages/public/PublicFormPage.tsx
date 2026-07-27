import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const PublicFormPage: React.FC = () => {
  const { id } = useParams();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Notice we use direct fetch here to avoid Axios interceptors 
  // that might try to add auth tokens and fail/redirect if not logged in.
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`${API_URL}/api/forms/public/${id}`);
        if (!res.ok) throw new Error('Form not found or unavailable');
        const data = await res.json();
        setForm(data.data || data);
      } catch (err: any) {
        setError(err.message || 'Unable to load form');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchForm();
  }, [id, API_URL]);

  const handleChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[fieldId] || [];
      if (checked) return { ...prev, [fieldId]: [...current, option] };
      return { ...prev, [fieldId]: current.filter((opt: string) => opt !== option) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/forms/public/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Submission failed');
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>;

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center border-t-8 border-t-emerald-500">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500">Your response has been successfully recorded.</p>
        </div>
      </div>
    );
  }

  const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;

  return (
    <div className="min-h-screen bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-md border-t-8 border-t-blue-600 p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{form.title}</h1>
          {form.description && <p className="text-gray-600 text-lg">{form.description}</p>}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field: any) => (
            <div key={field.id} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 transition-shadow hover:shadow-md">
              <label className="block text-lg font-medium text-gray-900 mb-4">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  required={field.required}
                  value={answers[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder="Your answer"
                  className="w-full border-b border-gray-300 focus:border-blue-600 focus:ring-0 px-0 py-2 bg-transparent transition-colors"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  required={field.required}
                  value={answers[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder="Your answer"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 p-3 bg-transparent transition-all"
                />
              )}

              {field.type === 'radio' && (
                <div className="space-y-3">
                  {field.options?.map((opt: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={field.id}
                        required={field.required}
                        checked={answers[field.id] === opt}
                        onChange={() => handleChange(field.id, opt)}
                        className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 transition-colors"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'select' && (
                <select
                  required={field.required}
                  value={answers[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 p-3 bg-white"
                >
                  <option value="" disabled>Choose an option</option>
                  {field.options?.map((opt: string, idx: number) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <div className="space-y-3">
                  {field.options?.map((opt: string, idx: number) => {
                    const isChecked = (answers[field.id] || []).includes(opt);
                    return (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
