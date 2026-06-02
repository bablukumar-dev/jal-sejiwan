'use client';

import { ArrowLeft, UserCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showProfile?: boolean;
}

export default function TopAppBar({ title, subtitle, showBack = false, showProfile = true }: TopAppBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center px-4 h-16 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={() => router.back()}
              className="hover:bg-slate-100 transition-colors p-2 -ml-2 rounded-full active:scale-95 duration-150"
            >
              <ArrowLeft className="w-6 h-6 text-blue-700" />
            </button>
          )}
          <div className="flex flex-col">
            {subtitle && <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{subtitle}</span>}
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OnlineStatusBadge />
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          {showProfile && (
            <Link href="/settings" className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-600 bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
              <UserCircle className="w-8 h-8 text-slate-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
