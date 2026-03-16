'use client';

// Поскольку мы используем React Query с Next.js App Router,
// провайдер должен быть клиентским компонентом
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { getQueryClient } from '@/lib/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Получаем клиент так, чтобы он не пересоздавался при ререндерах
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools будут показаны только в режиме разработки (process.env.NODE_ENV === 'development') */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
