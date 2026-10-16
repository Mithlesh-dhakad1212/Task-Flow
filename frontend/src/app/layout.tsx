import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { type ReactNode } from 'react';
import { themeBootScript } from '@/lib/theme';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TaskFlow', template: '%s · TaskFlow' },
  description: 'A simple workspace to manage projects, tasks and progress.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#11121c' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The boot script sets `dark` / data-accent before hydration, hence the warning suppression.
    <html lang="en" className={inter.variable} data-accent="violet" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
