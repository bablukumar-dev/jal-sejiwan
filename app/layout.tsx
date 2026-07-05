import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JalSejiwan',
  description: 'Smart Water Management System',
};

const isDevPreview = process.env.APP_URL && !process.env.APP_URL.includes('jalsejiwan.in');
const publishableKey = isDevPreview 
  ? 'pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW50cy5kZXYk' 
  : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={inter.className}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

