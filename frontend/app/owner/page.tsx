'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  HeartIcon,
  DocumentTextIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${apiBase}/api/owner/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        // Проверяем оба варианта структуры ответа
        const userData = data.user || data.data;
        if (data.success && userData) {
          setUser(userData);
        }
      }
    } catch (err) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/favicon.svg" alt="ЗооПлатформа" className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ЗооПлатформа
              </span>
            </div>

            {/* User Info or Login Button */}
            {loading ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <button
                onClick={() => router.push('/owner/dashboard')}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.first_name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                )}
                <span className="font-medium text-gray-900 hidden sm:inline">
                  {user.first_name} {user.last_name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/owner/auth')}
                className="px-3 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-8 sm:mb-12">
            <div className="mb-4 sm:mb-6">
              <img
                src="/favicon.svg"
                alt="ЗооПлатформа"
                className="w-16 h-16 sm:w-24 sm:h-24 mx-auto"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Кабинет владельца{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                животных
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Храните всю информацию о ваших питомцах в одном месте
            </p>

            <button
              onClick={() => router.push(user ? '/owner/dashboard' : '/owner/auth')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base sm:text-lg rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              {user ? 'Перейти в кабинет' : 'Начать использовать'}
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <HeartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Цифровой паспорт животного
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Создавайте подробные паспорта для каждого питомца с фото, породой, возрастом и
                особенностями
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DocumentTextIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Медицинские записи
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Ведите историю посещений ветеринара, прививок и обработок от паразитов
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Напоминания
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Получайте уведомления о предстоящих прививках и плановых обработках
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Идентификация
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Храните номера чипов, бирок и клейм для быстрой идентификации питомца
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MagnifyingGlassIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Быстрый поиск
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Находите нужную информацию о питомце за секунды
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Хронология жизни
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Полная хронология жизни вашего любимца с важными событиями и датами
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Готовы начать?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">
              Создайте аккаунт и добавьте своих питомцев прямо сейчас
            </p>
            <button
              onClick={() => router.push(user ? '/owner/dashboard' : '/owner/auth')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 text-base sm:text-lg rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              {user ? 'Перейти в кабинет' : 'Войти в кабинет'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-gray-200 bg-white/50 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p className="mb-2 text-sm sm:text-base">
              © 2026 ЗооПлатформа. Кабинет владельца животных.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Храните всю информацию о ваших питомцах в безопасности
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
