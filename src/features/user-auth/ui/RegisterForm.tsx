'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
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

import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,31}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/lab';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeGdpr, setAgreeGdpr] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    confirmPassword?: string | undefined;
    agreeGdpr?: string | undefined;
  }>({});

  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    'none'
  );
  const isColorblind = colorblindMode === 'orange-blue';

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      errors.username = 'Username is required';
    } else if (!USERNAME_REGEX.test(cleanUsername)) {
      errors.username =
        '3-32 characters: lowercase letters, numbers, hyphens or underscores';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
      errors.email = 'Please provide a valid corporate or academic email';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 12) {
      errors.password = 'Password must contain at least 12 characters';
    } else if (password.length > 72) {
      errors.password = 'Password cannot exceed 72 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeGdpr) {
      errors.agreeGdpr =
        'You must acknowledge the regulatory notice and GDPR consent';
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
      const session = await apiClient.register({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Go backend returns session with access token
      useAuthStore.getState().setAuth(session);
      router.push(redirectUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'account_exists' || err.statusCode === 409) {
          setErrorMessage(
            'An account with this email or username is already registered.'
          );
        } else if (err.code === 'invalid_input' || err.statusCode === 400) {
          setErrorMessage(err.message || 'Invalid input criteria provided.');
        } else {
          setErrorMessage(
            err.message || 'Registration failed. Please try again.'
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
      <div className="relative rounded-2xl bg-[#0d0f14]/85 light:bg-white/95 backdrop-blur-2xl border border-white/10 light:border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] light:shadow-[0_16px_36px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] p-6 sm:p-8">
        {/* Glow Accent Header */}
        <div className="flex flex-col gap-2 mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 self-center sm:self-start px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-mono text-[10px] tracking-wider uppercase">
            <FileText className="w-3 h-3 text-[#00ffb2]" />
            <span>Institutional Access Provisioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-zinc-950">
            Create an Account
          </h1>
          <p className="text-sm text-zinc-400 light:text-zinc-600">
            Provision your identity to deploy quantitative backtesting engines
            in sovereign sandboxes.
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
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      username: undefined,
                    }));
                  }
                }}
                placeholder="quant_trader_99"
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username ? 'username-error' : undefined
                }
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.username
                    ? inputErrorBorderClass
                    : 'border-white/10 light:border-black/10 focus:border-accent focus:ring-accent/20'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p
                id="username-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="analyst@hedgefund.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? inputErrorBorderClass
                    : 'border-white/10 light:border-black/10 focus:border-accent focus:ring-accent/20'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p
                id="email-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Password (Min 12 Characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

            {/* Visual Password Strength Meter */}
            <PasswordStrengthMeter password={password} />

            {fieldErrors.password && (
              <p
                id="password-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium text-zinc-300 light:text-zinc-700"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                }}
                placeholder="••••••••••••"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? 'confirm-password-error'
                    : undefined
                }
                disabled={isLoading}
                className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-black/40 light:bg-black/[0.03] text-white light:text-zinc-900 placeholder:text-zinc-500 border transition-all focus:outline-none focus:ring-2 ${
                  fieldErrors.confirmPassword
                    ? inputErrorBorderClass
                    : 'border-white/10 light:border-black/10 focus:border-accent focus:ring-accent/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 light:hover:text-zinc-700 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p
                id="confirm-password-error"
                className={`text-[11px] font-mono mt-1 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Regulatory & GDPR Compliance Notice Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreeGdpr}
                onChange={(e) => {
                  setAgreeGdpr(e.target.checked);
                  if (fieldErrors.agreeGdpr) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      agreeGdpr: undefined,
                    }));
                  }
                }}
                disabled={isLoading}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/40 text-[#00ffb2] focus:ring-accent focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-[11px] leading-relaxed text-zinc-400 light:text-zinc-600 select-none">
                I acknowledge that{' '}
                <strong className="text-zinc-200 light:text-zinc-900">
                  QSLate acts strictly as a Technical Tool Provider
                </strong>{' '}
                and does not provide financial investment advice under AMF
                regulations. I consent to sovereign data processing in
                compliance with GDPR.
              </span>
            </label>
            {fieldErrors.agreeGdpr && (
              <p
                className={`text-[11px] font-mono mt-1 pl-7 ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {fieldErrors.agreeGdpr}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 light:bg-zinc-900 light:text-white light:hover:bg-black shadow-[0_4px_20px_rgba(0,255,178,0.25)] light:shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Provisioning Environment...</span>
              </>
            ) : (
              <>
                <span>Provision Account & Enter Lab</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Transition Link to Login */}
        <div className="mt-6 pt-5 border-t border-white/10 light:border-black/10 text-center text-xs text-zinc-400 light:text-zinc-600">
          <span>Already registered with QSlate? </span>
          <Link
            href={
              redirectUrl !== '/lab'
                ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                : '/login'
            }
            className="font-medium text-white light:text-zinc-950 hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            Authenticate / Log in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
