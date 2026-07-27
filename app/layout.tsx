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

export const metadata: Metadata = {
  title: 'JalSejiwan - Smart Water Management',
  description: 'Smart Water Delivery, Inventory & Customer Management Platform',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
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


