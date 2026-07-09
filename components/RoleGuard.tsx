'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import Image from 'next/image';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping duration-1000" />
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-blue-500/20">
            <Image src="/logo.png" alt="JalSejiwan Logo" width={64} height={64} className="object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans drop-shadow-sm">JalSejiwan</h1>
        <p className="text-blue-200 text-sm mt-2 max-w-sm font-sans font-medium">Verifying role permissions...</p>
        <div className="mt-8 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <svg className="w-4 h-4 text-blue-300 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs text-blue-200 font-semibold font-sans tracking-wide">Please wait...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
