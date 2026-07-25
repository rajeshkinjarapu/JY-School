import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { forgotPassword } from '../../api/auth';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(values.email);
      setSentEmail(values.email);
      setIsSuccess(true);
      toast.success('Reset link sent to your email!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Error requesting password reset.';
      toast.error(errorMsg);
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

        {!isSuccess ? (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Forgot Password?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

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
                {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                We've sent a password reset link to <br/>
                <span className="font-medium text-gray-900 dark:text-white">{sentEmail}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                Click the link in the email to set a new password. The link will expire in 10 minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ForgotPasswordPage;

