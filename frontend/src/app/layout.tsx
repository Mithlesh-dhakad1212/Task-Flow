import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { type ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TaskFlow', template: '%s · TaskFlow' },
  description: 'A simple workspace to manage projects, tasks and progress.',
};

export const viewport: Viewport = {
  themeColor: '#0f1b2d',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
