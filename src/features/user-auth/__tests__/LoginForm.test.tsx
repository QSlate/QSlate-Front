// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/user/model';
import { apiClient, ApiError } from '@/shared/api';

import { LoginForm } from '../ui/LoginForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => '/lab' }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders login form inputs and primary CTA button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/Email or Username/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Initialize Session/i })
    ).toBeDefined();
  });

  it('validates required fields before sending request', async () => {
    render(<LoginForm />);

    const submitBtn = screen.getByRole('button', {
      name: /Initialize Session/i,
    });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Email or username is required/i)
    ).toBeDefined();
    expect(screen.getByText(/Password is required/i)).toBeDefined();
  });

  it('successfully authenticates and redirects to lab', async () => {
    const mockSession = {
      user: {
        id: 99,
        email: 'analyst@qslate.internal',
        username: 'quant99',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Lead Researcher',
        email_verified: true,
      },
      access_token: 'valid.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    vi.spyOn(apiClient, 'login').mockResolvedValueOnce(mockSession);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email or Username/i), {
      target: { value: 'quant99' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password12345!' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Initialize Session/i })
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lab');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.username).toBe('quant99');
  });

  it('displays error banner when authentication fails with 401', async () => {
    vi.spyOn(apiClient, 'login').mockRejectedValueOnce(
      new ApiError(
        401,
        'invalid_credentials',
        'invalid credentials or revoked session'
      )
    );

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email or Username/i), {
      target: { value: 'unknown' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Initialize Session/i })
    );

    expect(
      await screen.findByText(/Invalid identifier or password/i)
    ).toBeDefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
