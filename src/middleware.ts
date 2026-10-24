import { type NextRequest, NextResponse } from 'next/server';

export const AUTH_TOKEN_COOKIE = 'qslate_auth_token';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const isAuthenticated = Boolean(token && token.trim().length > 0);

  const isLabRoute = pathname === '/lab' || pathname.startsWith('/lab/');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (isLabRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const callbackUrl = `${pathname}${search}`;
    loginUrl.searchParams.set('redirect', callbackUrl);
    return NextResponse.redirect(loginUrl);
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
