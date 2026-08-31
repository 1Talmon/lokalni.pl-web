import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lokalni.pl — Znajdź specjalistę w swoim mieście',
    template: '%s — Lokalni.pl',
  },
  description: 'Lokalni.pl to platforma łącząca mieszkańców z lokalnymi specjalistami. Sprzątanie, remonty, korepetycje, uroda i setki innych usług w Twoim mieście.',
  metadataBase: new URL('https://mylokalni.pl'),
  openGraph: {
    siteName: 'Lokalni.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
