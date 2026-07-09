'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import Image from 'next/image';
// Auth system removed

import { isPublicPath } from '@/lib/utils';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, authLoading, logout, isLoggingOut } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (isLoggingOut || !mounted || authLoading) return;

    const isPublic = isPublicPath(pathname);
    
    if (!currentUser) {
      if (!isPublic && pathname !== '/onboarding') {
        router.push("/login");
      }
    } else {
      // User is logged in
      if (currentUser.onboardingCompleted === false) {
        if (pathname !== '/onboarding' && !isPublic) {
          router.push("/onboarding");
        }
      } else if (currentUser.onboardingCompleted === true) {
        if (pathname === '/onboarding') {
          if (currentUser.role === 'owner') router.push('/owner/dashboard');
          else if (currentUser.role === 'manager') router.push('/manager/dashboard');
          else router.push('/staff/dashboard');
        }
      }
    }
  }, [mounted, authLoading, currentUser, pathname, router, isLoggingOut]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="bg-white/10 rounded-3xl p-8 flex flex-col items-center max-w-xs shadow-2xl border border-white/10 backdrop-blur-md">
          <svg className="w-10 h-10 text-blue-300 animate-spin mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-lg font-bold text-white font-sans">Signing you out...</h3>
          <p className="text-xs text-blue-200 mt-1 text-center font-sans">Clearing authorization session and resetting cached local profile securely.</p>
        </div>
      </div>
    );
  }

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
        <p className="text-blue-200 text-sm mt-2 max-w-sm font-sans font-medium">Verifying authorization...</p>
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
