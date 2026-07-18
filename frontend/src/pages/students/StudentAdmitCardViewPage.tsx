import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { AdmitCardTemplate } from '../../components/Exams/AdmitCardTemplate';
import { Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentAdmitCardViewPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmitCard = async () => {
      try {
        const [studentRes, examRes, plansRes] = await Promise.all([
          studentId ? api.get(`/api/students/${studentId}`) : api.get('/api/dashboard/student'),
          api.get(`/api/exams/${id}`),
          api.get(`/api/exams-extended/plans?examId=${id}`)
        ]);

        const studentData = studentId ? studentRes.data : studentRes.data?.student;

        setData({
          student: studentData,
          exam: examRes.data,
          examPlans: plansRes.data?.data || plansRes.data || []
        });
      } catch (err) {
        toast.error('Failed to load admit card');
      } finally {
        setLoading(false);
      }
    };
    fetchAdmitCard();
  }, [id, studentId]);

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;
  if (!data) return <div className="p-12 text-center text-gray-500">Not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-black text-slate-800">My Admit Card</h1>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer className="w-4 h-4" /> Print / Download PDF
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; display: block !important; }
          .admit-card-wrapper { 
            width: 210mm; 
            height: 297mm; 
            page-break-after: always; 
            page-break-inside: avoid;
            margin: 0;
            padding: 10mm;
            box-sizing: border-box;
            background: white !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
        }
      `}} />

      <div className="print-area w-full max-w-4xl">
        <AdmitCardTemplate student={data.student} exam={data.exam} examPlans={data.examPlans} />
      </div>
    </div>
  );
};
