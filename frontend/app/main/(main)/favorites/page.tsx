'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FavoritesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Редирект на главную страницу
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-6xl mb-4">🔄</div>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}
