'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = ['/login', '/'];
  const [loading, setLoading] = useState(!publicPaths.includes(pathname));

  useEffect(() => {
    if (publicPaths.includes(pathname)) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Not logged in and not on a public path
        router.push('/login');
      } else {
        // Enforce role-based routing
        let targetRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role) {
            targetRole = userDoc.data().role;
            if (typeof window !== 'undefined') localStorage.setItem('userRole', targetRole as string);
          }
        } catch (e) {
          console.error("Could not verify role", e);
        }

        if (targetRole === 'staff' && pathname.startsWith('/owner')) {
          router.replace('/staff/dashboard');
        } else if (targetRole === 'manager' && pathname.startsWith('/owner')) {
          router.replace('/inventory/dashboard');
        } else if (targetRole === 'staff' && pathname.startsWith('/inventory')) {
          router.replace('/staff/dashboard');
        } else {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    const publicPaths = ['/login', '/'];
    if (!publicPaths.includes(pathname)) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Checking session...</div>;
    }
  }

  return <>{children}</>;
}
