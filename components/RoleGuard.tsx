'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';

import { isPublicPath } from '@/lib/utils';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { currentUser, authLoading } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || isPublicPath(pathname) || !currentUser) return;

    const role = currentUser.role.toLowerCase();
    let isAllowed = true;

    // Owner & Admin access
    if (pathname.startsWith('/owner') || pathname.startsWith('/admin') || pathname.startsWith('/inventory')) {
      if (role !== 'owner') isAllowed = false;
    }
    // Manager specific access
    else if (pathname.startsWith('/manager')) {
      if (role !== 'manager') isAllowed = false;
    }
    // Staff specific access
    else if (pathname.startsWith('/staff')) {
      if (role !== 'staff') isAllowed = false;
    }

    if (!isAllowed) {
      router.push("/unauthorized");
    }
  }, [pathname, router, currentUser, mounted, authLoading]);

  if (!mounted || authLoading) {
    if (isPublicPath(pathname)) return <>{children}</>;
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

  return <>{children}</>;
}
