'use client';

import LandingPage from '@/components/LandingPage';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/supabaseClient';

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && userId) {
        // Fetch role from Supabase and redirect
        const checkRoleAndRedirect = async () => {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

          if (userData) {
            const role = userData.role.toLowerCase();
            if (role === 'owner') router.push('/owner/dashboard');
            else if (role === 'manager') router.push('/manager/dashboard');
            else if (role === 'staff') router.push('/staff/dashboard');
            else setLoading(false);
          } else {
            setLoading(false);
          }
        };
        checkRoleAndRedirect();
      } else {
        // Only update if current state is different to avoid cascading renders
        requestAnimationFrame(() => {
          setLoading(prev => prev ? false : prev);
        });
      }
    }
  }, [isLoaded, isSignedIn, userId, router]);

  if (loading) {
    return (isSignedIn ? 
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        Redirecting to dashboard...
      </div> : <LandingPage />
    );
  }

  return <LandingPage />;
}
