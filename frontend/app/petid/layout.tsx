import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PetID - Единая всероссийская база данных домашних животных',
  description:
    'Единая всероссийская база данных домашних животных. Цифровой паспорт, медицинские карты, прививки и полная история изменений.',
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
