import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';
import { PwaRegister } from '@/components/PwaRegister';

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

export const metadata: Metadata = {
  title: 'JalSejiwan - Smart Water Management',
  description: 'Smart Water Delivery, Inventory & Customer Management Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JalSejiwan',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${lora.variable}`}>
      <body>
        <PwaRegister />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


