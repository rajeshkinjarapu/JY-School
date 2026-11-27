import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toPng } from 'html-to-image';
import {
  Cake, Sparkles, Calendar, Search, Filter, Phone, MessageCircle,
  Printer, Download, RefreshCw, ChevronLeft, ChevronRight,
  PartyPopper, Gift, Award, Star, Clock, User, Heart, Share2,
  CheckCircle2, AlertCircle, Eye, Settings2, X, Wand2, Palette,
  Camera, Sliders, Image as ImageIcon, Check, Key, ShieldCheck,
  Upload, Trash2, Edit3, ImagePlus, CheckCircle
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';
import { getPhotoUrl } from '../../utils/photo';

interface StudentBirthday {
  id: string;
  rollNo: string;
  name: string;
  phone: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherPhone: string | null;
  motherPhone: string | null;
  photoUrl: string | null;
  birthdayPosterUrl?: string | null;
  gender: string;
  bloodGroup: string | null;
  dob: string;
  birthMonth: number;
  birthDay: number;
  birthYear: number;
  ageTurning: number;
  classId: string | null;
  className: string;
  daysLeft?: number;
  day?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Modern Student Birthday Avatar Component with Resilient Image & Initials Fallback
const StudentBirthdayAvatar: React.FC<{
  photoUrl?: string | null;
  name: string;
  sizeClass?: string;
  badge?: string;
  textSize?: string;
}> = ({
  photoUrl,
  name,
  sizeClass = "w-13 h-13 rounded-2xl",
  badge,
  textSize = "text-sm",
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = useMemo(() => getPhotoUrl(photoUrl), [photoUrl]);

  const initial = useMemo(() => {
    return (name || 'S').trim().charAt(0).toUpperCase();
  }, [name]);

  const gradientClass = useMemo(() => {
    const gradients = [
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-fuchsia-600',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  }, [name]);

  const canShowImage = Boolean(resolvedUrl && !hasError);

  return (
    <div className={`relative ${sizeClass} overflow-hidden bg-slate-100 border border-slate-200/90 shadow-2xs shrink-0 flex items-center justify-center`}>
      {canShowImage ? (
        <img
          src={resolvedUrl}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-black ${textSize}`}>
          {initial}
        </div>
      )}
      {badge && (
        <div className="absolute bottom-0 inset-x-0 bg-pink-600/90 text-white text-[9px] font-black text-center py-0.2">
          {badge}
        </div>
      )}
    </div>
  );
};

export const StudentBirthdayPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'calendar' | 'directory'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [upcomingDaysFilter, setUpcomingDaysFilter] = useState<number>(7);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [directoryMonth, setDirectoryMonth] = useState<string>('all');
  const [directoryGender, setDirectoryGender] = useState<string>('all');

  // Poster Modal & Designer State
  const [selectedPosterStudent, setSelectedPosterStudent] = useState<StudentBirthday | null>(null);
  const [posterTheme, setPosterTheme] = useState<'garden' | 'festive' | 'royal' | 'gold' | 'sky'>('garden');
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [posterUploadPreview, setPosterUploadPreview] = useState<string | null>(null);
  const [posterUploadFile, setPosterUploadFile] = useState<File | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'custom' | 'system'>('custom');
  const posterRef = useRef<HTMLDivElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Wish Template State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const defaultTemplate = `🎉 *Dear {name}*,\n\nWishing you a very *Happy Birthday!* 🎂✨\nMay God bless you with good health, immense happiness, and great success in all your studies.\n\nWarm wishes & blessings,\n*Management, Principal & Teachers*\n*Sri Venkateswara JY School* 🌟`;
  const [wishTemplate, setWishTemplate] = useState<string>(() => {
    return localStorage.getItem('jy_bday_wish_template') || defaultTemplate;
  });

  // Calendar Date Detail Modal
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ day: number; month: number; students: StudentBirthday[] } | null>(null);

  // Track sent wishes in session
  const [sentWishes, setSentWishes] = useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem('jy_sent_bday_wishes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Fetch classes for dropdown filter
  const { data: classesData } = useQuery({
    queryKey: ['classes-list-birthdays'],
    queryFn: async () => {
      const res = await api.get('/api/classes');
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch Birthday data
  const { data: bdayResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['student-birthdays', selectedClassId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClassId) params.append('classId', selectedClassId);
      const res = await api.get(`/api/students/birthdays?${params.toString()}`);
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 30,
  });

  const stats = bdayResponse?.stats || {
    todayCount: 0,
    tomorrowCount: 0,
    upcomingWeekCount: 0,
    monthCount: 0,
    totalRegistered: 0,
  };

  const todayList: StudentBirthday[] = bdayResponse?.today || [];
  const upcomingList: StudentBirthday[] = bdayResponse?.upcoming || [];
  const thisMonthList: StudentBirthday[] = bdayResponse?.thisMonth || [];
  const allList: StudentBirthday[] = bdayResponse?.all || [];

  // Open Poster Downloader & Manager Modal
  const handleOpenPosterModal = (student: StudentBirthday) => {
    setSelectedPosterStudent(student);
    setPosterUploadFile(null);
    setPosterUploadPreview(null);
    setActivePreviewTab(student.birthdayPosterUrl ? 'custom' : 'system');
  };

  // Handle Outside Custom Poster File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG or PNG)');
      return;
    }

    setPosterUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPosterUploadPreview(objectUrl);
    setActivePreviewTab('custom');
  };

  // Upload Custom Poster to Student Record & Mobile App
  const handleUploadCustomPoster = async (studentId: string) => {
    if (!posterUploadFile) {
      toast.error('Please select a poster image file first');
      return;
    }

    setIsUploadingPoster(true);
    const toastId = toast.loading('Uploading custom poster & setting for Mobile App...');

    try {
      const formData = new FormData();
      formData.append('poster', posterUploadFile);

      const res = await api.post(`/api/students/${studentId}/birthday-poster`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPosterUrl = res.data?.data?.posterUrl;
      toast.success('Birthday Poster saved! It will automatically pop up in Mobile App on birthday 🎉', { id: toastId });
      refetch();

      if (selectedPosterStudent && selectedPosterStudent.id === studentId) {
        setSelectedPosterStudent(prev => prev ? { ...prev, birthdayPosterUrl: newPosterUrl } : null);
      }
      setPosterUploadFile(null);
      setPosterUploadPreview(null);
    } catch (err: any) {
      console.error('Poster upload error:', err);
      const errMsg = err?.response?.data?.message || 'Failed to upload birthday poster';
      toast.error(`Upload Error: ${errMsg}`, { id: toastId });
    } finally {
      setIsUploadingPoster(false);
    }
  };

  // Delete Custom Poster
  const handleDeleteCustomPoster = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this birthday poster?')) return;

    const toastId = toast.loading('Removing poster...');
    try {
      await api.delete(`/api/students/${studentId}/birthday-poster`);
      toast.success('Birthday poster removed successfully', { id: toastId });
      refetch();

      if (selectedPosterStudent && selectedPosterStudent.id === studentId) {
        setSelectedPosterStudent(prev => prev ? { ...prev, birthdayPosterUrl: null } : null);
      }
      setPosterUploadFile(null);
      setPosterUploadPreview(null);
      setActivePreviewTab('system');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to remove poster';
      toast.error(`Delete Error: ${errMsg}`, { id: toastId });
    }
  };

  // Download Direct Uploaded Poster File
  const handleDownloadDirectPoster = (student: StudentBirthday) => {
    if (!student.birthdayPosterUrl) {
      handleOpenPosterModal(student);
      return;
    }
    const url = getPhotoUrl(student.birthdayPosterUrl);
    const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}_Birthday_Poster.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Birthday poster download initiated! 📥');
  };

  // Save the System 9:16 Auto-Designed Canvas as App Poster
  const handleSaveSystemPosterToApp = async () => {
    if (!posterRef.current || !selectedPosterStudent) return;

    setIsUploadingPoster(true);
    const toastId = toast.loading('Rendering and saving 9:16 poster for Mobile App...');

    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2.5,
        quality: 0.95,
        cacheBust: true,
      });

      const res = await api.post(`/api/students/${selectedPosterStudent.id}/birthday-poster`, {
        posterBase64: dataUrl,
        mimeType: 'image/png'
      });

      const newPosterUrl = res.data?.data?.posterUrl;
      toast.success('System 9:16 Poster set as active Mobile App birthday popup! 🎉', { id: toastId });
      refetch();

      setSelectedPosterStudent(prev => prev ? { ...prev, birthdayPosterUrl: newPosterUrl } : null);
      setActivePreviewTab('custom');
    } catch (err: any) {
      console.error('Save system poster error:', err);
      toast.error('Failed to set system poster. Please try again.', { id: toastId });
    } finally {
      setIsUploadingPoster(false);
    }
  };

  // High Resolution 9:16 Poster Downloader (1080x1920)
  const handleDownloadPosterImage = async () => {
    if (!posterRef.current || !selectedPosterStudent) return;

    setIsDownloadingPoster(true);
    const toastId = toast.loading('Rendering high-resolution 9:16 Birthday Poster (1080x1920)...');

    try {
      // 3x pixel ratio guarantees crystal clear 1080x1920+ resolution
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 3,
        quality: 1.0,
        cacheBust: true,
      });

      const safeName = selectedPosterStudent.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeName}_Birthday_Poster_9x16.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('Poster downloaded in HD (9:16) for WhatsApp Status! 🎉', { id: toastId });
    } catch (err: any) {
      console.error('Poster render error:', err);
      toast.error('Failed to capture poster image. Please try again.', { id: toastId });
    } finally {
      setIsDownloadingPoster(false);
    }
  };

  // Handle WhatsApp Wish Launch
  const handleSendWish = (student: StudentBirthday) => {
    const rawPhone = student.phone || student.fatherPhone || student.motherPhone || '';
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error(`Parent mobile number not found for ${student.name}`);
      return;
    }

    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = wishTemplate
      .replace(/{name}/g, student.name)
      .replace(/{class}/g, student.className)
      .replace(/{age}/g, String(student.ageTurning));

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');

    setSentWishes(prev => {
      const updated = { ...prev, [student.id]: true };
      sessionStorage.setItem('jy_sent_bday_wishes', JSON.stringify(updated));
      return updated;
    });
    toast.success(`WhatsApp opened for ${student.name}`);
  };

  // Filtered upcoming list
  const filteredUpcoming = useMemo(() => {
    return upcomingList.filter(s => (s.daysLeft || 0) <= upcomingDaysFilter);
  }, [upcomingList, upcomingDaysFilter]);

  // Calendar Day Map
  const calendarDayMap = useMemo(() => {
    const map: Record<number, StudentBirthday[]> = {};
    allList.forEach(s => {
      if (s.birthMonth === calendarMonth) {
        if (!map[s.birthDay]) map[s.birthDay] = [];
        map[s.birthDay].push(s);
      }
    });
    return map;
  }, [allList, calendarMonth]);

  // Directory Filtered List
  const filteredDirectory = useMemo(() => {
    return allList.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesRoll = s.rollNo.toLowerCase().includes(q);
        const matchesClass = s.className.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesClass) return false;
      }
      if (directoryMonth !== 'all') {
        if (s.birthMonth !== parseInt(directoryMonth, 10)) return false;
      }
      if (directoryGender !== 'all') {
        if (s.gender?.toUpperCase() !== directoryGender.toUpperCase()) return false;
      }
      return true;
    });
  }, [allList, searchQuery, directoryMonth, directoryGender]);

  // Export Directory to Excel
  const handleExportExcel = () => {
    if (filteredDirectory.length === 0) {
      toast.error('No students to export');
      return;
    }

    const data = filteredDirectory.map((s, idx) => ({
      'S.No': idx + 1,
      'Student Name': s.name,
      'Roll Number': s.rollNo,
      'Class & Section': s.className,
      'Date of Birth': s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : 'N/A',
      'Birth Month': MONTH_NAMES[s.birthMonth - 1] || s.birthMonth,
      'Birth Day': s.birthDay,
      'Age (Turning)': s.ageTurning,
      'Gender': s.gender,
      'Blood Group': s.bloodGroup || 'N/A',
      'Father Name': s.fatherName || 'N/A',
      'Mother Name': s.motherName || 'N/A',
      'Contact Number': s.phone || s.fatherPhone || s.motherPhone || 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student_Birthdays');
    XLSX.writeFile(wb, `JY_School_Student_Birthdays_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Birthday directory exported to Excel!');
  };

  // Print Morning Assembly Announcements Sheet
  const handlePrintAssemblySheet = () => {
    const listToPrint = todayList.length > 0 ? todayList : thisMonthList.slice(0, 15);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayStr = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const rows = listToPrint.map((s, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${s.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.className}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.rollNo}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.ageTurning} Years</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${s.fatherPhone || s.phone || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Morning Assembly Birthday Announcements - JY School</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #4338ca; font-size: 22px; }
            h2 { margin: 6px 0; color: #db2777; font-size: 18px; }
            p { margin: 4px 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SRI VENKATESWARA JY SCHOOL</h1>
            <h2>🎉 Morning Assembly Birthday Announcements 🎉</h2>
            <p>Date: <strong>${todayStr}</strong> | Total Celebrating: <strong>${listToPrint.length} Students</strong></p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">#</th>
                <th>Student Name</th>
                <th style="text-align: center;">Class</th>
                <th style="text-align: center;">Roll No</th>
                <th style="text-align: center;">Turning Age</th>
                <th style="text-align: center;">Parent Contact</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer" style="margin-top: 60px;">
            <div>Principal's Signature: __________________</div>
            <div>Assembly In-Charge: __________________</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] overflow-hidden">
      {/* ── 1. Standard Unified Top Page Header (Matches All Other Pages) ── */}
      <PageHeader
        title="Student Birthdays"
        icon={<Cake className="w-5 h-5 text-white" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintAssemblySheet}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#1E1B4B] hover:bg-indigo-50 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assembly List</span>
            </button>

            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs border border-white/25 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Customize WhatsApp Wish Message"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Wish Template</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all border border-white/25 cursor-pointer"
              title="Refresh Birthdays"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* ── Scrollable Body Content (Dashboard Soft Pastel Theme) ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

      {/* ── 2. Top KPI Metric Cards (Dashboard Soft Pastel Gradient Style) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {/* Card 1: Today */}
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className="text-left relative overflow-hidden rounded-[20px] px-3.5 py-3.5 sm:py-4 border bg-gradient-to-br from-[#FFEBF3] to-[#FFD0E4] border-[#FFBDDA] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
          <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#EC4899] to-[#DB2777] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <PartyPopper className="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                Today&apos;s Birthdays
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-lg sm:text-xl lg:text-[22px] font-black text-[#9D174D] tracking-tight leading-tight">
                  {stats.todayCount}
                </p>
                {stats.todayCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#DB2777] text-white text-[9px] font-black">
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-[#DB2777] group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </div>
        </button>

        {/* Card 2: Tomorrow */}
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className="text-left relative overflow-hidden rounded-[20px] px-3.5 py-3.5 sm:py-4 border bg-gradient-to-br from-[#FFEFEF] to-[#FFD2D7] border-[#FFC0C7] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
          <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#F43F5E] to-[#E11D48] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                Tomorrow
              </p>
              <p className="text-lg sm:text-xl lg:text-[22px] font-black text-[#991B1B] tracking-tight leading-tight mt-0.5">
                {stats.tomorrowCount}
              </p>
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-[#E11D48] group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </div>
        </button>

        {/* Card 3: This Week */}
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className="text-left relative overflow-hidden rounded-[20px] px-3.5 py-3.5 sm:py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
          <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                This Week
              </p>
              <p className="text-lg sm:text-xl lg:text-[22px] font-black text-[#9A3412] tracking-tight leading-tight mt-0.5">
                {stats.upcomingWeekCount}
              </p>
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-[#D97706] group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </div>
        </button>

        {/* Card 4: This Month */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className="text-left relative overflow-hidden rounded-[20px] px-3.5 py-3.5 sm:py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
          <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                {MONTH_NAMES[new Date().getMonth()]}
              </p>
              <p className="text-lg sm:text-xl lg:text-[22px] font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {stats.monthCount}
              </p>
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-[#6D28D9] group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </div>
        </button>

        {/* Card 5: Total Registered */}
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className="col-span-2 sm:col-span-1 text-left relative overflow-hidden rounded-[20px] px-3.5 py-3.5 sm:py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-2 group cursor-pointer"
        >
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
          <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-4 h-4 xl:w-5 xl:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-extrabold uppercase tracking-tight text-slate-600 leading-tight whitespace-nowrap">
                DOB Registered
              </p>
              <p className="text-lg sm:text-xl lg:text-[22px] font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {stats.totalRegistered}
              </p>
            </div>
          </div>
          <div className="relative z-10 w-6 h-6 rounded-full bg-white/95 shadow-xs flex items-center justify-center text-[#059669] group-hover:translate-x-0.5 transition-all shrink-0">
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.6} />
          </div>
        </button>
      </div>

      {/* ── 3. Class Filter & Tab Switcher Bar (Dashboard Card Style) ── */}
      <div className="bg-white rounded-[20px] p-3 sm:p-3.5 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.08)] border border-indigo-100/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3F5FC] rounded-2xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Today&apos;s Celebrations</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'today' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {stats.todayCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Birthdays</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'upcoming' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {upcomingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Students Directory</span>
          </button>
        </div>

        {/* Global Class Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFF] hover:bg-indigo-50/70 border border-indigo-100 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[150px]"
          >
            <option value="">All Classes</option>
            {(classesData || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section ? `(${c.section})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="bg-white rounded-[24px] p-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs font-bold text-slate-400 mt-3">Loading student birthday records...</p>
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 1: TODAY'S CELEBRATIONS ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'today' && (
            <div className="space-y-4">
              {todayList.length === 0 ? (
                <div className="bg-white rounded-[26px] p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mb-4">
                    <Cake className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">No Birthdays Today!</h3>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">
                    None of the students are celebrating their birthday today. You can view upcoming birthdays to plan ahead!
                  </p>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    View Upcoming Birthdays →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayList.map((student) => {
                    const isWishSent = sentWishes[student.id];
                    return (
                      <div
                        key={student.id}
                        className="relative overflow-hidden bg-white rounded-[22px] shadow-[0_8px_24px_-6px_rgba(79,70,229,0.10)] border border-indigo-100/90 hover:shadow-[0_14px_30px_-6px_rgba(79,70,229,0.16)] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between"
                      >
                        {/* Dashboard Light Pastel Header Strip */}
                        <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#FCE7F3] px-4 py-2.5 border-b border-indigo-100/80 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#4F46E5] text-white shadow-xs flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            <span>Today&apos;s Birthday</span>
                          </span>
                          <span className="text-[11px] font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200/80 shadow-2xs">
                            Turning {student.ageTurning} Yrs
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          {/* Large Centered Student Photo & Core Info (Name, Class, DOB) */}
                          <div className="flex flex-col items-center text-center mb-4">
                            <StudentBirthdayAvatar
                              photoUrl={student.photoUrl}
                              name={student.name}
                              sizeClass="w-32 h-36 sm:w-36 sm:h-40 rounded-[22px] border-[3px] border-indigo-200/90 shadow-md ring-4 ring-[#EEF2FF]"
                              badge="JY"
                              textSize="text-4xl"
                            />

                            {/* Full Student Name */}
                            <h4 className="mt-3.5 text-base sm:text-[17px] font-black text-[#1E1B4B] leading-snug tracking-tight uppercase break-words px-1">
                              {student.name}
                            </h4>

                            {/* Class & Date of Birth Pills */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                              <span className="px-3 py-1 rounded-xl bg-[#EEF2FF] text-indigo-700 text-xs font-extrabold border border-indigo-200/80 shadow-2xs">
                                Class: {student.className}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFF0F6] text-[#BE185D] text-xs font-extrabold border border-pink-200/80 shadow-2xs">
                                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                                <span>
                                  DOB: {String(student.birthDay).padStart(2, '0')} {MONTH_NAMES[student.birthMonth - 1]?.slice(0, 3)} {student.birthYear}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Mobile App Poster Status Indicator */}
                          {student.birthdayPosterUrl ? (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-bold text-[#15803D] mb-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">Mobile App Poster Active</span>
                              </div>
                              <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                                LIVE
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#FFF6E5] border border-[#FAD79B] text-[11px] font-semibold text-[#9A3412] mb-3">
                              <span className="truncate">No Custom Poster Uploaded</span>
                              <span className="text-[9px] font-bold text-amber-700">Optional</span>
                            </div>
                          )}

                          {/* Action Buttons: Wish WhatsApp & Download/Upload Poster */}
                          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-indigo-100/80">
                            {/* 1-Click WhatsApp Wish */}
                            <button
                              onClick={() => handleSendWish(student)}
                              className={`px-3 py-2 rounded-xl font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isWishSent
                                  ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] hover:bg-emerald-100'
                                  : 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{isWishSent ? 'Wish Sent' : 'Wish WhatsApp'}</span>
                            </button>

                            {/* Poster Action: Download/Manage or Upload */}
                            {student.birthdayPosterUrl ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDownloadDirectPoster(student)}
                                  className="flex-1 px-2.5 py-2 rounded-xl bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                                  title="Download Active Poster"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="truncate">Download</span>
                                </button>
                                <button
                                  onClick={() => handleOpenPosterModal(student)}
                                  className="px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 font-black text-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
                                  title="Manage / Change Poster"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenPosterModal(student)}
                                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>Upload Poster</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 2: UPCOMING BIRTHDAYS ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {/* Upcoming Sub-filter */}
              <div className="flex items-center justify-between bg-white rounded-2xl p-3 px-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Forecast Range:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setUpcomingDaysFilter(days)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        upcomingDaysFilter === days
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Next {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {filteredUpcoming.length === 0 ? (
                <div className="bg-white rounded-[26px] p-12 text-center border border-slate-100">
                  <Cake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-base font-black text-slate-700">No Upcoming Birthdays in Next {upcomingDaysFilter} Days</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Try expanding the range to 30 days or select All Classes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUpcoming.map((student) => {
                    const isTomorrow = student.daysLeft === 1;
                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-[24px] p-4.5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <StudentBirthdayAvatar
                            photoUrl={student.photoUrl}
                            name={student.name}
                            sizeClass="w-13 h-13 rounded-2xl border border-indigo-200"
                            textSize="text-sm"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 truncate">{student.name}</h4>
                            <p className="text-xs text-slate-500 font-semibold">{student.className} • ID: {student.rollNo}</p>
                            <p className="text-[11px] font-bold text-pink-600 mt-0.5">
                              {MONTH_NAMES[student.birthMonth - 1]?.slice(0, 3)} {student.birthDay} (Turning {student.ageTurning})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isTomorrow
                              ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {isTomorrow ? 'Tomorrow 🎂' : `In ${student.daysLeft} days`}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendWish(student)}
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                              title="Send Early WhatsApp Wish"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            {student.birthdayPosterUrl && (
                              <button
                                onClick={() => handleDownloadDirectPoster(student)}
                                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer"
                                title="Download Active Poster (HD)"
                              >
                                <Download className="w-3.5 h-3.5 text-purple-600" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenPosterModal(student)}
                              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
                              title={student.birthdayPosterUrl ? 'Manage / Change Poster' : 'Upload / Design Poster'}
                            >
                              {student.birthdayPosterUrl ? (
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 3: MONTHLY CALENDAR VIEW ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Month Selector Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {MONTH_NAMES.map((mName, idx) => {
                  const mNum = idx + 1;
                  const isSelected = calendarMonth === mNum;
                  return (
                    <button
                      key={mName}
                      onClick={() => setCalendarMonth(mNum)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Grid (Days 1 to 31) */}
              <div className="bg-white rounded-[26px] p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>{MONTH_NAMES[calendarMonth - 1]} Birthday Roster</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    Click on any active date to view celebrating students
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const studentsOnDay = calendarDayMap[day] || [];
                    const hasBirthdays = studentsOnDay.length > 0;

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (hasBirthdays) {
                            setSelectedDateDetails({ day, month: calendarMonth, students: studentsOnDay });
                          }
                        }}
                        className={`min-h-[90px] rounded-2xl p-2.5 transition-all flex flex-col justify-between ${
                          hasBirthdays
                            ? 'bg-gradient-to-br from-pink-50 to-purple-50/60 border-2 border-pink-300 hover:shadow-md cursor-pointer hover:scale-[1.02]'
                            : 'bg-slate-50/70 border border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${hasBirthdays ? 'text-pink-700' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          {hasBirthdays && (
                            <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                              {studentsOnDay.length}
                            </span>
                          )}
                        </div>

                        {hasBirthdays ? (
                          <div className="mt-1 space-y-1">
                            {studentsOnDay.slice(0, 2).map((s) => (
                              <p key={s.id} className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                                🎂 {s.name.split(' ')[0]}
                              </p>
                            ))}
                            {studentsOnDay.length > 2 && (
                              <p className="text-[9px] font-black text-purple-600">
                                +{studentsOnDay.length - 2} more
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-300 font-medium">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ── TAB 4: ALL STUDENTS DIRECTORY ── */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'directory' && (
            <div className="bg-white rounded-[26px] p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
              {/* Directory Filter Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name or roll number..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Month Filter */}
                  <select
                    value={directoryMonth}
                    onChange={(e) => setDirectoryMonth(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Months</option>
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>

                  {/* Gender Filter */}
                  <select
                    value={directoryGender}
                    onChange={(e) => setDirectoryGender(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Genders</option>
                    <option value="MALE">Boys Only</option>
                    <option value="FEMALE">Girls Only</option>
                  </select>

                  {/* Excel Export Button */}
                  <button
                    onClick={handleExportExcel}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-[18px] border border-[#DDD7F3] shadow-[0_8px_24px_-6px_rgba(91,33,182,0.08)]">
                <table className="w-full text-left text-xs border-collapse student-grid-table">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] !text-white text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-3 px-4 border-r border-white/20 !text-white">Student</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Class</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Roll No</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Date of Birth</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Turning Age</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Gender</th>
                      <th className="py-3 px-3 border-r border-white/20 !text-white">Parent Contact</th>
                      <th className="py-3 px-4 text-center !text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDirectory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                          No students match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDirectory.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <StudentBirthdayAvatar
                                photoUrl={student.photoUrl}
                                name={student.name}
                                sizeClass="w-8 h-8 rounded-full border border-slate-200"
                                textSize="text-xs"
                              />
                              <span className="font-bold text-slate-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{student.className}</td>
                          <td className="py-3 px-3 font-bold text-indigo-600">{student.rollNo}</td>
                          <td className="py-3 px-3 font-semibold text-slate-600">
                            {MONTH_NAMES[student.birthMonth - 1]?.slice(0, 3)} {student.birthDay}, {student.birthYear}
                          </td>
                          <td className="py-3 px-3 font-bold text-pink-600">{student.ageTurning} Yrs</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              student.gender?.toUpperCase() === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {student.gender || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {student.phone || student.fatherPhone || student.motherPhone || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSendWish(student)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                                title="Send WhatsApp Wish"
                              >
                                <MessageCircle className="w-4 h-4 text-emerald-600" />
                              </button>
                              {student.birthdayPosterUrl && (
                                <button
                                  onClick={() => handleDownloadDirectPoster(student)}
                                  className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all cursor-pointer"
                                  title="Download Active Poster (HD)"
                                >
                                  <Download className="w-4 h-4 text-purple-600" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenPosterModal(student)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                                title={student.birthdayPosterUrl ? "Manage / Change Poster" : "Upload / Design Poster"}
                              >
                                {student.birthdayPosterUrl ? (
                                  <Edit3 className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Upload className="w-4 h-4 text-indigo-600" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MASTER BIRTHDAY POSTER MANAGER & UPLOADER MODAL ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedPosterStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col md:flex-row max-h-[92vh]">
            
            {/* Left Column: Live Poster Preview (Custom or System) */}
            <div className="w-full md:w-[420px] bg-slate-900 p-4 sm:p-5 flex flex-col items-center justify-between overflow-y-auto shrink-0">
              
              {/* Preview Mode Switcher */}
              <div className="w-full flex items-center justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'custom'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Custom Poster</span>
                  {(selectedPosterStudent.birthdayPosterUrl || posterUploadPreview) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab('system')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === 'system'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>9:16 System Canvas</span>
                </button>
              </div>

              {/* ── PREVIEW VIEWPORT ── */}
              <div className="my-auto flex items-center justify-center">
                {activePreviewTab === 'custom' ? (
                  // Custom Outside Poster Preview
                  posterUploadPreview || selectedPosterStudent.birthdayPosterUrl ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 max-h-[580px] w-[320px] bg-black flex flex-col items-center justify-center">
                      <img
                        src={posterUploadPreview || getPhotoUrl(selectedPosterStudent.birthdayPosterUrl)}
                        alt="Birthday Poster Preview"
                        className="w-full h-full object-contain max-h-[580px]"
                      />
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-md flex items-center gap-1 backdrop-blur-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>{posterUploadPreview ? 'Selected for Upload' : 'Active Mobile App Poster'}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[320px] h-[480px] rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-pink-400 mb-3">
                        <ImagePlus className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">No Custom Poster Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                        Upload your outside-designed poster (Canva/Photoshop) on the right, or switch to the 9:16 System Canvas.
                      </p>
                    </div>
                  )
                ) : (
                  // 9:16 School System Canvas Preview
                  <div
                    ref={posterRef}
                    className="w-[330px] h-[586px] rounded-2xl overflow-hidden relative shadow-2xl flex flex-col justify-between text-slate-800 select-none shrink-0"
                    style={{
                      background: posterTheme === 'garden'
                        ? 'linear-gradient(180deg, #d4fcd7 0%, #ffffff 32%, #fffde7 70%, #dcfce7 100%)'
                        : posterTheme === 'festive'
                        ? 'linear-gradient(180deg, #fce7f3 0%, #ffffff 35%, #fff1f2 70%, #ffe4e6 100%)'
                        : posterTheme === 'gold'
                        ? 'linear-gradient(180deg, #fef3c7 0%, #ffffff 35%, #fef9c3 70%, #fde68a 100%)'
                        : posterTheme === 'royal'
                        ? 'linear-gradient(180deg, #f3e8ff 0%, #ffffff 35%, #ede9fe 70%, #ddd6fe 100%)'
                        : 'linear-gradient(180deg, #e0f2fe 0%, #ffffff 35%, #e0e7ff 70%, #bae6fd 100%)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Top Header */}
                    <div className="pt-3 px-3 text-center relative z-10">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="w-13 h-13 rounded-full bg-white p-0.5 shadow-md border border-amber-300 overflow-hidden shrink-0">
                          <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1 text-center px-1">
                          <h2 className="text-[14px] font-black text-[#1E1B4B] tracking-tight leading-tight uppercase font-serif drop-shadow-xs">
                            SRI VENKATESWARA<br />JY SCHOOL
                          </h2>
                          <div className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                            NARASANNAPETA
                          </div>
                        </div>

                        <div className="w-12 h-12 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col items-center justify-center text-center p-1 shadow-xs shrink-0">
                          <span className="text-lg leading-none">🏫</span>
                          <span className="text-[8px] font-black text-amber-800 uppercase leading-none mt-0.5">SCHOOL</span>
                        </div>
                      </div>

                      <div className="relative mt-1.5 mb-1">
                        <span className="absolute -top-2 left-4 text-xs">🦋</span>
                        <span className="absolute -top-1 right-5 text-xs">✨</span>
                        <div className="text-center">
                          <span
                            className="block text-[30px] font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#DB2777] via-[#E11D48] to-[#EA580C] leading-none drop-shadow-[0_2px_4px_rgba(219,39,119,0.35)]"
                            style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                          >
                            Happy Birthday
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Student Photo & Badges */}
                    <div className="px-3 flex items-center justify-between gap-2.5 my-auto relative z-10">
                      <div className="relative w-36 h-46 rounded-2xl overflow-hidden shadow-xl border-3 border-white bg-slate-100 shrink-0">
                        <img
                          src={getPhotoUrl(selectedPosterStudent.photoUrl) || '/logo.png'}
                          alt={selectedPosterStudent.name}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/logo.png';
                          }}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col items-center text-center space-y-1.5">
                        <div className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#831843] via-[#9D174D] to-[#831843] text-white shadow-md border border-amber-300">
                          <p className="text-[11px] font-black uppercase tracking-wider truncate leading-tight drop-shadow-xs">
                            # {selectedPosterStudent.name} ★
                          </p>
                        </div>

                        <div className="w-full py-1 px-2 rounded-lg bg-[#15803D] text-white shadow-xs">
                          <p className="text-[10px] font-black leading-tight">
                            Class: {selectedPosterStudent.className}
                          </p>
                        </div>

                        <div className="w-full p-1.5 rounded-xl bg-white/95 border-2 border-pink-300 shadow-xs flex flex-col items-center">
                          <div className="text-base leading-none">🎂</div>
                          <span className="text-[8px] font-black text-slate-500 uppercase mt-0.5">Date of Birth</span>
                          <span className="text-[11px] font-black text-[#E11D48] leading-tight">
                            {selectedPosterStudent.birthDay}{' '}
                            {MONTH_NAMES[selectedPosterStudent.birthMonth - 1]?.slice(0, 3)}{' '}
                            {selectedPosterStudent.birthYear}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Blessings & Ribbon */}
                    <div className="px-3 pb-3 text-center relative z-10 space-y-1.5">
                      <div className="px-2">
                        <p className="text-[10px] font-extrabold text-[#1E293B] leading-tight">
                          May God bless you with good health, happiness and success in your life.
                        </p>
                        <p
                          className="text-xs font-black text-[#DB2777] italic mt-0.5"
                          style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                        >
                          Have a Wonderful Birthday!
                        </p>
                      </div>

                      <div className="flex items-center justify-between px-2 pt-0.5">
                        <div className="text-xl leading-none">💐</div>
                        <div className="text-xs font-bold text-amber-700">🎉 🌟 ✨</div>
                        <div className="text-xl leading-none">🎁</div>
                      </div>

                      <div className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#1E3A8A] text-white shadow-md border border-amber-300">
                        <p className="text-[8px] font-black text-amber-300 uppercase tracking-wider leading-tight">
                          Best Wishes from
                        </p>
                        <p className="text-[9px] font-black text-white uppercase tracking-wider leading-tight mt-0.2">
                          ★ JY School Management & Staff ★
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-note */}
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                {activePreviewTab === 'custom'
                  ? 'This poster will appear immediately when opening the mobile app'
                  : '9:16 Aspect Ratio optimized for WhatsApp Status & Mobile Screen'}
              </p>
            </div>

            {/* Right Column: Controls & Upload Actions */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Cake className="w-5 h-5 text-pink-600" />
                      <span>Student Birthday Poster Manager</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {selectedPosterStudent.name} • Class {selectedPosterStudent.className} (ID: {selectedPosterStudent.rollNo})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPosterStudent(null);
                      setPosterUploadFile(null);
                      setPosterUploadPreview(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Section 1: Upload Outside Custom Poster (Canva / Photoshop) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/70 via-rose-50/50 to-purple-50/60 border border-pink-200/80 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-pink-600 text-white shadow-sm">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Upload Outside Designed Poster</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Canva, Photoshop, or Gallery Image (JPG/PNG)</p>
                      </div>
                    </div>
                    {selectedPosterStudent.birthdayPosterUrl && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active on App</span>
                      </span>
                    )}
                  </div>

                  {/* Active Poster Status Box */}
                  {selectedPosterStudent.birthdayPosterUrl && !posterUploadFile && (
                    <div className="p-3 rounded-xl bg-white/90 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          A custom birthday poster is active for this student and will automatically pop up when they open the mobile app on their birthday.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadDirectPoster(selectedPosterStudent)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Poster</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => posterFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Poster</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomPoster(selectedPosterStudent.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Drag & Drop / File Select Box */}
                  <div
                    onClick={() => posterFileInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-300 hover:border-pink-500 bg-white/80 rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-white group"
                  >
                    <ImagePlus className="w-7 h-7 text-pink-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-black text-slate-800">
                      {posterUploadFile ? posterUploadFile.name : 'Click here to select a Birthday Poster'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {posterUploadFile
                        ? `${(posterUploadFile.size / 1024).toFixed(1)} KB selected`
                        : 'Supports JPEG, JPG, PNG from Canva / Photoshop (Recommended 9:16 or Portrait)'}
                    </p>
                  </div>

                  {/* Upload Confirm Button if file chosen */}
                  {posterUploadFile && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUploadCustomPoster(selectedPosterStudent.id)}
                        disabled={isUploadingPoster}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-black shadow-md shadow-pink-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <Upload className={`w-4 h-4 ${isUploadingPoster ? 'animate-bounce' : ''}`} />
                        <span>{isUploadingPoster ? 'Uploading Poster...' : 'Upload & Set for Mobile App 🚀'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPosterUploadFile(null);
                          setPosterUploadPreview(null);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 2: JY School 9:16 System Canvas Option */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-blue-50/60 border border-indigo-200/80 space-y-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Or Use System 9:16 Designer</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Automatic school template with official logo & child photo</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      System Template
                    </span>
                  </div>

                  {/* Theme Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Choose Template Theme:</span>
                      <span className="text-[10px] text-indigo-600 font-black capitalize">{posterTheme}</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'garden', label: 'Garden', color: 'from-emerald-300 to-green-100' },
                        { id: 'festive', label: 'Festive', color: 'from-pink-300 to-rose-100' },
                        { id: 'gold', label: 'Gold', color: 'from-amber-300 to-yellow-100' },
                        { id: 'royal', label: 'Royal', color: 'from-purple-300 to-violet-100' },
                        { id: 'sky', label: 'Sky', color: 'from-sky-300 to-blue-100' },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            setPosterTheme(th.id as any);
                            setActivePreviewTab('system');
                          }}
                          className={`h-9 rounded-xl bg-gradient-to-br ${th.color} border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                            posterTheme === th.id ? 'border-indigo-600 scale-105 shadow-md' : 'border-white'
                          }`}
                        >
                          <span className="text-[9px] font-black text-slate-800">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Poster Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveSystemPosterToApp}
                      disabled={isUploadingPoster}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      title="Set this design as active mobile app birthday popup"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Set as App Poster</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPosterImage}
                      disabled={isDownloadingPoster}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                      title="Download 1080x1920 HD file for WhatsApp Status"
                    >
                      <Download className={`w-3.5 h-3.5 ${isDownloadingPoster ? 'animate-bounce' : ''}`} />
                      <span>Download 9:16 HD</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: WhatsApp Wish & Close */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWish(selectedPosterStudent)}
                  className="flex-1 py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Send Wish on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPosterStudent(null);
                    setPosterUploadFile(null);
                    setPosterUploadPreview(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ── MODAL 3: WISH TEMPLATE CUSTOMIZER ── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[26px] p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Customize WhatsApp Template</h3>
                  <p className="text-xs text-slate-400 font-medium">Use {'{name}'}, {'{class}'}, and {'{age}'} placeholders</p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Message Template:</label>
              <textarea
                rows={7}
                value={wishTemplate}
                onChange={(e) => setWishTemplate(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setWishTemplate(defaultTemplate);
                  localStorage.removeItem('jy_bday_wish_template');
                  toast.success('Reset to default template');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Reset Default
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('jy_bday_wish_template', wishTemplate);
                  setIsTemplateModalOpen(false);
                  toast.success('Wish message template saved!');
                }}
                className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black shadow-md shadow-pink-600/20 cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DATE SPECIFIC POPUP FOR CALENDAR ── */}
      {selectedDateDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[26px] p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  🎂 {MONTH_NAMES[selectedDateDetails.month - 1]} {selectedDateDetails.day} Birthdays
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedDateDetails.students.length} Student(s) celebrating
                </p>
              </div>
              <button
                onClick={() => setSelectedDateDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDateDetails.students.map((st) => (
                <div key={st.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center shrink-0">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{st.className} • Age: {st.ageTurning}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendWish(st)}
                      className="p-2 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] transition-all cursor-pointer"
                      title="Send WhatsApp Wish"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDateDetails(null);
                        handleOpenPosterModal(st);
                      }}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer"
                      title="Download Poster (9:16)"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudentBirthdayPage;
