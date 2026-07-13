import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { forgotPassword, resetPassword } from '../../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, Mail, Lock, KeyRound } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      toast.success('Reset OTP sent to your email!');
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Error requesting password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Reset failed. Please check the OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {step === 1
              ? "Enter your email address and we'll send you a 6-digit OTP code to verify your identity."
              : `Enter the 6-digit OTP code sent to ${email} along with your new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@school.com"
                  className="input pl-11"
                  {...emailForm.register('email')}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-500 mt-1.5">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? 'Sending...' : 'Send OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
            <div>
              <label className="label">Verification OTP Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className="input pl-11 tracking-[0.2em] font-mono text-center text-lg"
                  {...resetForm.register('otp')}
                />
              </div>
              {resetForm.formState.errors.otp && (
                <p className="text-xs text-red-500 mt-1.5">
                  {resetForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input pl-11"
                  {...resetForm.register('newPassword')}
                />
              </div>
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-red-500 mt-1.5">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
