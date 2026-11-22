import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api';

import { BacktestJobError, describeRunError } from '../run-error';

describe('describeRunError', () => {
  it.each([
    [
      'execution_unavailable',
      503,
      'retry',
      "L'exécution des backtests est désactivée",
    ],
    ['unauthorized', 401, 'reconnect', 'Ta session a expiré'],
    ['invalid_input', 400, 'none', 'Le serveur a refusé ces réglages'],
    ['not_found', 404, 'none', "n'existe plus"],
    ['quota_exceeded', 429, 'retry', 'trop de backtests en attente'],
    ['state_conflict', 409, 'retry', 'déjà en cours de traitement'],
  ] as const)(
    'maps the lab error %s to a French message',
    (code, status, action, text) => {
      const described = describeRunError(new ApiError(status, code, 'raw'));
      expect(described.action).toBe(action);
      expect(described.message).toContain(text);
      expect(described.code).toBe(code);
    }
  );

  it('treats any 401 as a reconnect and unknown failures as retryable', () => {
    expect(describeRunError(new ApiError(401, 'http_error', 'x')).action).toBe(
      'reconnect'
    );
    expect(
      describeRunError(new ApiError(502, 'bad_gateway', 'x'))
    ).toMatchObject({
      action: 'retry',
      message: expect.stringContaining('erreur 502'),
    });
  });

  it('describes job failures, timeouts and network errors', () => {
    expect(
      describeRunError(new BacktestJobError('failed', 'division by zero'))
        .message
    ).toBe('Le backtest a échoué : division by zero');
    expect(describeRunError(new BacktestJobError('timeout', null)).code).toBe(
      'timeout'
    );
    expect(describeRunError(new TypeError('Failed to fetch')).code).toBe(
      'network'
    );
  });
});
