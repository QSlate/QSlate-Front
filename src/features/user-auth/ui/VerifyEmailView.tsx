'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuthStore } from '@/entities/user';
import { apiClient, ApiError } from '@/shared/api';

export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = useCallback(async (tokenToVerify: string) => {
    if (!tokenToVerify) {
      setErrorMessage('Verification token missing from URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await apiClient.verifyEmail(tokenToVerify);
      setIsSuccess(true);
      // If user is currently authenticated in store, mark email_verified = true
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().updateUser({ email_verified: true });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setErrorMessage(
            'This email verification token is invalid or has already been used.'
          );
        } else {
          setErrorMessage(
            err.message || 'Email verification failed. Please try again.'
          );
        }
      } else {
        setErrorMessage('Unable to reach authentication gateway.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-verify on mount if token is present
  useEffect(() => {
    if (token) {
      void handleVerify(token);
    }
  }, [token, handleVerify]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-[#0d0f14]/85 light:bg-white/95 border border-white/10 light:border-black/10 shadow-2xl backdrop-blur-xl"
    >
      <div className="space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#00ffb2]/10 text-[#00ffb2] border border-[#00ffb2]/20">
          <MailCheck className="w-3.5 h-3.5" />
          <span>IDENTITY VERIFICATION</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-zinc-950 font-sans">
          Email Verification
        </h1>
        <p className="text-xs text-zinc-400 light:text-zinc-600 font-sans">
          Verifying your institutional trading identity on the QSlate network.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#00ffb2]" />
          <span>Verifying cryptographic email token…</span>
        </div>
      ) : isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>Email Verified Successfully</span>
            </div>
            <p className="text-zinc-300 light:text-zinc-700 font-sans text-xs">
              Your institutional email has been verified. You now have full
              access to high-performance backtest simulation clusters.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/lab')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 shadow-md transition-all hover:scale-[1.01]"
          >
            <span>Proceed to Lab Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
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
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
              No verification token found in URL. Please check your verification
              email link.
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            {token && (
              <button
                type="button"
                onClick={() => handleVerify(token)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-black bg-[#00ffb2] hover:bg-[#00ffb2]/90 transition-all hover:scale-[1.01]"
              >
                <span>Retry Verification</span>
              </button>
            )}

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center py-2.5 text-xs text-zinc-400 hover:text-white transition-colors text-center"
            >
              Return to Login
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
