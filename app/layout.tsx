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

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
