'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || 'Произошла ошибка при отправке запроса');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

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
              Восстановление пароля
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm">
                Введите ваш E-mail, и мы отправим вам ссылку для сброса пароля.
              </p>
            </div>

      {success ? (
        <div className="text-center space-y-6">
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
            Письмо со ссылкой для восстановления пароля успешно отправлено на указанную почту. 
            Пожалуйста, проверьте папку &quot;Входящие&quot; (и на всякий случай &quot;Спам&quot;).
          </div>
          <Link
            href="/main/auth"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Вернуться ко входу
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="example@mail.ru"
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
            disabled={isLoading || !email}
            className={`w-full py-3 text-white rounded-xl font-medium transition-all ${
              isLoading || !email
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow active:scale-[0.98]'
            }`}
          >
            {isLoading ? 'Отправка...' : 'Отправить ссылку'}
          </button>

          <div className="text-center pt-2">
            <Link href="/main/auth" className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
              Я вспомнил пароль
            </Link>
          </div>
        </form>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
