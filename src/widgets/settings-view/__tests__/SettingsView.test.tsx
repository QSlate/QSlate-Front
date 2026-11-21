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
import { useLabStore } from '@/features/lab-state';
import { apiClient } from '@/shared/api';
import { AppearanceProvider } from '@/shared/theme';

import { SettingsView } from '../ui/SettingsView';

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLabStore.setState({ toast: null });
    useAuthStore.setState({
      isAuthenticated: true,
      accessToken: 'test-token',
      user: {
        id: 1,
        email: 'trader@qslate.com',
        username: 'trader1',
        created_at: '2026-01-01',
        display_name: 'Quant Trader',
        email_verified: true,
      },
    });

    useUserStore.setState({
      theme: 'dark',
      colorblindMode: 'none',
      soundAlerts: true,
      sidebarCollapsed: false,
      session: null,
    });

    vi.spyOn(apiClient, 'getApiKeys').mockResolvedValue({
      items: [
        {
          id: 'key-runner-01',
          name: 'Cluster Node West',
          scopes: ['runner:results:write', 'runner:heartbeat'],
          created_at: '2026-01-01T00:00:00Z',
          expires_at: '2027-04-01T00:00:00Z',
          revoked_at: null,
        },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders simulation settings, display preferences, and runner API keys', async () => {
    render(<SettingsView />);

    expect(screen.getByText('Simulation & Engine Settings')).toBeDefined();
    expect(
      screen.getByText('Display & Accessibility Preferences')
    ).toBeDefined();
    expect(screen.getByText('Distributed Runner API Keys')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Cluster Node West')).toBeDefined();
      expect(screen.getByText('ACTIVE')).toBeDefined();
    });
  });

  it('toggles theme, colorblind mode, and sound alerts', () => {
    render(<SettingsView />);

    // Toggle theme to light
    const lightBtn = screen.getByRole('button', { name: /light/i });
    fireEvent.click(lightBtn);
    expect(useUserStore.getState().theme).toBe('light');

    // Toggle colorblind mode to orange-blue
    const orangeBlueBtn = screen.getByRole('button', { name: /orange-blue/i });
    fireEvent.click(orangeBlueBtn);
    expect(useUserStore.getState().colorblindMode).toBe('orange-blue');

    // Toggle sound alerts
    const alertsBtn = screen.getByRole('button', { name: /alerts enabled/i });
    fireEvent.click(alertsBtn);
    expect(useUserStore.getState().soundAlerts).toBe(false);
  });

  it('opens generate modal and creates a new runner API key with secret modal', async () => {
    const createSpy = vi
      .spyOn(apiClient, 'createApiKey')
      .mockResolvedValueOnce({
        key: {
          id: 'new-key-123',
          name: 'Worker Alpha',
          scopes: ['runner:results:write'],
          created_at: '2026-01-01T00:00:00Z',
          expires_at: '2026-04-01T00:00:00Z',
        },
        secret: 'qsl_new-key-123.secret_payload_value',
      });

    render(<SettingsView />);

    // Open modal
    const generateBtn = screen.getByRole('button', { name: /generate key/i });
    fireEvent.click(generateBtn);

    expect(screen.getByLabelText(/key name \/ purpose/i)).toBeDefined();

    // Type name
    const input = screen.getByLabelText(/key name \/ purpose/i);
    fireEvent.change(input, { target: { value: 'Worker Alpha' } });

    // Submit form
    const submitBtn = screen.getAllByRole('button', {
      name: /generate key/i,
    })[1];
    if (submitBtn) {
      fireEvent.click(submitBtn);
    }

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        {
          name: 'Worker Alpha',
          expires_in_days: 90,
        },
        'test-token'
      );
      expect(
        screen.getByText('Runner API Key Created Successfully')
      ).toBeDefined();
      expect(
        screen.getByText('qsl_new-key-123.secret_payload_value')
      ).toBeDefined();
    });

    // Test copy secret
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const copyBtn = screen.getByTitle('Copy Secret');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'qsl_new-key-123.secret_payload_value'
    );

    // Dismiss modal
    const dismissBtn = screen.getByRole('button', {
      name: /i have saved my secret/i,
    });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText('Runner API Key Created Successfully')
    ).toBeNull();
  });

  it('revokes an active runner API key', async () => {
    const revokeSpy = vi
      .spyOn(apiClient, 'revokeApiKey')
      .mockResolvedValueOnce(undefined);

    render(<SettingsView />);

    await waitFor(() => {
      expect(screen.getByText('Cluster Node West')).toBeDefined();
    });

    const revokeBtn = screen.getByRole('button', { name: /revoke/i });
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('key-runner-01', 'test-token');
      expect(screen.getByText('REVOKED')).toBeDefined();
    });
  });

  it('renders correctly in light theme mode', () => {
    const { container } = render(
      <AppearanceProvider value={{ theme: 'light', colorblindMode: 'none' }}>
        <SettingsView />
      </AppearanceProvider>
    );

    expect(container).toBeDefined();
    expect(screen.getByText('Simulation & Engine Settings')).toBeDefined();
  });
});
