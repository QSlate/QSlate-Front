import { describe, expect, it } from 'vitest';

import { resolveUserIdentity } from '../model/user-identity';

const USER = {
  id: 1,
  email: 'ada@example.com',
  username: 'ada_l',
  display_name: 'Ada Lovelace',
  email_verified: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('resolveUserIdentity', () => {
  it('prefers the display name for name and initials', () => {
    expect(resolveUserIdentity(USER, null)).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      initials: 'AL',
    });
  });

  it('falls back to the username, then to the local session', () => {
    expect(
      resolveUserIdentity({ ...USER, display_name: '' }, null).initials
    ).toBe('AL');
    expect(
      resolveUserIdentity(null, { name: 'Grace Hopper', email: 'g@h.io' })
    ).toEqual({ name: 'Grace Hopper', email: 'g@h.io', initials: 'GH' });
  });

  it('returns no identity when nobody is known', () => {
    expect(resolveUserIdentity(null, null)).toEqual({
      name: null,
      email: null,
      initials: null,
    });
  });
});
