'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Отсутствует токен для восстановления пароля. Пожалуйста, запросите новую ссылку.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', {
        token,
        password
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/main/auth');
        }, 3000);
      } else {
        setError(response.error || 'Срок действия ссылки истёк или она неверна. Запросите новую ссылку.');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Неверная ссылка</h1>
        <p className="text-gray-500 mb-6 text-sm">В ссылке отсутствует токен восстановления.</p>
        <Link href="/main/forgot-password" className="text-blue-600 font-medium hover:underline">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <p className="text-gray-500 text-sm">Придумайте надежный пароль</p>
      </div>

      {success ? (
        <div className="text-center space-y-6">
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
            Ваш пароль успешно изменен! Вы будете перенаправлены на страницу входа через 3 секунды...
          </div>
          <Link
            href="/main/auth"
            className="block w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Войти сейчас
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Новый пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className={`w-full py-3 text-white rounded-xl font-medium transition-all ${
              isLoading || !password || !confirmPassword
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/favicon.svg" alt="Зооплатформа" width={48} height={48} />
            <h1 className="text-3xl font-bold text-gray-900 uppercase">Зооплатформа</h1>
          </div>
          <p className="text-gray-600">Система восстановления</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              className="flex-1 px-6 py-3 text-sm font-medium border-b-2"
              style={{ borderColor: '#1B76FF', color: '#1B76FF' }}
            >
              Новый пароль
            </button>
          </div>

          <Suspense fallback={<div className="p-8 text-center py-12 text-gray-500">Загрузка...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
