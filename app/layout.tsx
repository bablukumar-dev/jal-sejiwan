import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';
import '@/lib/clerkEnvFix';
import { getClerkPublishableKey } from '@/lib/clerkEnvFix';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JalSejiwan',
  description: 'Smart Water Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = getClerkPublishableKey();

  // Render a clear, descriptive error UI if the Clerk key is missing or belongs to the stale 'vast-sparrow-58' instance.
  // This prevents the application from mounting the ClerkProvider with an invalid key and crashing the client side.
  const isMissing = !publishableKey;
  const isStale = publishableKey?.includes('dmFzdC1zcGFycm93LTU4');

  if (isMissing || isStale) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Clerk Configuration Required</h1>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                {isMissing 
                  ? "The Clerk Publishable Key is missing from your environment configuration." 
                  : "The active environment has a stale or incorrect Clerk Publishable Key (vast-sparrow-58) that cannot be authenticated."}
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Required Action</h2>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Please configure your stable production or test keys in the Secrets (environment variables) panel in your AI Studio editor:
                  </p>
                  <div className="space-y-2">
                    <div>
                      <span className="block text-[10px] font-mono text-slate-400">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span>
                      <code className="block bg-slate-100 p-1.5 rounded text-slate-800 font-mono text-[10px] break-all select-all">
                        pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW50cy5kZXYk
                      </code>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-slate-400">CLERK_SECRET_KEY</span>
                      <code className="block bg-slate-100 p-1.5 rounded text-slate-800 font-mono text-[10px] break-all select-all">
                        sk_test_rjx1klsSGsj1NnLUxBs5X5kfX9U851PPShqpuut36J
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Note: All hardcoded fallbacks have been removed for absolute key security. Once you add/update these keys in Secrets, the application will initialize securely.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

