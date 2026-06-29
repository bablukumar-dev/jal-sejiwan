'use client';

import { ArrowLeft, UserCircle, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';
import { useAppContext } from '@/app/context/AppContext';
import { useMemo } from 'react';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showProfile?: boolean;
}

export default function TopAppBar({ title, subtitle, showBack = false, showProfile = true }: TopAppBarProps) {
  const router = useRouter();
  const { inventory, customers } = useAppContext();

  const hasAlerts = useMemo(() => {
    const isLowInventory = inventory.fullCans < 10;
    const hasMissedPayments = customers.some(c => c.due > 0);
    return isLowInventory || hasMissedPayments;
  }, [inventory.fullCans, customers]);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.grecaptcha) {
        console.warn("reCAPTCHA is not loaded or available.");
        resolve(null);
        return;
      }
      
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LefjjotAAAAAHJzBiP_--RekTALVeeC7v1A5t5d';
      
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch (error) {
          console.error("reCAPTCHA execution failed", error);
          resolve(null);
        }
      });
    });
  };

  const verifyRecaptchaToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      if (!data.success) {
        console.error("reCAPTCHA Verification Failed:", data.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error verifying reCAPTCHA:", err);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const token = await executeRecaptcha('logout');
      if (token) {
        const isVerified = await verifyRecaptchaToken(token);
        if (!isVerified) {
          console.warn("reCAPTCHA logout verification failed. Proceeding with sign out but logged anomaly.");
        }
      }

      await auth.signOut();
      
      // Clear all local auth credentials, role settings, and cached business data completely
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pinAuth');
        localStorage.removeItem('userRole');
        localStorage.removeItem('staffUserId');
        localStorage.removeItem('staffUserName');
        localStorage.removeItem('ownerId');
        localStorage.removeItem('businessId');
        
        localStorage.removeItem('customers');
        localStorage.removeItem('deliveries');
        localStorage.removeItem('payments');
        localStorage.removeItem('inventory');
        localStorage.removeItem('inventoryHistory');
        localStorage.removeItem('staff');
        localStorage.removeItem('routes');
        localStorage.removeItem('areas');
        localStorage.removeItem('businessInfo');
      }
      
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 w-full h-[60px]">
      <div className="flex justify-between items-center px-4 h-[60px] max-w-md mx-auto">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            {showBack && (
              <button 
                onClick={() => router.back()}
                className="hover:bg-slate-100 transition-colors p-2 rounded-full active:scale-95 duration-150"
              >
                <ArrowLeft className="w-5 h-5 text-blue-700" />
              </button>
            )}
            <Image
              src="/logo.png"
              alt="JalSejiwan Logo"
              width={32}
              height={32}
              priority
              className="shrink-0"
            />
          </div>
          <div className="flex flex-col min-w-0 ml-1">
            {subtitle && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{subtitle}</span>}
            <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          {hasAlerts && (
            <div className="relative flex items-center">
              <Bell className="w-5 h-5 text-amber-500" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </div>
          )}
          <OnlineStatusBadge />
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          {showProfile && (
            <Link href="/settings" className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-600 bg-slate-100 flex items-center justify-center active:scale-95 transition-transform shrink-0">
              <UserCircle className="w-7 h-7 text-slate-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
