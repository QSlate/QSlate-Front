'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { apiClient, ApiError } from '@/shared/api';

import {
  evaluatePassword,
  PasswordStrengthMeter,
} from './PasswordStrengthMeter';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { criteria } = evaluatePassword(password);
  const isPasswordValid =
    criteria.min12 &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        'Missing password reset token. Please request a new reset link.'
      );
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        'Password does not meet institutional entropy standards.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400 || err.code === 'invalid_token') {
          setErrorMessage(
            'This reset token is invalid, expired, or has already been used.'
          );
        } else {
          setErrorMessage(
            err.message || 'Failed to reset password. Please try again.'
          );
        }
      } else {
        setErrorMessage('Unable to reach authentication gateway.');
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
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#00ffb2]/10 text-[#00ffb2] border border-[#00ffb2]/20">
          <KeyRound className="w-3.5 h-3.5" />
          <span>SECURITY CREDENTIALS</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-zinc-950 font-sans">
          Set New Password
        </h1>
        <p className="text-xs text-zinc-400 light:text-zinc-600 font-sans">
          Establish institutional-grade credentials for your quantitative
          workspace.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Password Successfully Updated</span>
            </div>
            <p className="text-zinc-300 light:text-zinc-700 font-sans text-xs">
              Your password has been changed. You can now authenticate with your
              new credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 shadow-md transition-all hover:scale-[1.01]"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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

          {!token && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              Warning: No token detected in URL query parameter.
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border border-white/10 light:border-black/10 focus:border-[#00ffb2] focus:ring-1 focus:ring-[#00ffb2] outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <PasswordStrengthMeter password={password} />

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border border-white/10 light:border-black/10 focus:border-[#00ffb2] focus:ring-1 focus:ring-[#00ffb2] outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isLoading || !isPasswordValid || password !== confirmPassword
            }
            className="w-full mt-3 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 shadow-[0_4px_20px_rgba(0,255,178,0.25)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating credentials…</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel and Return to Login
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );
}
