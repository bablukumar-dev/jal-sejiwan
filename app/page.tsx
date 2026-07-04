'use client';

import LandingPage from '@/components/LandingPage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppContext } from '@/app/context/AppContext';

export default function Home() {
  const { currentUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
        const role = currentUser.role.toLowerCase();
        if (role === 'owner' || role === 'manager') router.push('/owner/dashboard');
        else if (role === 'staff') router.push('/staff/dashboard');
    }
  }, [currentUser, router]);

  // If there's a user, show a loading/redirecting state
  if (currentUser) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
            Redirecting to dashboard...
        </div>
      );
  }

  return <LandingPage />;
}
