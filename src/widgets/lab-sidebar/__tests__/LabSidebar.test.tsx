// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore, useUserStore } from '@/entities/user/model';
import { apiClient } from '@/shared/api';

import { LabSidebar } from '../LabSidebar';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/lab',
}));

describe('LabSidebar User Profile & Logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useUserStore.getState().clearSession();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default user display when not logged in', () => {
    render(<LabSidebar />);

    expect(screen.getByText('Quant Researcher')).toBeDefined();
    expect(screen.getByText('Demo workspace · local data')).toBeDefined();
  });

  it('displays authenticated user profile and initials dynamically', () => {
    useAuthStore.getState().setAuth({
      user: {
        id: 77,
        email: 'sarah.quant@citadel.com',
        username: 'sarah_q',
        display_name: 'Sarah Connor',
        email_verified: true,
        created_at: '2026-01-01T00:00:00Z',
      },
      access_token: 'valid.token',
      token_type: 'Bearer',
      expires_in: 900,
    });

    render(<LabSidebar />);

    expect(screen.getByText('Sarah Connor')).toBeDefined();
    expect(screen.getByText('sarah.quant@citadel.com')).toBeDefined();
    expect(screen.getByText('SC')).toBeDefined();
  });

  it('handles logout flow: calls API, clears store, and navigates to /login', async () => {
    useAuthStore.getState().setAuth({
      user: {
        id: 77,
        email: 'sarah.quant@citadel.com',
        username: 'sarah_q',
        display_name: 'Sarah Connor',
        email_verified: true,
        created_at: '2026-01-01T00:00:00Z',
      },
      access_token: 'valid.token',
      token_type: 'Bearer',
      expires_in: 900,
    });

    const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValueOnce();

    render(<LabSidebar />);

    const logoutBtn = screen.getByRole('button', {
      name: /Log out of session/i,
    });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
