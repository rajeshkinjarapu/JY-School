import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Cake, Sparkles, Calendar, Search, Filter, Phone, MessageCircle,
  Printer, Download, RefreshCw, ChevronLeft, ChevronRight,
  PartyPopper, Gift, Award, Star, Clock, User, Heart, Share2,
  CheckCircle2, AlertCircle, Eye, Settings2, X
} from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

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

export const StudentBirthdayPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'calendar' | 'directory'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [upcomingDaysFilter, setUpcomingDaysFilter] = useState<number>(7);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [directoryMonth, setDirectoryMonth] = useState<string>('all');
  const [directoryGender, setDirectoryGender] = useState<string>('all');

  // Modals state
  const [printCardStudent, setPrintCardStudent] = useState<StudentBirthday | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ day: number; month: number; students: StudentBirthday[] } | null>(null);

  // Default WhatsApp wish message template
  const defaultTemplate = `🎉 *Dear {name}*,\n\nWishing you a very *Happy Birthday!* 🎂✨\nMay God bless you with good health, immense happiness, and great success in all your studies.\n\nWarm wishes & blessings,\n*Management, Principal & Teachers*\n*Sri Venkateswara JY School* 🌟`;
  const [wishTemplate, setWishTemplate] = useState<string>(() => {
    return localStorage.getItem('jy_bday_wish_template') || defaultTemplate;
  });

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

    // Mark as sent
    setSentWishes(prev => {
      const updated = { ...prev, [student.id]: true };
      sessionStorage.setItem('jy_sent_bday_wishes', JSON.stringify(updated));
      return updated;
    });
    toast.success(`WhatsApp opened for ${student.name}`);
  };

  // Filtered upcoming list based on 7, 14, 30 days
  const filteredUpcoming = useMemo(() => {
    return upcomingList.filter(s => (s.daysLeft || 0) <= upcomingDaysFilter);
  }, [upcomingList, upcomingDaysFilter]);

  // Calendar Day Map for active month
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

  // Printable Birthday Greeting Card Trigger
  const handlePrintCard = (student: StudentBirthday) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Birthday Wish Card - ${student.name}</title>
          <style>
            @page { size: A5 landscape; margin: 0; }
            body {
              margin: 0; padding: 0; background: #fff;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex; justify-content: center; align-items: center; min-height: 100vh;
            }
            .card-container {
              width: 190mm; height: 130mm; border: 10px solid #fbcfe8;
              border-radius: 20px; padding: 25px 30px; box-sizing: border-box;
              background: linear-gradient(135deg, #fff5f7 0%, #ffffff 50%, #eff6ff 100%);
              position: relative; overflow: hidden; text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .top-bar { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 12px; }
            .school-name { font-size: 20px; font-weight: 900; color: #4338ca; text-transform: uppercase; letter-spacing: 1px; }
            .badge-title { font-size: 28px; font-weight: 900; color: #db2777; margin: 10px 0 5px 0; letter-spacing: 0.5px; }
            .student-name { font-size: 26px; font-weight: 900; color: #1e1b4b; margin: 10px 0; border-bottom: 3px solid #f472b6; display: inline-block; padding-bottom: 4px; }
            .details { font-size: 15px; font-weight: 700; color: #475569; margin-bottom: 12px; }
            .message { font-size: 13px; line-height: 1.6; color: #334155; font-style: italic; max-width: 520px; margin: 0 auto 20px auto; }
            .signatures { display: flex; justify-content: space-between; padding: 0 40px; margin-top: 25px; font-size: 12px; font-weight: bold; color: #64748b; }
            .confetti { position: absolute; font-size: 32px; opacity: 0.7; }
          </style>
        </head>
        <body>
          <div class="card-container">
            <div class="confetti" style="top: 15px; left: 20px;">🎈</div>
            <div class="confetti" style="top: 15px; right: 20px;">✨</div>
            <div class="confetti" style="bottom: 20px; left: 25px;">🎂</div>
            <div class="confetti" style="bottom: 20px; right: 25px;">🎁</div>

            <div class="top-bar">
              <div class="school-name">Sri Venkateswara JY School</div>
            </div>

            <div class="badge-title">🎉 HAPPY BIRTHDAY! 🎂</div>
            <div class="student-name">${student.name}</div>
            <div class="details">Class: ${student.className} &nbsp;|&nbsp; Roll No: ${student.rollNo} &nbsp;|&nbsp; Turning ${student.ageTurning} Years</div>

            <div class="message">
              "Wishing you a glorious birthday filled with infinite joy, happiness, and extraordinary wisdom. 
              May you achieve flying colors in all your studies and shine as a bright star for our school and nation!"
            </div>

            <div class="signatures">
              <div>Date: ${todayStr}</div>
              <div>Class Teacher</div>
              <div>Principal</div>
            </div>
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
                Honor students in morning assembly, send instant WhatsApp blessings & print greeting cards
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-pink-300 shadow-sm shrink-0 flex items-center justify-center">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-pink-600">
                                {student.name.charAt(0)}
                              </span>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-pink-600/90 text-white text-[9px] font-black text-center py-0.2">
                              JY
                            </div>
                          </div>

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

                        {/* Action Buttons */}
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

                          {/* Print Birthday Greeting Card */}
                          <button
                            onClick={() => handlePrintCard(student)}
                            className="px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs border border-indigo-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Print Card</span>
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
                          <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-200 overflow-hidden flex items-center justify-center shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-indigo-600">
                                {student.name.charAt(0)}
                              </span>
                            )}
                          </div>
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

                          <button
                            onClick={() => handleSendWish(student)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Send Early WhatsApp Wish"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
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
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                {student.photoUrl ? (
                                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-indigo-600">
                                    {student.name.charAt(0)}
                                  </span>
                                )}
                              </div>
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
                                onClick={() => handlePrintCard(student)}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                                title="Print Birthday Card"
                              >
                                <Printer className="w-4 h-4 text-indigo-600" />
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

      {/* ── Modal 1: Date Specific Popup for Calendar ── */}
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
                      onClick={() => handlePrintCard(st)}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer"
                      title="Print Card"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Wish Template Customizer ── */}
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
    </div>
  );
};

export default StudentBirthdayPage;
