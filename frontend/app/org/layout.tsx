import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Кабинет организации — ЗооПлатформа',
  description:
    'Личный кабинет организации на ЗооПлатформе. Управление профилем, животными, командой и настройками.',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function OrgCabinetRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
