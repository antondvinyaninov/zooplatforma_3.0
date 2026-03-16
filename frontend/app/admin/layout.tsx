import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ЗооАдминка',
  description: 'Панель администратора ЗооПлатформы',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
