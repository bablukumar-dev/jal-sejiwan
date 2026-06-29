import type {Metadata} from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import Script from 'next/script';
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
import BackgroundSync from '@/components/BackgroundSync';
import SyncIndicator from '@/components/SyncIndicator';
import ReCaptchaProvider from '@/components/ReCaptchaProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://jalsejiwan.in'),
  alternates: {
    canonical: '/',
  },
  title: 'Water Delivery Management Software India | JalSejiwan',
  description: 'JalSejiwan is a Water Delivery Management Software India built for 20 litre water jar businesses. Manage billing, delivery tracking, inventory and WhatsApp reminders in one powerful digital platform.',
  keywords: [
    'Water Delivery Management Software India',
    '20 litre water jar software',
    'Water distribution app',
    'Water supply business app',
    '20 Litre Water Jar Delivery System',
    'Water Can Billing Software',
    'Water Distribution Management System',
    'Water Delivery ERP India',
    'Digital Solution for Water Suppliers',
    'JalSejiwan'
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="keywords" content="Water Delivery Management Software India, 20 litre water jar software, Water distribution app, Water supply business app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "JalSejiwan",
              "url": "https://jalsejiwan.in",
              "logo": "https://jalsejiwan.in/logo.png"
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <ReCaptchaProvider />
        <AppProvider>
          <BackgroundSync />
          <SyncIndicator />
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

