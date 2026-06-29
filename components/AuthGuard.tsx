/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const publicPaths = [
  '/login',
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-and-conditions'
];

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isPublic = pathname ? (publicPaths.includes(pathname) || pathname === '/unauthorized') : true;
    if (isPublic) {
      setLoading(false);
      return;
    }

    // Check PIN-based authentication first for staff/managers
    const pinAuth = safeGet('pinAuth');
    if (pinAuth === 'true') {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const currentUser = user;
      if (!currentUser) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Reconcile and resolve businessId
          let realBusinessId = data.businessId;
          if (realBusinessId) {
            const cachedBusinessId = safeGet('businessId');
            if (cachedBusinessId !== realBusinessId) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('businessId', realBusinessId);
              }
            }
          }
          setLoading(false);
        } else {
          // Missing user profile in Firestore
          await auth.signOut();
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
          router.push("/login");
        }
      } catch (e) {
        console.error("Could not verify session in AuthGuard", e);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Inactivity auto-logout (30 minutes of complete inactivity)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (publicPaths.includes(pathname)) {
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
            await auth.signOut();
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

  if (loading) {
    if (!publicPaths.includes(pathname) && pathname !== '/unauthorized') {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Checking session...</div>;
    }
  }

  return <>{children}</>;
}
