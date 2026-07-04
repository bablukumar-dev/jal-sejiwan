'use client';
import { AppProvider } from '@/app/context/AppContext';
import { AuthGuard } from '@/components/AuthGuard';
import { RoleGuard } from '@/components/RoleGuard';
import BackgroundSync from '@/components/BackgroundSync';
import SyncIndicator from '@/components/SyncIndicator';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import { Store } from 'lucide-react';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-red-600 bg-red-50">
      <div className="text-center">
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <p className="text-sm">{error.message}</p>
      </div>
    </div>
  );
}

const publicPaths = ['/login', '/', '/about', '/contact', '/privacy', '/privacy-policy', '/terms', '/terms-and-conditions', '/unauthorized'];

function GuardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Use a more robust check for public paths
  const isPublicPath = pathname ? (
    publicPaths.includes(pathname) || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup')
  ) : true; // Default to true during hydration if pathname is null

  if (isPublicPath) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <RoleGuard>
        {children}
      </RoleGuard>
    </AuthGuard>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <BackgroundSync />
      <SyncIndicator />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <GuardWrapper>
          {children}
        </GuardWrapper>
      </ErrorBoundary>
    </AppProvider>
  );
}
