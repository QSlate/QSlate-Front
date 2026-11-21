'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { apiClient, ApiError } from '@/shared/api';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(
          err.message || 'Unable to process password reset request.'
        );
      } else {
        setErrorMessage('Failed to connect to authentication gateway.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-[#0d0f14]/85 light:bg-white/95 border border-white/10 light:border-black/10 shadow-2xl backdrop-blur-xl"
    >
      {/* Title & Description */}
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#00ffb2]/10 text-[#00ffb2] border border-[#00ffb2]/20">
          <KeyRound className="w-3.5 h-3.5" />
          <span>SECURITY & IDENTITY</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-zinc-950 font-sans">
          Recover Password
        </h1>
        <p className="text-xs text-zinc-400 light:text-zinc-600 font-sans">
          Enter your registered institutional email to receive a secure recovery
          token.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Recovery Link Dispatched</span>
            </div>
            <p className="text-zinc-300 light:text-zinc-700 font-sans text-xs">
              If an account exists for{' '}
              <strong className="text-white light:text-zinc-900">
                {email}
              </strong>
              , you will receive password reset instructions shortly.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 shadow-md transition-all hover:scale-[1.01]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@quantfund.eu"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border border-white/10 light:border-black/10 focus:border-[#00ffb2] focus:ring-1 focus:ring-[#00ffb2] outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 shadow-[0_4px_20px_rgba(0,255,178,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching token…</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );
}
