import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ProgressCardTemplate } from '../../components/Exams/ProgressCardTemplate';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Download, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AppProgressCardView: React.FC = () => {
  const { examId, studentId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const classId = searchParams.get('classId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [examData, setExamData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) throw new Error("Missing authentication token");
        if (!examId || !studentId) throw new Error("Missing exam or student ID");

        // Use custom axios instance to pass token explicitly since this page is outside Redux Auth context
        const axiosInstance = axios.create({
          baseURL: API_BASE,
          headers: { Authorization: `Bearer ${token}` }
        });

        const [settingsRes, resultsRes, examRes] = await Promise.all([
          axiosInstance.get('/api/settings'),
          axiosInstance.get(`/api/exams/${examId}/results${classId ? `?classId=${classId}` : ''}`),
          axiosInstance.get(`/api/exams/${examId}`)
        ]);

        if (settingsRes.data.success) {
          setSettings(settingsRes.data.data || {});
        }

        if (examRes.data.success) {
          setExamData(examRes.data.data);
        }

        if (resultsRes.data.success) {
          const allStudents = resultsRes.data.data;
          const targetStudent = allStudents.find((s: any) => s.studentId === studentId);
          if (targetStudent) {
            setStudentData(targetStudent);
          } else {
            throw new Error("Student result not found in this exam");
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load progress card");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, studentId, token, classId]);

  const downloadPDF = async () => {
    if (!cardRef.current || !studentData) return;
    
    try {
      const scale = 2; // High resolution
      const canvas = await html2canvas(cardRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const marginX = (pdfWidth - finalWidth) / 2;
      const marginY = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', marginX, marginY, finalWidth, finalHeight);
      
      const fileName = `${studentData.name.replace(/[^a-zA-Z0-9]/g, '_')}_ProgressCard.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF Generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 font-medium">Loading Progress Card...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Map backend studentData to ProgressCardTemplate safeData format
  const mappedData = {
    studentName: studentData?.name,
    rollNo: studentData?.rollNo,
    className: studentData?.className?.split('-')[0]?.trim() || "",
    section: studentData?.className?.split('-')[1]?.trim() || "",
    mobile: studentData?.mobile,
    rank: studentData?.rank,
    photo: studentData?.photo,
    total: studentData?.total,
    academicYear: studentData?.academicYear,
    location: "Narasannapeta", // Default location or fetch from settings
    marks: studentData?.marks || []
  };

  return (
    <div className="min-h-screen bg-gray-200 py-6 px-4 flex flex-col items-center">
      <div className="w-full max-w-[794px] flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Student Progress Card</h1>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Download PDF</span>
        </button>
      </div>
      
      {/* Container for the Progress Card that mimics print bounds */}
      <div className="w-full max-w-[794px] overflow-auto shadow-2xl rounded-xl bg-white">
        <div ref={cardRef} className="origin-top flex justify-center">
          <ProgressCardTemplate 
            data={mappedData} 
            exam={examData} 
            settings={settings} 
          />
        </div>
      </div>
    </div>
  );
};
