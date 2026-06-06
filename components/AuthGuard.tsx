'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const publicPaths = ['/login', '/'];

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
  const [loading, setLoading] = useState(!publicPaths.includes(pathname));

  useEffect(() => {
    if (publicPaths.includes(pathname)) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Check if there is a local non-Firebase session (PIN login for staff/manager)
        const localRole = safeGet('userRole');
        const localPinLogin = safeGet('pinAuth');
        
        if (localPinLogin === 'true' && (localRole === 'staff' || localRole === 'manager')) {
           // Allowed by local PIN login
           if (localRole === 'staff' && pathname.startsWith('/owner') && !pathname.includes('/owner/customers/add')) {
             router.replace('/staff/dashboard');
           } else if (localRole === 'staff' && pathname.startsWith('/inventory')) {
             router.replace('/staff/dashboard');
           } else {
             setLoading(false);
           }
        } else {
           // Not logged in and not on a public path
           router.push('/login');
        }
      } else {
        // Enforce role-based routing
        let targetRole = safeGet('userRole');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const firestoreRole = data.role?.toLowerCase();
            
            if (firestoreRole) {
              if (targetRole && targetRole !== firestoreRole) {
                router.push('/login');
                return;
              }
              targetRole = firestoreRole;
            }
            
            // Migration: Assign default businessId
            if (!data.businessId) {
              const { setDoc } = await import('firebase/firestore');
              await setDoc(doc(db, 'users', user.uid), { businessId: 'default_business' }, { merge: true });
              if (typeof window !== 'undefined') localStorage.setItem('businessId', 'default_business');
            } else {
              if (typeof window !== 'undefined') localStorage.setItem('businessId', data.businessId);
            }
            
            // Create default business document if user is owner
            if (targetRole === 'owner') {
               const { setDoc } = await import('firebase/firestore');
               const businessDoc = await getDoc(doc(db, 'businesses', 'default_business'));
               if (!businessDoc.exists()) {
                 await setDoc(doc(db, 'businesses', 'default_business'), {
                   businessId: 'default_business',
                   businessName: 'Default Business',
                   createdAt: new Date().toISOString(),
                   ownerId: user.uid
                 }, { merge: true });
               }
            }
          }
        } catch (e) {
          console.error("Could not verify role or run migration", e);
        }

        if (targetRole === 'staff' && pathname.startsWith('/owner') && !pathname.includes('/owner/customers/add')) {
          router.replace('/staff/dashboard');
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
