import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['700', '800'],
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '500'],
  display: 'swap',
});

let baseUrlString = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://jalsejiwan.in';
if (baseUrlString.startsWith('http://')) {
  baseUrlString = baseUrlString.replace('http://', 'https://');
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrlString),
  title: {
    default: 'JalSejiwan - Smart Water Management',
    template: '%s | JalSejiwan',
  },
  description: 'Smart Water Delivery, Inventory & Customer Management Platform',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'JalSejiwan - Smart Water Management',
    description: 'Smart Water Delivery, Inventory & Customer Management Platform',
    siteName: 'JalSejiwan',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'JalSejiwan Brand Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'JalSejiwan - Smart Water Management',
    description: 'Smart Water Delivery, Inventory & Customer Management Platform',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${lora.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


