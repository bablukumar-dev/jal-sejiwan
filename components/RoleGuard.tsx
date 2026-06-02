/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const publicPaths = ['/login', '/'];
    if (publicPaths.includes(pathname)) {
      setAuthorized(true);
      return;
    }

    const role = (localStorage.getItem('userRole') || '').toUpperCase();
    
    // Default allowed
    let isAllowed = true;

    // Permissions logic
    if (role === 'MANAGER') {
       if (pathname.includes('/staff/add') || 
           pathname.includes('/owner/staff/add') ||
           pathname.includes('/owner/dashboard/prices')
       ) {
           isAllowed = false;
       }
    } else if (role === 'STAFF') {
       if (pathname.includes('/reports') || 
           pathname.includes('/inventory') || 
           pathname.includes('/staff/add') || 
           pathname.includes('/owner/staff') ||
           pathname.includes('/edit') // e.g. customer edit
       ) {
           isAllowed = false;
       }
    }

    if (!isAllowed) {
        if (role === 'STAFF') router.replace('/staff/dashboard');
        else if (role === 'MANAGER') router.replace('/owner/dashboard');
        else router.replace('/owner/dashboard');
    } else {
        setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) return null;

  return <>{children}</>;
}
