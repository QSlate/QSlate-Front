import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { AUTH_TOKEN_COOKIE, middleware } from '../middleware';

function createMockRequest(url: string, token?: string): NextRequest {
  const req = new NextRequest(url);
  if (token) {
    req.cookies.set(AUTH_TOKEN_COOKIE, token);
  }
  return req;
}

describe('Next.js route guard middleware', () => {
  it('redirects unauthenticated users from /lab to /login with redirect query param', () => {
    const req = createMockRequest('http://localhost:3000/lab');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login?redirect=%2Flab');
  });

  it('redirects unauthenticated users from /lab/ide preserving deep link', () => {
    const req = createMockRequest('http://localhost:3000/lab/ide?strategy=rsi');
    const res = middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login?redirect=%2Flab%2Fide%3Fstrategy%3Drsi');
  });

  it('allows authenticated users to access /lab', () => {
    const req = createMockRequest(
      'http://localhost:3000/lab',
      'valid.jwt.token'
    );
    const res = middleware(req);

    // 200 / NextResponse.next()
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login to /lab', () => {
    const req = createMockRequest(
      'http://localhost:3000/login',
      'valid.jwt.token'
    );
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/lab');
  });

  it('redirects authenticated users away from /register to /lab', () => {
    const req = createMockRequest(
      'http://localhost:3000/register',
      'valid.jwt.token'
    );
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/lab');
  });

  it('allows unauthenticated users to access /login and /register', () => {
    const loginReq = createMockRequest('http://localhost:3000/login');
    const loginRes = middleware(loginReq);
    expect(loginRes.status).toBe(200);

    const regReq = createMockRequest('http://localhost:3000/register');
    const regRes = middleware(regReq);
    expect(regRes.status).toBe(200);
  });
});
