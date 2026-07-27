import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import api from '../../../api/axios';
import { LoadingSpinner } from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export const FormResponsesPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const [formRes, subRes]: any = await Promise.all([
          api.get(`/api/forms/${id}`),
          api.get(`/api/forms/${id}/submissions`)
        ]);
        setForm(formRes.data || formRes);
        setSubmissions(subRes.data || subRes || []);
      } catch (error) {
        toast.error('Failed to load responses');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchResponses();
  }, [id]);

  const exportToExcel = () => {
    if (!form || submissions.length === 0) return;
    try {
      const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;
      const headers = ['Submission Date', ...fields.map((f: any) => f.label)];
      
      const data = submissions.map(sub => {
        const answers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers;
        const row: any = { 'Submission Date': new Date(sub.submittedAt).toLocaleString() };
        fields.forEach((f: any) => {
          let val = answers[f.id];
          if (Array.isArray(val)) val = val.join(', ');
          row[f.label] = val || '';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Responses');
      XLSX.writeFile(wb, `${form.title}_Responses.xlsx`);
      toast.success('Exported to Excel');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (!form) return <div>Form not found</div>;

  const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{form.title} - Responses</h2>
            <p className="text-gray-500 text-sm">{submissions.length} total responses</p>
          </div>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export to Excel
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Responses Yet</h3>
          <p className="text-gray-500">Share your public link to start collecting data.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                  {fields.map((f: any) => (
                    <th key={f.id} className="px-6 py-4 whitespace-nowrap">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  const answers = typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers;
                  return (
                    <tr key={sub.id} className={`border-b dark:border-gray-700 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      {fields.map((f: any) => {
                        let val = answers[f.id];
                        if (Array.isArray(val)) val = val.join(', ');
                        return <td key={f.id} className="px-6 py-4">{val || '-'}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
