'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { authApi } from '../../../../lib/api';

export default function CompleteRegistrationPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState<'email' | 'merge_offer' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Если у пользователя уже нормальный email, отправляем его в feed
  if (user && user.email && !user.email.includes('@vk.placeholder')) {
    router.push('/main/feed');
    return null;
  }

  const handleSubmitEmail = async (e: React.FormEvent) => {
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
        showToast('success', 'Email успешно сохранен!');
        await refreshUser(); // Обновляем данные профиля (чтобы email обновился в контексте)
        router.push('/main/feed'); // Уводим на главную шторку спадет сама
      } else if (response.merge_required) {
        setStep('merge_offer');
      } else {
        setError(response.error || 'Не удалось сохранить Email. Возможно, он уже занят.');
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.mergeRequest(email);
      if (response.success) {
        setStep('code');
        showToast('info', 'Код отправлен на вашу почту');
      } else {
        setError(response.error || 'Не удалось отправить код');
      }
    } catch (err) {
      setError('Произошла ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Код должен состоять из 6 цифр');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await authApi.mergeConfirm(email, code);
      if (response.success) {
        showToast('success', 'Профили успешно объединены!');
        await refreshUser();
        router.push('/main/feed');
      } else {
        setError(response.error || 'Неверный код подтверждения');
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
            {step === 'email' ? (
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : step === 'merge_offer' ? (
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'email' ? 'Один последний шаг' : step === 'merge_offer' ? 'Аккаунт уже существует' : 'Подтверждение'}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {step === 'email' 
              ? 'ВКонтакте не передал ваш Email-адрес. Для безопасности аккаунта и возможности восстановления доступа, пожалуйста, укажите вашу почту.' 
              : step === 'merge_offer'
              ? `Email ${email} уже зарегистрирован на нашей платформе. Вы можете объединить этот VK профиль с вашим существующим аккаунтом.`
              : `Мы отправили 6-значный код подтверждения на ${email}. Введите его ниже.`}
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-6">
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
                {loading ? 'Сохранение...' : 'Сохранить и продолжить'}
              </button>
            </form>
          )}

          {step === 'merge_offer' && (
            <div className="space-y-4">
              <button
                onClick={handleMergeRequest}
                disabled={loading}
                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}`}
              >
                {loading ? 'Отправка...' : 'Отправить код и объединить'}
              </button>
              
              <button
                onClick={() => setStep('email')}
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Указать другой Email
              </button>
            </div>
          )}

          {step === 'code' && (
            <form onSubmit={handleMergeConfirm} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Код из письма
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="block w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-lg rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}`}
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('merge_offer')}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Вернуться назад
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
