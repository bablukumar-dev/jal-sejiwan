'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/src/supabaseClient';
import { useUser, useAuth } from '@clerk/nextjs';

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

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { isLoaded: isUserLoaded, user } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) return;

    const isPublic = pathname ? (
      publicPaths.includes(pathname) || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup') ||
      pathname === '/unauthorized'
    ) : true;

    if (isPublic) {
      requestAnimationFrame(() => {
        setAuthorized(true);
      });
      return;
    }

    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    const checkRole = async () => {
      try {
        const { data: userDoc, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        let role = 'staff';
        if (userDoc && !error) {
          role = userDoc.role || 'staff';
        }

        const currentUserRole = role.toLowerCase();

        // Role-Based Route Guard Validation
        let isAllowed = true;

        if (pathname.startsWith('/owner/staff') || pathname.startsWith('/owner/reports')) {
          // Owner only
          if (currentUserRole !== 'owner') {
            isAllowed = false;
          }
        } else if (pathname.startsWith('/owner')) {
          // Manager + Owner
          if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
            isAllowed = false;
          }
        } else if (pathname.startsWith('/staff')) {
          // Staff only
          if (currentUserRole !== 'staff') {
            isAllowed = false;
          }
        } else if (pathname.startsWith('/inventory')) {
          // Manager + Owner
          if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
            isAllowed = false;
          }
        }

        if (!isAllowed) {
          router.push("/unauthorized");
        } else {
          requestAnimationFrame(() => {
            setAuthorized(true);
          });
        }
      } catch (e) {
        console.error("Failed to verify user role in guard:", e);
        router.push("/unauthorized");
      }
    };

    checkRole();
  }, [pathname, router, isUserLoaded, isAuthLoaded, isSignedIn, user]);

  if (!mounted) {
    return <>{children}</>;
  }

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
