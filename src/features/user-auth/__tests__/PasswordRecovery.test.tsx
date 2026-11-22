// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/user';
import { apiClient } from '@/shared/api';

import { ForgotPasswordForm } from '../ui/ForgotPasswordForm';
import { ResetPasswordForm } from '../ui/ResetPasswordForm';
import { VerifyEmailView } from '../ui/VerifyEmailView';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams('token=mock-valid-token-123'),
}));

describe('Password Recovery & Email Verification Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  describe('ForgotPasswordForm', () => {
    it('submits email to forgot-password endpoint and displays confirmation', async () => {
      const forgotSpy = vi
        .spyOn(apiClient, 'forgotPassword')
        .mockResolvedValueOnce();

      render(<ForgotPasswordForm />);

      expect(screen.getByText('Recover Password')).toBeDefined();

      const emailInput = screen.getByLabelText(/Institutional Email/i);
      fireEvent.change(emailInput, {
        target: { value: 'researcher@quantfund.eu' },
      });

      const submitBtn = screen.getByRole('button', {
        name: /Send Reset Link/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(forgotSpy).toHaveBeenCalledWith('researcher@quantfund.eu');
        expect(screen.getByText(/Recovery Link Dispatched/i)).toBeDefined();
      });
    });
  });

  describe('ResetPasswordForm', () => {
    it('validates password entropy and submits reset token', async () => {
      const resetSpy = vi
        .spyOn(apiClient, 'resetPassword')
        .mockResolvedValueOnce();

      render(<ResetPasswordForm />);

      expect(screen.getByText('Set New Password')).toBeDefined();

      const newPasswordInput = screen.getByLabelText(/^New Password$/i);
      const confirmPasswordInput =
        screen.getByLabelText(/Confirm New Password/i);

      fireEvent.change(newPasswordInput, {
        target: { value: 'ValidPassword123!' },
      });
      fireEvent.change(confirmPasswordInput, {
        target: { value: 'ValidPassword123!' },
      });

      const submitBtn = screen.getByRole('button', { name: /Reset Password/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith(
          'mock-valid-token-123',
          'ValidPassword123!'
        );
        expect(
          screen.getByText(/Password Successfully Updated/i)
        ).toBeDefined();
      });
    });
  });

  describe('VerifyEmailView', () => {
    it('verifies token from search params and updates auth user verification state', async () => {
      useAuthStore.getState().setAuth({
        user: {
          id: 1,
          email: 'researcher@quantfund.eu',
          username: 'quant99',
          created_at: '2026-01-01',
          display_name: 'Quant Lead',
          email_verified: false,
        },
        access_token: 'valid.token',
        token_type: 'Bearer',
        expires_in: 900,
      });

      const verifySpy = vi
        .spyOn(apiClient, 'verifyEmail')
        .mockResolvedValueOnce();

      render(<VerifyEmailView />);

      await waitFor(() => {
        expect(verifySpy).toHaveBeenCalledWith('mock-valid-token-123');
        expect(screen.getByText(/Email Verified Successfully/i)).toBeDefined();
        expect(useAuthStore.getState().user?.email_verified).toBe(true);
      });
    });
  });
});
