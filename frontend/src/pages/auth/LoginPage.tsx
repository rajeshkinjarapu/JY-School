import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { login as loginApi } from '../../api/auth';
import api from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Lock, User, ArrowRight,
  GraduationCap, Shield, Users, BookOpen, Award,
  CheckCircle2, MessageCircle, Bus, Sparkles,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Direct WhatsApp helpline link for Administrator (pre-filled JY School website message)
const ADMIN_WHATSAPP_NUMBER = '919502924437';
const ADMIN_WHATSAPP_MESSAGE = encodeURIComponent(
  'Hello JY School Administrator, I am contacting you from the JY School website login page. I need assistance with my ERP login account.'
);
const ADMIN_WHATSAPP_URL = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${ADMIN_WHATSAPP_MESSAGE}`;

const MODULE_CARDS = [
  {
    icon: Users,
    title: 'Student & Staff ERP',
    desc: 'Admissions, Attendance & Profiles',
    tint: 'bg-sky-400/20 text-sky-100 border-sky-300/30',
  },
  {
    icon: BookOpen,
    title: 'Academics & Reports',
    desc: 'Marks, Progress Cards & Certificates',
    tint: 'bg-indigo-400/20 text-indigo-100 border-indigo-300/30',
  },
  {
    icon: Award,
    title: 'Online Exams & Q-Bank',
    desc: 'CBT Tests, A4 Papers & OMR',
    tint: 'bg-amber-400/20 text-amber-100 border-amber-300/30',
  },
  {
    icon: Bus,
    title: 'Transport & Finance',
    desc: 'Routes, Fee Receipts & Alerts',
    tint: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30',
  },
];

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'GROUP_CHAIRMAN') {
        navigate('/chairman', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response: any = await loginApi(values);
      const accessToken =
        response?.accessToken ||
        response?.data?.accessToken ||
        response?.data?.data?.accessToken ||
        response?.token;

      const refreshToken =
        response?.refreshToken ||
        response?.data?.refreshToken ||
        response?.data?.data?.refreshToken;

      let authUser =
        response?.user ||
        response?.data?.user ||
        response?.data?.data?.user;

      if (accessToken) {
        if (!authUser) {
          try {
            const meRes: any = await api.get('/api/auth/me');
            authUser = meRes?.data?.data || meRes?.data || meRes;
          } catch (e) {
            console.warn('Failed to fetch user profile after login:', e);
          }
        }

        login(accessToken, refreshToken, authUser || { role: 'STUDENT', name: 'User' });
        toast.success(`Welcome back, ${authUser?.name || 'User'}!`);
        if (authUser?.role === 'GROUP_CHAIRMAN') {
          navigate('/chairman', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast.error(response?.message || 'Login response format error. Please try again.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 font-sans bg-[#F8FAFC] overflow-x-hidden">
      <style>{`
        @keyframes jyFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes jyFadeRight {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes jyFloatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .jy-anim-up { animation: jyFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .jy-anim-right { animation: jyFadeRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .jy-float { animation: jyFloatSlow 6s ease-in-out infinite; }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — Balanced Royal Blue Institutional Showcase
      ══════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-between relative p-8 xl:p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 45%, #4F46E5 100%)',
        }}
      >
        {/* Subtle decorative background accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-28 -left-28 w-96 h-96 rounded-full opacity-25 jy-float"
            style={{ background: 'radial-gradient(circle, #93C5FD, transparent 70%)' }}
          />
          <div
            className="absolute bottom-10 -right-24 w-96 h-96 rounded-full opacity-20 jy-float"
            style={{ background: 'radial-gradient(circle, #C4B5FD, transparent 70%)', animationDelay: '2s' }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.85) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
        </div>

        {/* Content container filling full panel width cleanly with zero dead space */}
        <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col justify-between h-full gap-6">
          {/* Top Brand Header */}
          <div className="flex items-center justify-between gap-4 jy-anim-right">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shrink-0">
                <img src="/logo.png" alt="JY School" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg tracking-tight leading-none">
                  SRI VENKATESWARA JY SCHOOL
                </h2>
                <p className="text-blue-100 text-[11px] font-bold tracking-widest uppercase mt-1">
                  School ERP &amp; Academic Portal
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-3.5 py-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-white text-[11px] font-bold tracking-wide">Live Portal</span>
            </div>
          </div>

          {/* Center Hero + 2x2 Feature Cards + 3-Stat Row */}
          <div className="space-y-6 my-auto">
            <div className="jy-anim-right" style={{ animationDelay: '0.08s' }}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-blue-50 text-[11px] font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Unified Smart Campus Platform
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-white leading-[1.15] tracking-tight">
                Empowering{' '}
                <span className="text-amber-300">Education</span>{' '}
                Excellence Every Day
              </h1>
              <p className="text-blue-100/90 text-sm xl:text-[15px] leading-relaxed mt-3 font-medium">
                A unified digital workspace for students, parents, faculty, and school administration to learn, track progress, and grow together.
              </p>
            </div>

            {/* 2x2 Module Cards Grid — fills full width cleanly */}
            <div className="grid grid-cols-2 gap-3.5 jy-anim-right" style={{ animationDelay: '0.16s' }}>
              {MODULE_CARDS.map(({ icon: Icon, title, desc, tint }) => (
                <div
                  key={title}
                  className="p-4 rounded-2xl bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/20 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-2.5 ${tint}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-white font-extrabold text-sm leading-tight">{title}</h3>
                  <p className="text-blue-100/80 text-xs font-medium mt-1 leading-snug">{desc}</p>
                </div>
              ))}
            </div>

            {/* 3-Column Stats Bar */}
            <div className="grid grid-cols-3 gap-3.5 jy-anim-right" style={{ animationDelay: '0.24s' }}>
              {[
                { value: '500+', label: 'Active Students' },
                { value: '34+', label: 'Expert Faculty' },
                { value: '24+', label: 'Smart Classes' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="px-4 py-3 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 text-center"
                >
                  <div className="text-white font-black text-2xl leading-none">{value}</div>
                  <div className="text-blue-100/85 text-[11px] font-semibold mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quote Bar */}
          <div className="border-t border-white/20 pt-4 flex items-center justify-between gap-4 jy-anim-right" style={{ animationDelay: '0.32s' }}>
            <p className="text-blue-100/85 text-xs font-medium italic">
              &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
            </p>
            <span className="text-[11px] font-bold text-blue-100 bg-white/15 px-3 py-1 rounded-full border border-white/20 shrink-0">
              AY 2026–27
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — Bright Light Theme Login Card
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center relative px-5 sm:px-8 py-8 bg-gradient-to-br from-[#F8FAFF] via-[#F1F5FF] to-[#EEF2FF] overflow-hidden">
        {/* Soft pastel orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-36 -right-36 w-80 h-80 rounded-full opacity-60"
            style={{ background: 'radial-gradient(circle, #DBEAFE, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-36 -left-24 w-80 h-80 rounded-full opacity-60"
            style={{ background: 'radial-gradient(circle, #E0E7FF, transparent 70%)' }}
          />
        </div>

        {/* Mobile Brand Header (strictly hidden on desktop) */}
        <div className="flex lg:hidden items-center gap-3 mb-6 relative z-10 jy-anim-up">
          <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 shadow-md p-1.5 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="JY School" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-slate-800 font-black text-lg leading-tight">JY SCHOOL</h2>
            <p className="text-slate-500 text-xs font-semibold">School ERP Portal</p>
          </div>
        </div>

        {/* Centered Login Card */}
        <div className="w-full max-w-[430px] relative z-10 jy-anim-up">
          <div className="bg-white rounded-3xl border border-indigo-100/90 shadow-[0_24px_60px_-15px_rgba(37,99,235,0.14)] overflow-hidden">
            {/* Top vibrant accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

            <div className="p-7 sm:p-8">
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3.5 transition-transform duration-300 hover:scale-105">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                  Sign in to access your JY School ERP dashboard
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Username or Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wider uppercase">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your username or email"
                      className={`w-full box-border pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 border ${
                        errors.email
                          ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'
                      }`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1.5 ml-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wider uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`w-full box-border pl-10 pr-11 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 border ${
                        errors.password
                          ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'
                      }`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-rose-500 text-[11px] font-semibold mt-1.5 ml-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me + Forgot Password */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-600">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl text-white font-black text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Secure Access
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-5 mb-5">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold">SSL Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold">Verified System</span>
                </div>
              </div>

              {/* Direct WhatsApp Contact Administrator */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-2.5">
                <p className="text-slate-500 text-xs font-medium">
                  Having trouble logging in?
                </p>
                <a
                  href={ADMIN_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Contact Administrator (WhatsApp)</span>
                </a>
                <p className="text-[11px] text-slate-400 font-medium pt-1">
                  &copy; {new Date().getFullYear()} Sri Venkateswara JY School. All rights reserved.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 font-medium mt-4">
            Protected by JY School Security System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
