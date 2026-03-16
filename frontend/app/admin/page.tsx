'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${apiBase}/main/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data.data;

        if (data.success && userData && userData.email) {
          const userRole = userData.role;
          const userRoles = userData.roles || [];
          const roles = userRoles.length > 0 ? userRoles : userRole ? [userRole] : [];
          const hasSuperAdmin = roles.includes('superadmin') || userData.email === 'anton@dvinyaninov.ru';

          if (hasSuperAdmin) {
            setUser(userData);
          } else {
             // User is logged in but has no superadmin permissions. Force logout / login view.
             console.log('No superadmin access for', userData.email);
          }
        }
      }
    } catch (err) {
      // Игнорируем сетевые ошибки, пользователь просто останется неавторизованным
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return '';
    const name = user.name || user.first_name || '';
    if (!name) return 'A';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                ЗооАдминка
              </span>
            </div>

            {/* User Info or Login Button */}
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                )}
                <span className="font-medium text-gray-900 hidden sm:inline">
                  {user.name || 'Администратор'}
                </span>
                <span className="ml-2 text-sm text-blue-600 font-medium">В панель →</span>
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/main/auth?redirect=/admin/dashboard'}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center">
        <div className="text-center w-full">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Панель Управления <br />
              <span className="text-blue-600">ЗооПлатформой</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10">
              Централизованный доступ для администраторов. Управление пользователями, модерация контента, работа с базами данных и мониторинг состояния системы.
            </p>

            {!user && !loading && (
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 mx-auto max-w-md">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Требуется авторизация</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Для доступа к инструментам администратора необходимо войти под учетной записью с соответствующими правами.
                </p>
                <button
                  onClick={() => window.location.href = '/main/auth?redirect=/admin/dashboard'}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                  Авторизоваться через единый профиль
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2026 ЗооПлатформа Администрация. Все системы работают в штатном режиме.</p>
        </div>
      </footer>
    </div>
  );
}
