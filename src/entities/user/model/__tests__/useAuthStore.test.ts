// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '../useAuthStore';
import { useUserStore } from '../useUserStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initializes with unauthenticated default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates state and syncs with user store on setAuth', () => {
    const mockSession = {
      user: {
        id: 10,
        email: 'trader10@qslate.com',
        username: 'trader10',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Risk Manager',
        email_verified: true,
      },
      access_token: 'auth.access.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    useAuthStore.getState().setAuth(mockSession);

    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.accessToken).toBe('auth.access.token');
    expect(authState.user).toEqual(mockSession.user);

    // Check synchronization with useUserStore
    const userSession = useUserStore.getState().session;
    expect(userSession).toEqual(mockSession.user);
  });

  it('clears state on clearAuth', () => {
    const mockSession = {
      user: {
        id: 10,
        email: 'trader10@qslate.com',
        username: 'trader10',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Risk Manager',
        email_verified: true,
      },
      access_token: 'auth.access.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    useAuthStore.getState().setAuth(mockSession);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(useUserStore.getState().session).toBeNull();
  });

  it('updates user profile in state', () => {
    const mockSession = {
      user: {
        id: 10,
        email: 'trader10@qslate.com',
        username: 'trader10',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Old Name',
        email_verified: true,
      },
      access_token: 'token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    useAuthStore.getState().setAuth(mockSession);
    useAuthStore.getState().updateUser({ display_name: 'New Name' });

    expect(useAuthStore.getState().user?.display_name).toBe('New Name');
  });
});
