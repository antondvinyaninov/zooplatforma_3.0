'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { authApi } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function CompleteRegistrationPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Если у пользователя уже нормальный email, отправляем его в feed
  if (user && !user.email.includes('@vk.placeholder')) {
    router.push('/main/feed');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Пожалуйста, введите корректный Email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.updateEmail(email);
      
      if (response.success) {
        toast.success('Email успешно сохранен!');
        await refreshUser(); // Обновляем данные профиля (чтобы email обновился в контексте)
        router.push('/main/feed'); // Уводим на главную шторку спадет сама
      } else {
        setError(response.error || 'Не удалось сохранить Email. Возможно, он уже занят.');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-gray-100 relative overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-60"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-50">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Один последний шаг</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            ВКонтакте не передал ваш Email-адрес. Для безопасности аккаунта и возможности восстановления доступа, пожалуйста, укажите вашу почту.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Ваш Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.ru"
              className="block w-full px-4 py-3 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}`}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : null}
            {loading ? 'Сохранение...' : 'Сохранить и продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
}
