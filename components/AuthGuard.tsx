'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
// Auth system removed

import { isPublicPath } from '@/lib/utils';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, authLoading, logout, isLoggingOut } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (isLoggingOut || !mounted || authLoading) return;

    const isPublic = isPublicPath(pathname);
    
    if (!currentUser) {
      if (!isPublic && pathname !== '/onboarding') {
        router.push("/login");
      }
    } else {
      // User is logged in
      if (currentUser.onboardingCompleted === false) {
        if (pathname !== '/onboarding' && !isPublic) {
          router.push("/onboarding");
        }
      } else if (currentUser.onboardingCompleted === true) {
        if (pathname === '/onboarding') {
          if (currentUser.role === 'owner') router.push('/owner/dashboard');
          else if (currentUser.role === 'manager') router.push('/manager/dashboard');
          else router.push('/staff/dashboard');
        }
      }
    }
  }, [mounted, authLoading, currentUser, pathname, router, isLoggingOut]);

  // Inactivity auto-logout (30 minutes of complete inactivity)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!pathname) return;

    if (isPublicPath(pathname)) {
      return;
    }

    const updateActivity = () => {
      localStorage.setItem('lastSessionActivity', String(Date.now()));
    };

    // Initialize activity on mount if not there
    if (!localStorage.getItem('lastSessionActivity')) {
      updateActivity();
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const interval = setInterval(async () => {
      if (isLoggingOut) return;
      const lastActivity = localStorage.getItem('lastSessionActivity');
      const userRole = localStorage.getItem('userRole');
      if (userRole && lastActivity) {
        const inactiveTime = Date.now() - parseInt(lastActivity, 10);
        if (inactiveTime > 30 * 60 * 1000) { // 30 minutes in milliseconds
          try {
            await logout();
          } catch (e) {
            console.error('Failed to sign out on timeout:', e);
            localStorage.clear();
          }
          window.location.href = '/login?expired=true';
        }
      }
    }, 15000); // Check every 15 seconds

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [pathname, logout, isLoggingOut]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-6 flex flex-col items-center max-w-xs shadow-xl border border-slate-100">
          <svg className="w-10 h-10 text-blue-600 animate-spin mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-lg font-bold text-slate-800">Signing you out...</h3>
          <p className="text-xs text-slate-400 mt-1 text-center font-sans">Clearing authorization session and resetting cached local profile securely.</p>
        </div>
      </div>
    );
  }

  if (!mounted || authLoading) {
    if (isPublicPath(pathname)) return <>{children}</>;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="animate-pulse block w-8 h-8 rounded-full bg-blue-600/20" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Verifying authorization...</h2>
        <p className="text-xs text-slate-400 mt-1">Please wait while we secure your session credentials.</p>
      </div>
    );
  }

  return <>{children}</>;
}
