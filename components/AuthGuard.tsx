'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
// Auth system removed

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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, authLoading } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !currentUser) {
      const isPublic = pathname ? (
        publicPaths.includes(pathname) || 
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup')
      ) : true;
      
      if (!isPublic) {
        router.push("/login");
      }
    }
  }, [mounted, authLoading, currentUser, pathname, router]);

  // Inactivity auto-logout (30 minutes of complete inactivity)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!pathname) return;

    const isPublic = publicPaths.includes(pathname) || 
                    pathname.startsWith('/login') ||
                    pathname.startsWith('/signup');

    if (isPublic) {
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
      const lastActivity = localStorage.getItem('lastSessionActivity');
      const userRole = localStorage.getItem('userRole');
      if (userRole && lastActivity) {
        const inactiveTime = Date.now() - parseInt(lastActivity, 10);
        if (inactiveTime > 30 * 60 * 1000) { // 30 minutes in milliseconds
          try {
            console.log('Auth System Removed: Sign out');
          } catch (e) {
            console.error('Failed to sign out on timeout:', e);
          }
          localStorage.clear();
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
  }, [pathname]);

  if (!mounted || authLoading) {
    if (!publicPaths.includes(pathname || '') && pathname !== '/unauthorized') {
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

  return <>{children}</>;
}
