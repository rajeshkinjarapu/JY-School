import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { login as loginApi } from '../../api/auth';
import api from '../../api/axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Lock, User, ArrowRight,
  GraduationCap, TrendingUp, Trophy
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

      let user =
        response?.user ||
        response?.data?.user ||
        response?.data?.data?.user;

      if (accessToken) {
        if (!user) {
          try {
            const meRes: any = await api.get('/api/auth/me');
            user = meRes?.data?.data || meRes?.data || meRes;
          } catch (e) {
            console.warn('Failed to fetch user profile after login:', e);
          }
        }

        login(accessToken, refreshToken, user || { role: 'STUDENT', name: 'User' });
        toast.success(`Welcome back, ${user?.name || 'User'}!`);
        navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen w-full relative overflow-hidden bg-[#F8FAFC] flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── BACKGROUND WAVES & DECORATIVE GRAPHICS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top-Right Dotted Matrix Grid */}
        <svg
          className="absolute top-8 left-[38%] w-64 h-36 opacity-30 text-blue-400"
          fill="currentColor"
        >
          <pattern id="dotPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>

        {/* Large Sweeping Ocean Blue Wave on Right */}
        <svg
          className="absolute -right-16 top-0 h-full w-[62%] min-w-[500px]"
          viewBox="0 0 700 800"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 280 0 C 180 220, 210 480, 0 800 L 700 800 L 700 0 Z"
            fill="url(#blueWaveGrad)"
          />
          <defs>
            <linearGradient id="blueWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#2563EB" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.98" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layered Purple Wave on Bottom Right */}
        <svg
          className="absolute right-0 bottom-0 h-[65%] w-[52%] min-w-[420px]"
          viewBox="0 0 600 500"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 110 500 C 230 330, 340 220, 600 170 L 600 500 Z"
            fill="url(#purpleWaveGrad)"
            opacity="0.88"
          />
          <defs>
            <linearGradient id="purpleWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Flow Wave reaching towards left */}
        <svg
          className="absolute left-0 bottom-0 w-full h-32 sm:h-40"
          viewBox="0 0 1200 120"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 75 C 320 20, 640 100, 1200 45 L 1200 120 L 0 120 Z"
            fill="url(#bottomGrad)"
            opacity="0.9"
          />
          <defs>
            <linearGradient id="bottomGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="45%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Line-Art Open Book on the Blue Wave */}
        <div className="hidden lg:block absolute top-[42%] right-10 text-white/20 transform rotate-12">
          <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>

        {/* Top-Left Green Leafy Branch Decor */}
        <div className="absolute -top-3 -left-3 w-36 sm:w-48 h-36 sm:h-48 pointer-events-none opacity-85">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <path d="M0 0 Q 30 25 60 12 Q 85 5 100 22" stroke="#15803d" strokeWidth="2.5" fill="none" />
            <ellipse cx="25" cy="20" rx="11" ry="5.5" transform="rotate(28 25 20)" fill="#22c55e" opacity="0.9" />
            <ellipse cx="46" cy="15" rx="13" ry="6" transform="rotate(-14 46 15)" fill="#16a34a" opacity="0.95" />
            <ellipse cx="68" cy="13" rx="12" ry="5.5" transform="rotate(22 68 13)" fill="#4ade80" opacity="0.85" />
            <ellipse cx="88" cy="17" rx="10" ry="4.5" transform="rotate(-18 88 17)" fill="#15803d" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* ── TOP RIGHT SLOGAN ── */}
      <div className="hidden sm:block absolute top-6 right-8 lg:right-16 z-20">
        <span className="font-serif italic text-base lg:text-[17px] font-bold text-[#1E50D8] tracking-tight">
          Education for a Better Tomorrow
        </span>
      </div>

      {/* ── MAIN CONTENT (SPLIT LAYOUT) ── */}
      <main className="relative z-10 flex-1 flex items-center max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* ════════════ LEFT SHOWCASE (SCHOOL BRANDING & 3D ART) ════════════ */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top Brand Seal & School Title */}
            <div className="flex items-center gap-3.5 mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 shadow-md border border-slate-100 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="JY School Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight leading-none">
                  JY SCHOOL
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500 tracking-wider mt-1">
                  Learn • Grow • Excel
                </p>
              </div>
            </div>

            {/* Hero Heading with Curved Smile Underline */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E293B] leading-tight">
                Welcome to
              </h1>
              <div className="relative inline-block mt-1">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                  JY SCHOOL
                </span>
                {/* Curved Orange/Gold Swoosh */}
                <svg
                  className="absolute -bottom-2.5 left-0 w-full h-4 text-[#F59E0B]"
                  viewBox="0 0 300 20"
                  fill="none"
                >
                  <path
                    d="M 6 12 Q 150 24 294 8"
                    stroke="#F59E0B"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm sm:text-base font-semibold italic text-slate-600 mt-4 tracking-wide">
                Building Bright Futures Together
              </p>
            </div>

            {/* Three Value Pillars: Learn, Grow, Excel */}
            <div className="flex items-center gap-4 sm:gap-6 my-4 py-2">
              {/* Learn */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">Learn</span>
              </div>

              <div className="w-px h-6 bg-slate-300" />

              {/* Grow */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">Grow</span>
              </div>

              <div className="w-px h-6 bg-slate-300" />

              {/* Excel */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-sm">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">Excel</span>
              </div>
            </div>

            {/* Campus Showcase Scene (Building + 3D Cap, Books, Pencil Cup) */}
            <div className="relative w-full max-w-xl h-60 sm:h-72 lg:h-80 rounded-2xl overflow-hidden mt-3 shadow-md border border-slate-100 group">
              <img
                src="/login-campus-showcase.svg"
                alt="JY School Campus"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            </div>
          </div>

          {/* ════════════ RIGHT FLOATING LOGIN CARD ════════════ */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] lg:max-w-[430px] pt-8">
              
              {/* Floating Purple Circle Badge on Top Center */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] p-1.5 shadow-xl border-4 border-white flex items-center justify-center">
                <div className="w-full h-full rounded-full flex items-center justify-center text-white">
                  <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" />
                </div>
              </div>

              {/* Main White Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 pt-12 shadow-2xl border border-white/80">
                {/* Header */}
                <div className="text-center mb-6 pt-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Student / Staff Login
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                    Please sign in to your account
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Username or Email */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Username or Email</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        className={`w-full pl-11 pr-4 py-3 bg-[#F1F4FA] focus:bg-white rounded-full text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 border border-transparent focus:border-indigo-500 outline-none transition-all shadow-inner ${
                          errors.email ? 'border-red-400 focus:border-red-500' : ''
                        }`}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 ml-3">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Password</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`w-full pl-11 pr-11 py-3 bg-[#F1F4FA] focus:bg-white rounded-full text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 border border-transparent focus:border-indigo-500 outline-none transition-all shadow-inner ${
                          errors.password ? 'border-red-400 focus:border-red-500' : ''
                        }`}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 ml-3">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-600">Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-bold text-[#7C3AED] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#2563EB] to-[#9333EA] hover:from-[#1D4ED8] hover:to-[#7E22CE] text-white font-black text-sm sm:text-base shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Signing In...'
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-bold text-slate-400">OR</span>
                  </div>
                </div>

                {/* Contact Admin & Copyright */}
                <div className="text-center text-xs">
                  <p className="text-slate-500 font-medium">
                    Having trouble logging in?{' '}
                    <Link to="/register" className="font-bold text-[#7C3AED] hover:underline">
                      Contact Administrator
                    </Link>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-2">
                    &copy; {new Date().getFullYear()} JY Education. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LoginPage;
