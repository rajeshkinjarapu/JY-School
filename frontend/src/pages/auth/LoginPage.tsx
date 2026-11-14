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
  GraduationCap, Shield, Users, BookOpen, Award, ChevronRight, CheckCircle2
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
    <div className="min-h-screen w-full flex font-sans overflow-hidden">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Brand Showcase (60% width)
      ══════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[58%] xl:w-[60%] relative flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 35%, #312E81 60%, #1D4ED8 100%)',
        }}
      >
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
          />
          <div
            className="absolute top-1/3 -right-20 w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #818CF8, transparent 70%)' }}
          />

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Top Logo Bar */}
        <div className="relative z-10 flex items-center gap-3 p-8 pb-0">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-2 flex items-center justify-center shadow-lg">
            <img src="/logo.png" alt="JY School" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight leading-none">JY SCHOOL</h2>
            <p className="text-indigo-300 text-xs font-semibold tracking-widest mt-0.5">MANAGEMENT SYSTEM</p>
          </div>
        </div>

        {/* Center Brand Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-14 py-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 w-fit mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold tracking-wide">School Management Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            Empowering
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #60A5FA, #A78BFA, #F472B6)' }}
            >
              Education
            </span>
            <br />
            Excellence
          </h1>

          <p className="text-indigo-200/80 text-base leading-relaxed max-w-sm mb-10 font-medium">
            A unified platform for students, teachers, and administrators to collaborate, learn, and grow together.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-3 max-w-sm mb-10">
            {[
              { icon: Users, label: 'Student & Staff Management', color: '#60A5FA' },
              { icon: BookOpen, label: 'Academic Performance Tracking', color: '#A78BFA' },
              { icon: Award, label: 'Exams, Results & Progress Cards', color: '#F472B6' },
              { icon: Shield, label: 'Secure & Role-Based Access', color: '#34D399' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-white/70 text-sm font-medium group-hover:text-white/90 transition-colors">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
              </div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            {[
              { value: '500+', label: 'Students' },
              { value: '34', label: 'Teachers' },
              { value: '24', label: 'Classes' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-white font-black text-2xl">{value}</div>
                <div className="text-indigo-300/70 text-xs font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Quote Bar */}
        <div className="relative z-10 p-8 pt-0">
          <div className="border-t border-white/10 pt-6">
            <p className="text-indigo-300/60 text-sm font-medium italic">
              "Education is the most powerful weapon which you can use to change the world."
            </p>
            <p className="text-indigo-400/50 text-xs font-semibold mt-1">— Nelson Mandela</p>
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════
          RIGHT PANEL — Login Form
      ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#F8FAFF] px-6 sm:px-10">

        {/* Subtle Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #EEF2FF, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #F0F9FF, transparent 70%)' }}
          />
        </div>

        {/* Mobile Logo — shown only on small screens */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl shadow-md border border-slate-100 p-1.5 flex items-center justify-center bg-white">
            <img src="/logo.png" alt="JY School" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-xl">JY SCHOOL</h2>
            <p className="text-slate-400 text-xs font-semibold">Management System</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="relative w-full max-w-[420px] z-10">

          {/* Card */}
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden"
            style={{ boxShadow: '0 25px 60px -10px rgba(79,70,229,0.12), 0 10px 20px -8px rgba(0,0,0,0.08)' }}
          >

            {/* Card Header Gradient Bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #2563EB, #6366F1, #A855F7)' }}
            />

            <div className="p-8">

              {/* Icon + Title */}
              <div className="flex flex-col items-center mb-8">
                <div
                  className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
                >
                  <GraduationCap className="w-8 h-8 text-white drop-shadow" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Sign in to your JY School account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide uppercase">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your username or email"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all border ${
                        errors.email
                          ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                      }`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-[11px] font-semibold mt-1.5 ml-1 flex items-center gap-1">
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all border ${
                        errors.password
                          ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                      }`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[11px] font-semibold mt-1.5 ml-1 flex items-center gap-1">
                      <span>⚠</span> {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-600">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl text-white font-black text-sm relative overflow-hidden group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #9333EA 100%)',
                    boxShadow: '0 8px 20px -4px rgba(99,102,241,0.5)',
                  }}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 50%, #7E22CE 100%)' }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
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
                        <ArrowRight className="w-4 h-4" />
                        Sign In to Dashboard
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Secure Login
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 mb-5">
                {[
                  { icon: Shield, label: 'SSL Secured' },
                  { icon: CheckCircle2, label: 'Verified System' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-slate-400">
                    <Icon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold">{label}</span>
                  </div>
                ))}
              </div>

              {/* Footer Links */}
              <div className="text-center space-y-1.5">
                <p className="text-slate-400 text-xs font-medium">
                  Having trouble?{' '}
                  <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                    Contact Administrator
                  </Link>
                </p>
                <p className="text-[11px] text-slate-300 font-medium">
                  © {new Date().getFullYear()} JY Education. All rights reserved.
                </p>
              </div>
            </div>
          </div>

          {/* Below-card hint */}
          <p className="text-center text-xs text-slate-400 font-medium mt-5">
            Protected by JY School Security System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
