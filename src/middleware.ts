import { type NextRequest, NextResponse } from 'next/server';

export const AUTH_TOKEN_COOKIE = 'qslate_auth_token';

export function isJwtExpired(token?: string | null): boolean {
  if (!token || token.trim().length === 0) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonStr = '';
    if (typeof atob === 'function') {
      jsonStr = atob(base64);
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    }
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed.exp === 'number') {
      return parsed.exp * 1000 <= Date.now();
    }
    return false;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const isAuthenticated = Boolean(
    token && token.trim().length > 0 && !isJwtExpired(token)
  );

  const isLabRoute = pathname === '/lab' || pathname.startsWith('/lab/');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (isLabRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const callbackUrl = `${pathname}${search}`;
    loginUrl.searchParams.set('redirect', callbackUrl);
    const response = NextResponse.redirect(loginUrl);
    if (token && isJwtExpired(token)) {
      response.cookies.delete(AUTH_TOKEN_COOKIE);
    }
    return response;
  }

  if (isAuthRoute && isAuthenticated) {
    const labUrl = new URL('/lab', request.url);
    return NextResponse.redirect(labUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lab', '/lab/:path*', '/login', '/register'],
};
