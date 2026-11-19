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
  Camera, Sliders, Image as ImageIcon, Check, Key, ShieldCheck
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
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
  const [aiPortraitUrl, setAiPortraitUrl] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // AI Settings State (ChatGPT & Gemini API Keys)
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState<string>(() => localStorage.getItem('jy_openai_api_key') || '');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('jy_gemini_api_key') || '');
  const [activeAiProvider, setActiveAiProvider] = useState<'openai' | 'gemini'>(() => {
    return (localStorage.getItem('jy_birthday_ai_provider') as 'openai' | 'gemini') || 'openai';
  });

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

  // Open Poster Downloader Modal
  const handleOpenPosterModal = (student: StudentBirthday) => {
    setSelectedPosterStudent(student);
    setAiPortraitUrl(null); // Reset any previous AI portrait
  };

  // Generate AI Portrait in School Uniform
  const handleGenerateAiPortrait = async () => {
    if (!selectedPosterStudent) return;

    if (activeAiProvider === 'openai' && !openAiApiKey.trim()) {
      toast.error('Please configure your ChatGPT (OpenAI) API Key in AI Settings first!');
      setIsAiSettingsOpen(true);
      return;
    }
    if (activeAiProvider === 'gemini' && !geminiApiKey.trim()) {
      toast.error('Please configure your Google Gemini API Key in AI Settings first!');
      setIsAiSettingsOpen(true);
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading('AI is generating student portrait in JY School uniform with a sweet smile...');

    try {
      const isFemale = selectedPosterStudent.gender?.toUpperCase() === 'FEMALE';
      const childDesc = isFemale ? 'Indian school girl with pigtails' : 'Indian school boy with neatly combed hair';

      const promptText = `A professional high-end studio portrait photograph of a cute ${childDesc}, age around ${selectedPosterStudent.ageTurning} years old, with a sweet gentle smile and straight face looking directly into the camera lens. The student is wearing the clean official uniform of Sri Venkateswara JY School: white and green checkered shirt with collar, dark green pinafore/blazer, and a dark green striped school tie. Soft studio bokeh lighting, warm festive glow, crystal clear 8k resolution, authentic school yearbook studio photography.`;

      if (activeAiProvider === 'openai') {
        const response = await axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            model: 'dall-e-3',
            prompt: promptText,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          },
          {
            headers: {
              Authorization: `Bearer ${openAiApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const generatedUrl = response.data?.data?.[0]?.url;
        if (generatedUrl) {
          setAiPortraitUrl(generatedUrl);
          toast.success('AI Portrait generated in uniform successfully! ✨', { id: toastId });
        } else {
          throw new Error('No image URL returned from OpenAI');
        }
      } else {
        // Gemini Imagen API
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiApiKey.trim()}`,
          {
            instances: [{ prompt: promptText }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }
        );

        const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
        if (b64) {
          setAiPortraitUrl(`data:image/png;base64,${b64}`);
          toast.success('Gemini AI Portrait generated successfully! ✨', { id: toastId });
        } else {
          throw new Error('Gemini did not return image bytes');
        }
      }
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Failed to generate AI portrait';
      toast.error(`AI Error: ${errMsg}`, { id: toastId });
    } finally {
      setIsGeneratingAi(false);
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
    <div className="min-h-screen bg-[#F0F4FA] p-3 sm:p-5 lg:p-7 space-y-5 animate-fade-in pb-16">
      {/* ── 1. Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 p-5 sm:p-7 text-white shadow-lg shadow-pink-600/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-40 w-60 h-60 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-inner shrink-0"
              title="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-inner">
              <Cake className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                  Student Birthdays & Celebrations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/30">
                  Live Hub
                </span>
              </div>
              <p className="text-xs sm:text-sm text-pink-100 font-medium mt-1">
                Honor students in morning assembly, create 9:16 WhatsApp posters & send instant blessings
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Settings Button */}
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md text-white font-black text-xs border border-white/40 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Configure ChatGPT and Gemini API Keys"
            >
              <Sliders className="w-4 h-4 text-amber-300" />
              <span>AI Settings</span>
              {(openAiApiKey || geminiApiKey) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={handlePrintAssemblySheet}
              className="px-4 py-2 rounded-xl bg-white text-pink-700 hover:bg-pink-50 font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Assembly List</span>
            </button>

            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Customize WhatsApp Wish Message"
            >
              <Settings2 className="w-4 h-4" />
              <span>Wish Template</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all border border-white/30 cursor-pointer"
              title="Refresh Birthdays"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Top KPI Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Today */}
        <div className="relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm border border-pink-100/80 hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-pink-600">Today's Birthdays</span>
            <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.todayCount}</p>
            {stats.todayCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black animate-pulse">
                Celebrate 🎉
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Celebrating today</p>
        </div>

        {/* Card 2: Tomorrow */}
        <div className="relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm border border-rose-100/80 hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600">Tomorrow</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.tomorrowCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Ready for tomorrow</p>
        </div>

        {/* Card 3: Next 7 Days */}
        <div className="relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm border border-amber-100/80 hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-600">This Week</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.upcomingWeekCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Next 7 days forecast</p>
        </div>

        {/* Card 4: This Month */}
        <div className="relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm border border-indigo-100/80 hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-indigo-600">This Month</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.monthCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">{MONTH_NAMES[new Date().getMonth()]}</p>
        </div>

        {/* Card 5: Total Registered */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 relative overflow-hidden rounded-[22px] bg-white p-4 shadow-sm border border-emerald-100/80 hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600">DOB Registered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.totalRegistered}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Active students with DOB</p>
        </div>
      </div>

      {/* ── 3. Class Filter & Tab Switcher Bar ── */}
      <div className="bg-white rounded-[22px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-white text-pink-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Today's Celebrations</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'today' ? 'bg-pink-100 text-pink-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.todayCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Upcoming Birthdays</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'upcoming' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {upcomingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer min-w-[150px]"
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
                        className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/20 to-rose-50/30 rounded-[26px] p-5 shadow-sm border-2 border-pink-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                      >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

                        {/* Top Banner Tag */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Today's Birthday! 🎂</span>
                          </span>
                          <span className="text-xs font-extrabold text-pink-700 bg-pink-100/80 px-2.5 py-0.5 rounded-lg border border-pink-200">
                            Turning {student.ageTurning} Years
                          </span>
                        </div>

                        {/* Student Details */}
                        <div className="flex items-center gap-4 mb-4">
                          <StudentBirthdayAvatar
                            photoUrl={student.photoUrl}
                            name={student.name}
                            sizeClass="w-16 h-16 rounded-2xl border-2 border-pink-300 shadow-sm"
                            badge="JY"
                            textSize="text-xl"
                          />

                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-black text-slate-900 leading-tight truncate">
                              {student.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
                                {student.className}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">
                                ID: {student.rollNo}
                              </span>
                            </div>
                            {student.bloodGroup && (
                              <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                Blood: {student.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Parent Info */}
                        <div className="bg-white/80 rounded-xl p-2.5 border border-pink-100/60 text-xs mb-4 space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] font-medium">Father / Mother:</span>
                            <span className="font-bold text-slate-800">{student.fatherName || student.motherName || 'Parent'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] font-medium">Mobile:</span>
                            <span className="font-bold text-slate-800">{student.phone || student.fatherPhone || student.motherPhone || 'Not Available'}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Wish WhatsApp & Download Poster */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pink-100">
                          {/* 1-Click WhatsApp Wish */}
                          <button
                            onClick={() => handleSendWish(student)}
                            className={`px-3 py-2.5 rounded-xl font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isWishSent
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-[#25D366] hover:bg-[#20ba59] text-white'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{isWishSent ? 'Wish Sent ✓' : 'Wish WhatsApp'}</span>
                          </button>

                          {/* Download Poster Button (Replaces Print Card) */}
                          <button
                            onClick={() => handleOpenPosterModal(student)}
                            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                          >
                            <Palette className="w-4 h-4 text-amber-300" />
                            <span>Download Poster</span>
                          </button>
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

                            <button
                              onClick={() => handleOpenPosterModal(student)}
                              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
                              title="Download Poster (9:16)"
                            >
                              <Palette className="w-3.5 h-3.5 text-indigo-600" />
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
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Roll No</th>
                      <th className="py-3 px-3">Date of Birth</th>
                      <th className="py-3 px-3">Turning Age</th>
                      <th className="py-3 px-3">Gender</th>
                      <th className="py-3 px-3">Parent Contact</th>
                      <th className="py-3 px-4 text-center">Action</th>
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
                              <button
                                onClick={() => handleOpenPosterModal(student)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                                title="Download Poster (9:16)"
                              >
                                <Palette className="w-4 h-4 text-indigo-600" />
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
      {/* ── MASTER 9:16 BIRTHDAY POSTER DESIGNER & DOWNLOADER MODAL ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedPosterStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col md:flex-row max-h-[92vh]">
            
            {/* Left Column: 9:16 Live Canvas Preview */}
            <div className="w-full md:w-[420px] bg-slate-900 p-4 sm:p-5 flex flex-col items-center justify-center overflow-y-auto shrink-0">
              <div className="text-center mb-2">
                <span className="px-3 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-black uppercase tracking-wider border border-pink-400/30">
                  9:16 WhatsApp Status Ratio
                </span>
              </div>

              {/* ── THE 9:16 POSTER CANVAS (EXACT MATCH TO USER'S IMAGE 2) ── */}
              <div
                ref={posterRef}
                className="w-[340px] h-[604px] rounded-2xl overflow-hidden relative shadow-2xl flex flex-col justify-between text-slate-800 select-none"
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
                {/* ── Top Header Section ── */}
                <div className="pt-3 px-3 text-center relative z-10">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    {/* Official School Logo (from /logo.png) */}
                    <div className="w-14 h-14 rounded-full bg-white p-0.5 shadow-md border border-amber-300 overflow-hidden shrink-0">
                      <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain" />
                    </div>

                    {/* School Name & Narasannapeta Banner */}
                    <div className="flex-1 text-center px-1">
                      <h2 className="text-[15px] font-black text-[#1E1B4B] tracking-tight leading-tight uppercase font-serif drop-shadow-xs">
                        SRI VENKATESWARA<br />JY SCHOOL
                      </h2>
                      <div className="inline-block mt-0.5 px-3 py-0.5 rounded-full bg-[#E11D48] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        NARASANNAPETA
                      </div>
                    </div>

                    {/* Right Schoolhouse Illustration */}
                    <div className="w-13 h-13 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col items-center justify-center text-center p-1 shadow-xs shrink-0">
                      <span className="text-xl leading-none">🏫</span>
                      <span className="text-[8px] font-black text-amber-800 uppercase leading-none mt-0.5">SCHOOL</span>
                    </div>
                  </div>

                  {/* 3D "Happy Birthday" Celebratory Banner */}
                  <div className="relative mt-2 mb-1">
                    <span className="absolute -top-2 left-4 text-xs">🦋</span>
                    <span className="absolute -top-1 right-5 text-xs">✨</span>
                    <div className="text-center">
                      <span className="block text-[32px] font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#DB2777] via-[#E11D48] to-[#EA580C] leading-none drop-shadow-[0_2px_4px_rgba(219,39,119,0.35)]"
                        style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                      >
                        Happy Birthday
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Middle Section: Student Photo & Badges ── */}
                <div className="px-3 flex items-center justify-between gap-2.5 my-auto relative z-10">
                  {/* Left: Student Studio Portrait with Uniform */}
                  <div className="relative w-38 h-48 rounded-2xl overflow-hidden shadow-xl border-3 border-white bg-slate-100 shrink-0">
                    <img
                      src={aiPortraitUrl || getPhotoUrl(selectedPosterStudent.photoUrl) || '/logo.png'}
                      alt={selectedPosterStudent.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                      className="w-full h-full object-cover object-top"
                    />
                    {aiPortraitUrl && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-pink-600/90 text-white text-[8px] font-black backdrop-blur-xs">
                        ✨ AI Studio
                      </span>
                    )}
                  </div>

                  {/* Right: Badges & Birth Details */}
                  <div className="flex-1 min-w-0 flex flex-col items-center text-center space-y-1.5">
                    {/* Student Name Banner */}
                    <div className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#831843] via-[#9D174D] to-[#831843] text-white shadow-md border border-amber-300">
                      <p className="text-[11px] font-black uppercase tracking-wider truncate leading-tight drop-shadow-xs">
                        # {selectedPosterStudent.name} ★
                      </p>
                    </div>

                    {/* Class Badge */}
                    <div className="w-full py-1 px-2 rounded-lg bg-[#15803D] text-white shadow-xs">
                      <p className="text-[11px] font-black leading-tight">
                        Class: {selectedPosterStudent.className}
                      </p>
                    </div>

                    {/* Cake & Date of Birth Card */}
                    <div className="w-full p-1.5 rounded-xl bg-white/95 border-2 border-pink-300 shadow-xs flex flex-col items-center">
                      <div className="text-lg leading-none">🎂</div>
                      <span className="text-[9px] font-black text-slate-500 uppercase mt-0.5">Date of Birth</span>
                      <span className="text-xs font-black text-[#E11D48] leading-tight">
                        {selectedPosterStudent.birthDay}{' '}
                        {MONTH_NAMES[selectedPosterStudent.birthMonth - 1]?.slice(0, 3)}{' '}
                        {selectedPosterStudent.birthYear}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Bottom Section: Blessings, Bouquet & Ribbon ── */}
                <div className="px-3 pb-3 text-center relative z-10 space-y-1.5">
                  {/* Blessing Quote */}
                  <div className="px-2">
                    <p className="text-[10px] font-extrabold text-[#1E293B] leading-tight">
                      May God bless you with good health, happiness and success in your life.
                    </p>
                    <p className="text-xs font-black text-[#DB2777] italic mt-0.5"
                      style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                    >
                      Have a Wonderful Birthday!
                    </p>
                  </div>

                  {/* Floral Bouquet & Gifts Row */}
                  <div className="flex items-center justify-between px-2 pt-0.5">
                    <div className="text-2xl leading-none" title="Rose Bouquet">💐</div>
                    <div className="text-xs font-bold text-amber-700">🎉 🌟 ✨</div>
                    <div className="text-2xl leading-none" title="Gift Box">🎁</div>
                  </div>

                  {/* Bottom Ribbon Banner: Best Wishes */}
                  <div className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#1E3A8A] text-white shadow-md border border-amber-300">
                    <p className="text-[9px] font-black text-amber-300 uppercase tracking-wider leading-tight">
                      Best Wishes from
                    </p>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider leading-tight mt-0.2">
                      ★ JY School Management & Staff ★
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls & AI Options */}
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-600" />
                      <span>9:16 Birthday Poster Designer</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Designed for {selectedPosterStudent.name} (Class {selectedPosterStudent.className})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPosterStudent(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2 mb-4">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Background Theme:</span>
                    <span className="text-[11px] text-pink-600 font-bold capitalize">{posterTheme} Theme</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'garden', label: 'Garden', color: 'from-emerald-300 to-green-100' },
                      { id: 'festive', label: 'Festive', color: 'from-pink-300 to-rose-100' },
                      { id: 'gold', label: 'Gold', color: 'from-amber-300 to-yellow-100' },
                      { id: 'royal', label: 'Royal', color: 'from-purple-300 to-violet-100' },
                      { id: 'sky', label: 'Sky', color: 'from-sky-300 to-blue-100' },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setPosterTheme(th.id as any)}
                        className={`h-11 rounded-xl bg-gradient-to-br ${th.color} border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                          posterTheme === th.id ? 'border-pink-600 scale-105 shadow-md' : 'border-white'
                        }`}
                      >
                        <span className="text-[10px] font-black text-slate-800">{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Student Uniform Portrait Generator Feature */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/80 border border-indigo-200/80 space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">AI Student Uniform Portrait</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Sweet smile, straight face in JY School uniform</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black">
                      {activeAiProvider.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ఒకవేళ స్టూడెంట్ ఫోటో సాధారణంగా ఉన్నా, AI ద్వారా స్కూల్ గ్రీన్ యూనిఫాం, టై మరియు చక్కని చిరునవ్వుతో కూడిన స్టూడియో ఫోటోను రూపొందించవచ్చు!
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleGenerateAiPortrait}
                      disabled={isGeneratingAi}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAi ? 'Generating Portrait...' : '✨ AI Generate Portrait in Uniform'}</span>
                    </button>

                    {aiPortraitUrl && (
                      <button
                        onClick={() => setAiPortraitUrl(null)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Reset to Original Student Photo"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* API Key Status Notice */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span>OpenAI / Gemini Status:</span>
                  </div>
                  {(openAiApiKey || geminiApiKey) ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Configured</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsAiSettingsOpen(true)}
                      className="text-pink-600 font-black hover:underline cursor-pointer"
                    >
                      Add API Key →
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Download 1080x1920 Poster */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleDownloadPosterImage}
                  disabled={isDownloadingPoster}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-95"
                >
                  <Download className={`w-4 h-4 ${isDownloadingPoster ? 'animate-bounce' : ''}`} />
                  <span>{isDownloadingPoster ? 'Downloading HD Poster...' : '📥 Download 9:16 Poster (1080x1920 HD)'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendWish(selectedPosterStudent)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Wish on WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedPosterStudent(null)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: AI SETTINGS (CHATGPT & GEMINI API KEYS) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isAiSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[26px] p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">AI Poster & Portrait Settings</h3>
                  <p className="text-xs text-slate-400 font-medium">Add your ChatGPT (OpenAI) and Gemini API Keys</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Preferred AI Model for Portraits:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAiProvider('openai')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeAiProvider === 'openai'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-black">ChatGPT / DALL-E 3</p>
                    <p className="text-[10px] text-slate-500">OpenAI Studio Quality</p>
                  </div>
                  {activeAiProvider === 'openai' && <Check className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAiProvider('gemini')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                    activeAiProvider === 'gemini'
                      ? 'border-pink-600 bg-pink-50/80 text-pink-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="font-black">Google Gemini Imagen</p>
                    <p className="text-[10px] text-slate-500">High Speed Imagen 3</p>
                  </div>
                  {activeAiProvider === 'gemini' && <Check className="w-4 h-4 text-pink-600" />}
                </button>
              </div>
            </div>

            {/* OpenAI API Key Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>ChatGPT (OpenAI) API Key:</span>
                <span className="text-[10px] text-slate-400">Starts with sk-...</span>
              </label>
              <input
                type="password"
                value={openAiApiKey}
                onChange={(e) => setOpenAiApiKey(e.target.value)}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Gemini API Key Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Google Gemini API Key:</span>
                <span className="text-[10px] text-slate-400">AI Studio Key</span>
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
              💡 ఈ API Keys మీ బ్రౌజర్‌లో సురక్షితంగా సేవ్ చేయబడతాయి. వీటిని ఉపయోగించి విద్యార్థుల ఫోటోలను స్కూల్ యూనిఫాంలో మరింత అందంగా రూపొందించవచ్చు.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAiSettingsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('jy_openai_api_key', openAiApiKey.trim());
                  localStorage.setItem('jy_gemini_api_key', geminiApiKey.trim());
                  localStorage.setItem('jy_birthday_ai_provider', activeAiProvider);
                  setIsAiSettingsOpen(false);
                  toast.success('AI API Keys saved successfully!');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Settings
              </button>
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
  );
};

export default StudentBirthdayPage;
