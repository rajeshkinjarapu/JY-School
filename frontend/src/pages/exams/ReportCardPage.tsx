import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, FileDown } from 'lucide-react';

export const ReportCardPage: React.FC = () => {
  const { examId, studentId } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const res: any = await api.get(`/api/marks/report-card/${studentId}/${examId}`);
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [examId, studentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const importToast = toast.loading('Generating Report Card PDF...');
    try {
      const response: any = await api.get(`/api/marks/report-card/${studentId}/${examId}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card_${studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report Card downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export Report Card PDF.', { id: importToast });
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!report) return <div className="text-center py-12">Report card details not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <Link to="/exams" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPdf} className="btn-primary flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="card p-8 space-y-8 bg-white border border-gray-200 shadow-md">
        {/* Header */}
        <div className="text-center border-b pb-6 space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-950">JY SCHOOL</h1>
          <p className="text-sm text-gray-400">Springfield Campus • SMS Portal Report Card</p>
          <Badge variant="info" className="mt-2">{report.exam.name} ({report.exam.term})</Badge>
        </div>

        {/* Student metadata */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs text-gray-400 block">Student Name</span>
            <span className="font-bold text-gray-900">{report.student.user.name}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Roll Number</span>
            <span className="font-semibold text-gray-900">{report.student.rollNo}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Class Grade</span>
            <span className="font-semibold text-gray-900">
              {report.student.class.name}-{report.student.class.section}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Assessment Date</span>
            <span className="font-semibold text-gray-900">
              {new Date(report.exam.examDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Marks Table */}
        <table className="w-full text-sm text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 border-r border-gray-200">Subject</th>
              <th className="px-4 py-3 border-r border-gray-200">Marks Obtained</th>
              <th className="px-4 py-3 border-r border-gray-200">Max Marks</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {report.marks.map((m: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                <td className="px-4 py-3 font-semibold border-r border-gray-200">{m.subject.name}</td>
                <td className="px-4 py-3 border-r border-gray-200 font-bold">{m.marksObtained}</td>
                <td className="px-4 py-3 border-r border-gray-200 text-gray-500">{m.maxMarks}</td>
                <td className="px-4 py-3 font-bold text-teal-600">{m.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Aggregate analysis */}
        <div className="grid grid-cols-3 gap-6 border-t pt-6 text-center text-sm font-semibold">
          <div>
            <span className="text-xs text-gray-400 block font-normal">Percentage</span>
            <span className="text-lg text-gray-900">{report.percentage}%</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-normal">Overall Grade</span>
            <span className="text-lg text-teal-600">{report.overallGrade}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-normal">Class Rank</span>
            <span className="text-lg text-amber-500">#{report.rank}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportCardPage;
