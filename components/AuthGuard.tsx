'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';

const publicPaths = [
  '/login',
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
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const isPublic = pathname ? (
        publicPaths.includes(pathname) || 
        pathname.startsWith('/login') || 
        pathname.startsWith('/signup')
      ) : true;
      
      if (!isPublic) {
        router.push("/login");
      }
    }
  }, [isLoaded, isSignedIn, pathname, router]);

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
            await signOut();
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
  }, [pathname, signOut]);

  if (!mounted || !isLoaded) {
    if (!publicPaths.includes(pathname) && pathname !== '/unauthorized') {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Checking session...</div>;
    }
    return <>{children}</>;
  }

  return <>{children}</>;
}
