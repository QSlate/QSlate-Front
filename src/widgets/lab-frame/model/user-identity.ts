import type { User, UserSession } from '@/entities/user';

export interface UserIdentity {
  readonly name: string | null;
  readonly email: string | null;
  readonly initials: string | null;
}

function readString(
  session: UserSession | null,
  key: 'name' | 'email'
): string | null {
  if (!session) return null;
  const value: unknown = Reflect.get(session, key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Derives the display name, email and avatar initials of the current user. */
export function resolveUserIdentity(
  authUser: User | null,
  session: UserSession | null
): UserIdentity {
  const name =
    authUser?.display_name?.trim() ||
    authUser?.username?.trim() ||
    readString(session, 'name');
  const email = authUser?.email?.trim() || readString(session, 'email');
  const source = name ?? email;
  const initials = source
    ? source
        .replace(/@.*$/, '')
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase() || null
    : null;
  return { name: name || null, email: email || null, initials };
}
