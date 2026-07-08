import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Base64url decode the payload
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define public paths that shouldn't be gated by auth
  const publicPaths = [
    '/login',
    '/signup',
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/privacy-policy',
    '/terms',
    '/terms-and-conditions',
    '/unauthorized'
  ];
  
  // Check if pathname is public
  const isPublic = publicPaths.includes(pathname) || 
                   pathname.startsWith('/login') || 
                   pathname.startsWith('/signup') ||
                   pathname.startsWith('/unauthorized');
                   
  const isProtectedRoute = pathname.startsWith('/owner') || 
                            pathname.startsWith('/staff') || 
                            pathname.startsWith('/settings') || 
                            pathname.startsWith('/inventory') ||
                            pathname.startsWith('/onboarding');

  if (isProtectedRoute) {
    const tokenCookie = request.cookies.get('firebaseIdToken');
    const roleCookie = request.cookies.get('userRole');
    const onboardingCookie = request.cookies.get('onboardingCompleted');
    
    const token = tokenCookie?.value;
    const role = roleCookie?.value;
    const onboardingCompleted = onboardingCookie?.value;
    
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    
    const payload = parseJwt(token);
    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      // Clear invalid token cookies by returning a response with expired headers
      const response = NextResponse.redirect(url);
      response.cookies.delete('firebaseIdToken');
      response.cookies.delete('userRole');
      response.cookies.delete('businessId');
      response.cookies.delete('onboardingCompleted');
      return response;
    }
    
    // Check expiration
    const isExpired = payload.exp ? (Date.now() / 1000 >= payload.exp) : true;
    if (isExpired) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('expired', 'true');
      const response = NextResponse.redirect(url);
      response.cookies.delete('firebaseIdToken');
      response.cookies.delete('userRole');
      response.cookies.delete('businessId');
      response.cookies.delete('onboardingCompleted');
      return response;
    }
    
    // If onboarding is not completed, and user is trying to access protected routes other than /onboarding
    if (onboardingCompleted === 'false' && !pathname.startsWith('/onboarding') && !pathname.startsWith('/unauthorized')) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // If onboarding is completed, and user tries to go to /onboarding, redirect to dashboard
    if (onboardingCompleted === 'true' && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone();
      if (role === 'staff') {
        url.pathname = '/staff/dashboard';
      } else {
        url.pathname = '/owner/dashboard';
      }
      return NextResponse.redirect(url);
    }

    // Protect role-specific routes
    if (pathname.startsWith('/owner') || pathname.startsWith('/inventory')) {
      if (role !== 'owner') {
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    }
    
    if (pathname.startsWith('/staff')) {
      if (role !== 'staff' && role !== 'owner') {
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    }
  }
  
  // If user is logged in with active session and tries to access /login or /signup, redirect them to dashboard
  if (isPublic && (pathname === '/login' || pathname === '/signup')) {
    const tokenCookie = request.cookies.get('firebaseIdToken');
    const roleCookie = request.cookies.get('userRole');
    
    const token = tokenCookie?.value;
    const role = roleCookie?.value;
    
    if (token) {
      const payload = parseJwt(token);
      const isExpired = payload?.exp ? (Date.now() / 1000 >= payload.exp) : true;
      
      if (payload && !isExpired) {
        const url = request.nextUrl.clone();
        if (role === 'staff') {
          url.pathname = '/staff/dashboard';
        } else {
          url.pathname = '/owner/dashboard';
        }
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
