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

import { RegisterForm } from '../ui/RegisterForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => '/lab' }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders registration fields including GDPR checkbox', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/^Username/i)).toBeDefined();
    expect(screen.getByLabelText(/^Work Email/i)).toBeDefined();
    expect(
      screen.getByLabelText(/^Password \(Min 12 Characters\)/i)
    ).toBeDefined();
    expect(screen.getByLabelText(/^Confirm Password/i)).toBeDefined();
    expect(
      screen.getByText(/QSLate acts strictly as a Technical Tool Provider/i)
    ).toBeDefined();
  });

  it('validates fields and requires regulatory consent checkbox', async () => {
    render(<RegisterForm />);

    const submitBtn = screen.getByRole('button', {
      name: /Provision Account & Enter Lab/i,
    });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Username is required/i)).toBeDefined();
    expect(screen.getByText(/Email address is required/i)).toBeDefined();
    expect(screen.getByText(/Password is required/i)).toBeDefined();
    expect(
      screen.getByText(
        /You must acknowledge the regulatory notice and GDPR consent/i
      )
    ).toBeDefined();
  });

  it('submits valid registration and redirects to lab', async () => {
    const mockSession = {
      user: {
        id: 101,
        email: 'researcher@quantfund.eu',
        username: 'quant_fund_lead',
        created_at: '2026-01-01T00:00:00Z',
        display_name: '',
        email_verified: false,
      },
      access_token: 'new.jwt.access.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    vi.spyOn(apiClient, 'register').mockResolvedValueOnce(mockSession);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: 'quant_fund_lead' },
    });
    fireEvent.change(screen.getByLabelText(/^Work Email/i), {
      target: { value: 'researcher@quantfund.eu' },
    });
    fireEvent.change(
      screen.getByLabelText(/^Password \(Min 12 Characters\)/i),
      {
        target: { value: 'VerySecurePassword123!' },
      }
    );
    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
      target: { value: 'VerySecurePassword123!' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(
      screen.getByRole('button', { name: /Provision Account & Enter Lab/i })
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lab');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('researcher@quantfund.eu');
  });

  it('displays error banner if user already exists (409)', async () => {
    vi.spyOn(apiClient, 'register').mockRejectedValueOnce(
      new ApiError(
        409,
        'account_exists',
        'email or username already registered'
      )
    );

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/^Username/i), {
      target: { value: 'existing_user' },
    });
    fireEvent.change(screen.getByLabelText(/^Work Email/i), {
      target: { value: 'existing@fund.com' },
    });
    fireEvent.change(
      screen.getByLabelText(/^Password \(Min 12 Characters\)/i),
      {
        target: { value: 'VerySecurePassword123!' },
      }
    );
    fireEvent.change(screen.getByLabelText(/^Confirm Password/i), {
      target: { value: 'VerySecurePassword123!' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(
      screen.getByRole('button', { name: /Provision Account & Enter Lab/i })
    );

    expect(
      await screen.findByText(
        /An account with this email or username is already registered/i
      )
    ).toBeDefined();
  });
});
