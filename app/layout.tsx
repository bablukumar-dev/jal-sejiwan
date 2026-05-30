import type {Metadata} from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css'; // Global styles
import { AppProvider } from './context/AppContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

import { AuthGuard } from '@/components/AuthGuard';
import { RoleGuard } from '@/components/RoleGuard';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://jalsejiwan.in'),
  alternates: {
    canonical: '/',
  },
  title: 'Jal Sejiwan',
  description: 'Smart Water Management Application',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <AppProvider>
          <AuthGuard>
            <RoleGuard>
              {children}
            </RoleGuard>
          </AuthGuard>
        </AppProvider>
      </body>
    </html>
  );
}
