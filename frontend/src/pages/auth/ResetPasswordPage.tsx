import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resetPassword } from '../../api/auth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';

const resetSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  if (!token || !email) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid Link</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This password reset link is invalid or missing required information. Please request a new link.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full block mt-6 py-3">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const onResetSubmit = async (values: ResetFormValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        token, // Passing token to the backend which expects 'token' instead of 'otp'
        newPassword: values.newPassword,
      });
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Password
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Enter a new, strong password for your account.
          </p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
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

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="input pl-11"
                {...resetForm.register('confirmPassword')}
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5">
                {resetForm.formState.errors.confirmPassword.message}
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
      </div>
    </div>
  );
};
export default ResetPasswordPage;
