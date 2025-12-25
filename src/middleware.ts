import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin'];

// Routes that are only for guests (logged out users)
const guestOnlyRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Admin only routes
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Check if the route needs protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isGuestOnlyRoute = guestOnlyRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // For API routes, let the API handle its own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Verify token if present
  let user = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      );
      const { payload } = await jwtVerify(token, secret);
      user = payload as { userId: string; email: string; role: string };
    } catch (error) {
      // Invalid token - clear it
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');

      // Only redirect if accessing protected route
      if (isProtectedRoute) {
        return response;
      }
    }
  }

  // Protected route without valid token
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Guest-only route with valid token
  if (isGuestOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin route without admin role
  if (isAdminRoute && user && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to headers for server components
  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
