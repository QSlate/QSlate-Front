'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  selectColorblindMode,
  useAuthStore,
  useUserStore,
} from '@/entities/user/model';
import { apiClient, ApiError } from '@/shared/api';
import { useHydratedStore } from '@/shared/lib/store';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/lab';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string | undefined;
    password?: string | undefined;
  }>({});

  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    'none'
  );
  const isColorblind = colorblindMode === 'orange-blue';

  const validate = (): boolean => {
    const errors: {
      identifier?: string | undefined;
      password?: string | undefined;
    } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const session = await apiClient.login({
        identifier: identifier.trim(),
        password,
      });

      useAuthStore.getState().setAuth(session);
      router.push(redirectUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'invalid_credentials' || err.statusCode === 401) {
          setErrorMessage('Invalid identifier or password. Please try again.');
        } else if (err.code === 'origin_forbidden') {
          setErrorMessage('Security policy violation: Origin not allowed.');
        } else {
          setErrorMessage(
            err.message || 'Authentication failed. Please verify credentials.'
          );
        }
      } else {
        setErrorMessage(
          'Unable to reach authentication gateway. Please verify the Go backend is running.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const errorBadgeClass = isColorblind
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    : 'bg-rose-500/10 border-rose-500/30 text-rose-300';

  const inputErrorBorderClass = isColorblind
    ? 'border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20'
    : 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Card Container */}
      <div className="relative rounded-2xl bg-[#0d0f14]/85 light:bg-white/95 backdrop-blur-2xl border border-white/10 light:border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] light:shadow-[0_16px_36px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] p-6 sm:p-8">
        {/* Glow Accent Header */}
        <div className="flex flex-col gap-2 mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 self-center sm:self-start px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px] tracking-wider uppercase">
            <KeyRound className="w-3 h-3 text-[#00ffb2]" />
            <span>Encrypted Session Init</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-zinc-950">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-400 light:text-zinc-600">
            Authenticate to access your high-frequency institutional backtesting
            environment.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            aria-live="assertive"
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs mb-5 font-mono ${errorBadgeClass}`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Identifier Field (Email or Username) */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      identifier: undefined,
                    }));
                  }
                }}
                placeholder="quant.researcher@qslate.com"
                aria-invalid={Boolean(fieldErrors.identifier)}
                aria-describedby={
                  fieldErrors.identifier ? 'identifier-error' : undefined
                }
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.identifier
                    ? inputErrorBorderClass
                    : 'border-white/10 light:border-black/10 focus:border-accent focus:ring-accent/20'
                }`}
              />
            </div>
            {fieldErrors.identifier && (
              <p
                id="identifier-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.identifier}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }
                }}
                placeholder="••••••••••••"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'password-error' : undefined
                }
                disabled={isLoading}
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.password
                    ? inputErrorBorderClass
                    : 'border-white/10 light:border-black/10 focus:border-accent focus:ring-accent/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-700 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p
                id="password-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 light:bg-zinc-900 light:text-white light:hover:bg-black shadow-[0_4px_20px_rgba(0,255,178,0.25)] light:shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Initializing Session...</span>
              </>
            ) : (
              <>
                <span>Initialize Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Transition Link to Register */}
        <div className="mt-6 pt-5 border-t border-white/10 light:border-black/10 text-center text-xs text-zinc-400 light:text-zinc-600">
          <span>Don&apos;t have an enterprise account? </span>
          <Link
            href={
              redirectUrl !== '/lab'
                ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                : '/register'
            }
            className="font-medium text-white light:text-zinc-950 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            Request access / Register
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
