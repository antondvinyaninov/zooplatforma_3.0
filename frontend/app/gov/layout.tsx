import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Государственный кабинет — ЗооПлатформа',
  description:
    'Кабинет контролирующего органа на ЗооПлатформе. Реестр организаций, отчёты, надзор.',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function GovRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
