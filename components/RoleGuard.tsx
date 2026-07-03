'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

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
  const { currentUser } = useAppContext();
  const [authorized, setAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;

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

    if (!currentUser) {
      router.push("/login");
      return;
    }

    const currentUserRole = currentUser.role.toLowerCase();

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
  }, [pathname, router, currentUser, mounted]);

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
