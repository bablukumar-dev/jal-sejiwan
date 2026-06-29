/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

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

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (publicPaths.includes(pathname) || pathname === '/unauthorized') {
      setAuthorized(true);
      return;
    }

    // Check PIN-based authentication first for staff/managers
    const pinAuth = safeGet('pinAuth');
    if (pinAuth === 'true') {
      const role = (safeGet('userRole') || 'staff').toLowerCase();
      let isAllowed = true;

      if (pathname.startsWith('/owner/staff') || pathname.startsWith('/owner/reports')) {
        if (role !== 'owner') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/owner')) {
        if (role !== 'owner' && role !== 'manager') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/staff')) {
        if (role !== 'staff') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/inventory')) {
        if (role !== 'owner' && role !== 'manager') {
          isAllowed = false;
        }
      }

      if (!isAllowed) {
        router.push("/unauthorized");
      } else {
        setAuthorized(true);
      }
      return;
    }

    const checkRole = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch role from Firestore to block client-side local storage tampering
      let role = safeGet('userRole') || 'staff';
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          role = userDoc.data().role || 'staff';
        }
      } catch (e) {
        console.error("Failed to verify user role in guard:", e);
      }

      const currentUser = {
        uid: user.uid,
        role: role.toLowerCase()
      };

      // Role-Based Route Guard Validation
      let isAllowed = true;

      if (pathname.startsWith('/owner/staff') || pathname.startsWith('/owner/reports')) {
        // Owner only
        if (currentUser.role !== 'owner') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/owner')) {
        // Manager + Owner
        if (currentUser.role !== 'owner' && currentUser.role !== 'manager') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/staff')) {
        // Staff only
        if (currentUser.role !== 'staff') {
          isAllowed = false;
        }
      } else if (pathname.startsWith('/inventory')) {
        // Manager + Owner
        if (currentUser.role !== 'owner' && currentUser.role !== 'manager') {
          isAllowed = false;
        }
      }

      if (!isAllowed) {
        router.push("/unauthorized");
      } else {
        setAuthorized(true);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      checkRole();
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (!authorized) {
    if (!publicPaths.includes(pathname) && pathname !== '/unauthorized') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="animate-pulse block w-8 h-8 rounded-full bg-blue-600/20" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Verifying role permissions...</h2>
          <p className="text-xs text-slate-400 mt-1">Please wait while we secure your session credentials.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
