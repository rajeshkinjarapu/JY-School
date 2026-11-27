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
  CheckCircle2, MessageCircle, Sparkles,
} from 'lucide-react';

/* ─── Validation Schema ─── */
const loginSchema = z.object({
  email: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/* ─── WhatsApp contact config ─── */
const ADMIN_WHATSAPP = '919502924437';
const WHATSAPP_MSG   = encodeURIComponent(
  'Hello! I am contacting from JY School website. I need help with ERP login access.'
);
const WHATSAPP_URL   = `https://wa.me/${ADMIN_WHATSAPP}?text=${WHATSAPP_MSG}`;

/* ─── Feature list ─── */
const FEATURES = [
  { icon: Users,    label: 'Student & Staff Management',    color: '#60A5FA' },
  { icon: BookOpen, label: 'Academic Performance Tracking', color: '#A78BFA' },
  { icon: Award,    label: 'Exams, Results & Progress Cards', color: '#F472B6' },
  { icon: Shield,   label: 'Secure & Role-Based Access',    color: '#34D399' },
];

/* ─── Floating particle positions (deterministic, no random on render) ─── */
const PARTICLES = [
  { w: 6,  h: 6,  top: '12%',  left: '8%',  dur: 4,  del: 0 },
  { w: 4,  h: 4,  top: '28%',  left: '18%', dur: 6,  del: 1 },
  { w: 8,  h: 8,  top: '55%',  left: '5%',  dur: 5,  del: 2 },
  { w: 5,  h: 5,  top: '72%',  left: '22%', dur: 7,  del: 0.5 },
  { w: 10, h: 10, top: '88%',  left: '12%', dur: 4.5,del: 1.5 },
  { w: 4,  h: 4,  top: '40%',  left: '45%', dur: 6,  del: 2.5 },
  { w: 6,  h: 6,  top: '20%',  left: '55%', dur: 5,  del: 3 },
  { w: 7,  h: 7,  top: '65%',  left: '48%', dur: 4,  del: 1 },
];

/* ══════════════════════════════════════════════════════════════
   LOGIN PAGE COMPONENT
══════════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword]   = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [mounted, setMounted]             = useState(false);
  const [focusedField, setFocusedField]   = useState<string | null>(null);

  /* mount animation trigger */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  /* redirect if already logged in */
  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'GROUP_CHAIRMAN' ? '/chairman' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response: any = await loginApi(values);
      const accessToken =
        response?.accessToken || response?.data?.accessToken ||
        response?.data?.data?.accessToken || response?.token;
      const refreshToken =
        response?.refreshToken || response?.data?.refreshToken ||
        response?.data?.data?.refreshToken;
      let authUser =
        response?.user || response?.data?.user || response?.data?.data?.user;

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
        navigate(authUser?.role === 'GROUP_CHAIRMAN' ? '/chairman' : '/dashboard', { replace: true });
      } else {
        toast.error(response?.message || 'Login response format error. Please try again.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message ||
        'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── keyframe styles injected once ─── */
  const inlineStyles = `
    @keyframes float-up {
      0%,100% { transform: translateY(0px) scale(1);   opacity: 0.4; }
      50%      { transform: translateY(-18px) scale(1.1); opacity: 0.7; }
    }
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slide-in-left {
      from { opacity: 0; transform: translateX(-40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes glow-pulse {
      0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
      50%      { box-shadow: 0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.2); }
    }
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position: 200% center; }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes bounce-in {
      0%   { transform: scale(0.3); opacity: 0; }
      60%  { transform: scale(1.05); }
      80%  { transform: scale(0.95); }
      100% { transform: scale(1); opacity: 1; }
    }
    .anim-slide-up  { animation: slide-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
    .anim-slide-left{ animation: slide-in-left 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
    .anim-fade      { animation: fade-in 0.5s ease forwards; }
    .anim-bounce    { animation: bounce-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
    .btn-hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .btn-hover-lift:hover { transform: translateY(-2px); }
    .btn-hover-lift:active { transform: translateY(0) scale(0.98); }
    .input-field {
      width: 100%; padding: 13px 16px 13px 44px;
      border-radius: 14px; font-size: 14px; font-weight: 500;
      color: #1e293b; background: #f8faff;
      border: 1.5px solid #e2e8f0;
      outline: none; transition: all 0.25s ease;
    }
    .input-field:focus {
      background: #fff; border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .input-field.error {
      background: #fff5f5; border-color: #fc8181;
      box-shadow: 0 0 0 3px rgba(252,129,129,0.12);
    }
    .feature-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04); backdrop-filter: blur(4px);
      transition: all 0.25s ease; cursor: default;
    }
    .feature-row:hover {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.14);
      transform: translateX(4px);
    }
    .orb { position: absolute; border-radius: 50%; pointer-events: none; }
    .wa-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-weight: 700; font-size: 12px; color: #25D366;
      text-decoration: none; padding: 4px 10px 4px 6px;
      border-radius: 20px; border: 1px solid #25D36630;
      background: #25D36610; transition: all 0.2s ease;
    }
    .wa-btn:hover { background: #25D36620; border-color: #25D36660; transform: scale(1.03); }
  `;

  return (
    <>
      <style>{inlineStyles}</style>

      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter','Poppins',sans-serif", overflow: 'hidden' }}>

        {/* ════════════════════════════════════════
            LEFT PANEL — Brand Showcase
        ════════════════════════════════════════ */}
        <div
          className="hidden lg:flex"
          style={{
            width: '58%', flexDirection: 'column', position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #0A0F2E 0%, #0F1B4D 25%, #1A1060 50%, #0D2F7A 75%, #1142A6 100%)',
          }}
        >
          {/* Background Orbs */}
          <div className="orb" style={{ width: 480, height: 480, top: -120, left: -120, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />
          <div className="orb" style={{ width: 350, height: 350, top: '40%', right: -80, background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' }} />
          <div className="orb" style={{ width: 300, height: 300, bottom: -60, left: '30%', background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)' }} />
          <div className="orb" style={{ width: 200, height: 200, top: '60%', left: '10%', background: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 70%)' }} />

          {/* Subtle Grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '52px 52px',
          }} />

          {/* Floating Particles */}
          {PARTICLES.map((p, i) => (
            <div key={i} style={{
              position: 'absolute', width: p.w, height: p.h,
              top: p.top, left: p.left, borderRadius: '50%',
              background: 'rgba(255,255,255,0.35)',
              animation: `float-up ${p.dur}s ${p.del}s ease-in-out infinite`,
            }} />
          ))}

          {/* Rotating Ring */}
          <div style={{
            position: 'absolute', top: '15%', right: '12%',
            width: 140, height: 140, opacity: 0.12,
            border: '1px dashed rgba(255,255,255,0.6)',
            borderRadius: '50%', animation: 'spin-slow 20s linear infinite',
          }} />
          <div style={{
            position: 'absolute', top: '15%', right: '12%',
            width: 100, height: 100, margin: 20, opacity: 0.1,
            border: '1px dashed rgba(255,255,255,0.4)',
            borderRadius: '50%', animation: 'spin-slow 14s linear infinite reverse',
          }} />

          {/* Top Logo */}
          <div
            className="anim-slide-left"
            style={{
              position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
              gap: 14, padding: '32px 44px 0',
              opacity: mounted ? undefined : 0,
              animationDelay: '0.1s',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 16, overflow: 'hidden',
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.22)',
              padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <img src="/logo.png" alt="JY School" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em' }}>JY SCHOOL</div>
              <div style={{ color: '#93C5FD', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', marginTop: 2 }}>MANAGEMENT SYSTEM</div>
            </div>
          </div>

          {/* Center Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 44px', position: 'relative', zIndex: 10 }}>

            {/* Live Badge */}
            <div
              className="anim-slide-left"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
                padding: '7px 16px', width: 'fit-content', marginBottom: 28,
                opacity: mounted ? undefined : 0, animationDelay: '0.15s',
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', animation: 'float-up 2s ease-in-out infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>School Management Platform</span>
            </div>

            {/* Headline */}
            <div
              className="anim-slide-left"
              style={{ opacity: mounted ? undefined : 0, animationDelay: '0.2s', marginBottom: 20 }}
            >
              <h1 style={{ fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 }}>
                Empowering
              </h1>
              <h1 style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 }}>
                <span style={{
                  background: 'linear-gradient(90deg, #60A5FA 0%, #A78BFA 40%, #F472B6 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  animation: 'shimmer 4s linear infinite',
                }}>
                  Education
                </span>
              </h1>
              <h1 style={{ fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0 }}>
                Excellence
              </h1>
            </div>

            <p
              className="anim-slide-left"
              style={{
                color: 'rgba(165,180,252,0.8)', fontSize: 15, lineHeight: 1.75,
                maxWidth: 360, marginBottom: 36,
                opacity: mounted ? undefined : 0, animationDelay: '0.25s',
              }}
            >
              A unified platform for students, teachers, and administrators to collaborate, learn, and grow together.
            </p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, marginBottom: 40 }}>
              {FEATURES.map(({ icon: Icon, label, color }, i) => (
                <div
                  key={label}
                  className="feature-row anim-slide-left"
                  style={{ opacity: mounted ? undefined : 0, animationDelay: `${0.3 + i * 0.08}s` }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${color}1A`, border: `1px solid ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 16, height: 16, color }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: 500, flex: 1 }}>{label}</span>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>›</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div
              className="anim-slide-left"
              style={{
                display: 'flex', gap: 36,
                opacity: mounted ? undefined : 0, animationDelay: '0.65s',
              }}
            >
              {[{ v: '500+', l: 'Students' }, { v: '34', l: 'Teachers' }, { v: '24', l: 'Classes' }].map(({ v, l }) => (
                <div key={l}>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.02em' }}>{v}</div>
                  <div style={{ color: 'rgba(147,197,253,0.65)', fontSize: 11, fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quote */}
          <div style={{ position: 'relative', zIndex: 10, padding: '0 44px 32px' }}>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
              <p style={{ color: 'rgba(165,180,252,0.5)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <p style={{ color: 'rgba(147,197,253,0.4)', fontSize: 11, fontWeight: 700, marginTop: 6 }}>— Nelson Mandela</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT PANEL — Login Form
        ════════════════════════════════════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #F0F4FF 0%, #F8FAFF 40%, #EEF2FF 100%)',
          padding: '24px 24px',
          position: 'relative', overflow: 'hidden',
        }}>

          {/* Subtle BG Orbs */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -120, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, #EEF2FF, transparent 70%)', opacity: 0.7 }} />
            <div style={{ position: 'absolute', bottom: -80, left: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, #EDE9FE, transparent 70%)', opacity: 0.6 }} />
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="JY School" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#0f172a', fontWeight: 900, fontSize: 20 }}>JY SCHOOL</div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>Management System</div>
            </div>
          </div>

          {/* Login Card */}
          <div
            className="anim-slide-up"
            style={{
              width: '100%', maxWidth: 420, position: 'relative', zIndex: 10,
              opacity: mounted ? undefined : 0, animationDelay: '0.15s',
            }}
          >
            {/* Card */}
            <div style={{
              background: '#fff', borderRadius: 28,
              boxShadow: '0 32px 72px -12px rgba(79,70,229,0.14), 0 12px 28px -8px rgba(0,0,0,0.07)',
              border: '1px solid rgba(226,232,240,0.7)',
              overflow: 'hidden',
            }}>

              {/* Top gradient bar */}
              <div style={{ height: 4, background: 'linear-gradient(90deg, #2563EB 0%, #6366F1 40%, #A855F7 70%, #EC4899 100%)' }} />

              <div style={{ padding: '36px 36px 32px' }}>

                {/* Icon + Title */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                  <div
                    className="anim-bounce"
                    style={{
                      width: 72, height: 72, borderRadius: 22,
                      background: 'linear-gradient(145deg, #2563EB, #7C3AED)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 12px 32px rgba(99,102,241,0.4)',
                      marginBottom: 18, animation: `glow-pulse 3s ease-in-out infinite`,
                      opacity: mounted ? undefined : 0, animationDelay: '0.3s',
                    }}
                  >
                    <GraduationCap style={{ width: 34, height: 34, color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Sparkles style={{ width: 14, height: 14, color: '#6366F1' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Welcome Back</h2>
                    <Sparkles style={{ width: 14, height: 14, color: '#6366F1' }} />
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, margin: 0 }}>Sign in to your JY School account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Username Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Username or Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        transition: 'color 0.2s',
                        color: focusedField === 'email' ? '#6366F1' : '#94a3b8',
                      }}>
                        <User style={{ width: 16, height: 16 }} />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter your username or email"
                        className={`input-field${errors.email ? ' error' : ''}`}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginTop: 6, marginLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⚠</span> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                        transition: 'color 0.2s',
                        color: focusedField === 'password' ? '#6366F1' : '#94a3b8',
                      }}>
                        <Lock style={{ width: 16, height: 16 }} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`input-field${errors.password ? ' error' : ''}`}
                        style={{ paddingRight: 44 }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                          color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer',
                          padding: 4, borderRadius: 6, transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginTop: 6, marginLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⚠</span> {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember + Forgot */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        style={{ width: 15, height: 15, accentColor: '#6366F1', cursor: 'pointer', borderRadius: 4 }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Remember me</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#4338CA')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6366F1')}
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-hover-lift"
                    style={{
                      width: '100%', padding: '14px 24px', borderRadius: 14,
                      border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1,
                      background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 50%, #9333EA 100%)',
                      boxShadow: '0 10px 24px -4px rgba(99,102,241,0.5)',
                      color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.01em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* shimmer overlay */}
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                      backgroundSize: '200% auto',
                      animation: isSubmitting ? 'none' : 'shimmer 2.5s linear infinite',
                    }} />
                    {isSubmitting ? (
                      <>
                        <svg style={{ width: 18, height: 18, animation: 'spin-slow 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <ArrowRight style={{ width: 17, height: 17 }} />
                        Sign In to Dashboard
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Secure Login</span>
                  <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                </div>

                {/* Trust Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
                  {[
                    { icon: Shield, label: 'SSL Secured' },
                    { icon: CheckCircle2, label: 'Verified System' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
                      <Icon style={{ width: 14, height: 14, color: '#10b981' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Contact Admin → WhatsApp */}
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 8 }}>
                    Having trouble with login?
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-btn"
                  >
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle style={{ width: 13, height: 13, color: '#fff' }} />
                    </div>
                    Contact Administrator on WhatsApp
                  </a>
                </div>

                {/* Copyright */}
                <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', fontWeight: 500, marginTop: 12 }}>
                  © {new Date().getFullYear()} JY Education. All rights reserved.
                </p>
              </div>
            </div>

            {/* Below-card */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 14 }}>
              🔒 Protected by JY School Security System
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
