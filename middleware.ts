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
    '/unauthorized',
    '/manifest.json',
    '/manifest.webmanifest',
    '/sw.js',
    '/service-worker.js'
  ];

  if (
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/service-worker.js') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/screenshots/') ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/browserconfig.xml' ||
    pathname === '/robots.txt' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.xml')
  ) {
    return NextResponse.next();
  }
  
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
    const sessionActiveCookie = request.cookies.get('sessionActive');
    
    const token = tokenCookie?.value;
    const role = roleCookie?.value;
    const onboardingCompleted = onboardingCookie?.value;
    const isSessionActive = sessionActiveCookie?.value === 'true';
    
    if (!token && !isSessionActive) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    
    const payload = token ? parseJwt(token) : null;
    if (!payload && token && !isSessionActive) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      // Clear invalid token cookies by returning a response with expired headers
      const response = NextResponse.redirect(url);
      response.cookies.delete('firebaseIdToken');
      response.cookies.delete('userRole');
      response.cookies.delete('businessId');
      response.cookies.delete('onboardingCompleted');
      response.cookies.delete('sessionActive');
      return response;
    }
    
    // Check expiration if we have a token
    const isExpired = payload?.exp ? (Date.now() / 1000 >= payload.exp) : true;
    if (isExpired && token && !isSessionActive) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('expired', 'true');
      const response = NextResponse.redirect(url);
      response.cookies.delete('firebaseIdToken');
      response.cookies.delete('userRole');
      response.cookies.delete('businessId');
      response.cookies.delete('onboardingCompleted');
      response.cookies.delete('sessionActive');
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
      } else if (role === 'manager') {
        url.pathname = '/manager/dashboard';
      } else {
        url.pathname = '/owner/dashboard';
      }
      return NextResponse.redirect(url);
    }

    // Protect role-specific routes (only if role cookie is present to prevent blocking during client-side token refresh)
    // Owner & Admin access
    if (pathname.startsWith('/owner') || pathname.startsWith('/admin') || pathname.startsWith('/inventory')) {
      console.log(`[Middleware] Checking owner/admin access. Path: ${pathname}, Role: ${role}`);
      if (role && role !== 'owner') {
        console.log(`[Middleware] Unauthorized owner access. Redirecting.`);
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    }

    // Manager specific access
    if (pathname.startsWith('/manager')) {
      console.log(`[Middleware] Checking manager access. Path: ${pathname}, Role: ${role}`);
      if (role && role !== 'manager') {
        console.log(`[Middleware] Unauthorized manager access. Redirecting.`);
        const url = request.nextUrl.clone();
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    }

    // Staff specific access
    if (pathname.startsWith('/staff')) {
      console.log(`[Middleware] Checking staff access. Path: ${pathname}, Role: ${role}`);
      if (role && role !== 'staff' && role !== 'owner' && role !== 'manager') {
        console.log(`[Middleware] Unauthorized staff access. Redirecting.`);
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
    const sessionActiveCookie = request.cookies.get('sessionActive');
    
    const token = tokenCookie?.value;
    const role = roleCookie?.value;
    const isSessionActive = sessionActiveCookie?.value === 'true';
    
    if (isSessionActive || token) {
      const url = request.nextUrl.clone();
      if (role === 'staff') {
        url.pathname = '/staff/dashboard';
      } else if (role === 'manager') {
        url.pathname = '/manager/dashboard';
      } else {
        url.pathname = '/owner/dashboard';
      }
      return NextResponse.redirect(url);
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
     * - manifest.json / manifest.webmanifest
     * - sw.js / service-worker.js
     * - icons
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|service-worker.js|icons|screenshots|.*\\.png|.*\\.svg|.*\\.ico).*)',
  ],
};
