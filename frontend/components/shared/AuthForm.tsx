'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  mode?: AuthMode;
  showTabs?: boolean;
  onSubmit: (data: {
    name?: string;
    email: string;
    password: string;
    mode: AuthMode;
  }) => Promise<{ success: boolean; error?: string }>;
  logoText?: string;
  logoAlt?: string;
  subtitle?: string;
  infoTitle?: string;
  infoText?: string;
  showVKLogin?: boolean;
}

export default function AuthForm({
  mode: initialMode = 'login',
  showTabs = true,
  onSubmit,
  logoText = 'Зооплатформа',
  logoAlt = 'Зооплатформа',
  subtitle,
  infoTitle = '💡 Для тестирования:',
  infoText,
  showVKLogin = true,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }

      if (password.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        return;
      }
    }

    setIsLoading(true);

    const result = await onSubmit({
      name: mode === 'register' ? name : undefined,
      email,
      password,
      mode,
    });

    if (!result.success) {
      setError(result.error || `Ошибка ${mode === 'login' ? 'входа' : 'регистрации'}`);
    }

    setIsLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const defaultSubtitle = mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт';
  const defaultInfoText =
    mode === 'login'
      ? 'Используйте существующий аккаунт или создайте новый во вкладке "Регистрация"'
      : 'Создайте новый аккаунт, затем войдите во вкладке "Вход"';

  const handleVKLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${apiBase}/api/auth/vk/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/favicon.svg" alt={logoAlt} width={48} height={48} />
            <h1 className="text-3xl font-bold text-gray-900 uppercase">{logoText}</h1>
          </div>
          <p className="text-gray-600">{subtitle || defaultSubtitle}</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          {showTabs && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={mode === 'login' ? { borderColor: '#1B76FF', color: '#1B76FF' } : {}}
              >
                Вход
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={mode === 'register' ? { borderColor: '#1B76FF', color: '#1B76FF' } : {}}
              >
                Регистрация
              </button>
            </div>
          )}

          {!showTabs && (
            <div className="flex border-b border-gray-200">
              <button
                className="flex-1 px-6 py-3 text-sm font-medium border-b-2"
                style={{ borderColor: '#1B76FF', color: '#1B76FF' }}
              >
                Вход
              </button>
            </div>
          )}

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (только для регистрации) */}
              {mode === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#1B76FF' } as React.CSSProperties}
                    placeholder="Ваше имя"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#1B76FF' } as React.CSSProperties}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#1B76FF' } as React.CSSProperties}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password (только для регистрации) */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#1B76FF' } as React.CSSProperties}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1B76FF' }}
              >
                {isLoading
                  ? mode === 'login'
                    ? 'Вход...'
                    : 'Регистрация...'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Зарегистрироваться'}
              </button>
            </form>

            {/* VK Login Button */}
            {showVKLogin && mode === 'login' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">или</span>
                  </div>
                </div>

                <button
                  onClick={handleVKLogin}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0077FF] text-white rounded-lg hover:bg-[#0066DD] transition-colors font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.574-1.496c.586-.19 1.341 1.26 2.138 1.815.605.421 1.064.329 1.064.329l2.137-.03s1.117-.071.587-.968c-.044-.074-.31-.665-1.597-1.88-1.349-1.273-1.168-1.067.457-3.271.99-1.341 1.387-2.16 1.263-2.51-.118-.334-.844-.246-.844-.246l-2.406.015s-.178-.025-.31.056c-.13.079-.213.263-.213.263s-.382 1.037-.89 1.92c-1.07 1.86-1.499 1.96-1.674 1.844-.408-.267-.306-1.072-.306-1.644 0-1.786.265-2.53-.517-2.724-.26-.064-.452-.107-1.118-.114-.854-.009-1.577.003-1.986.208-.272.136-.482.44-.354.458.158.022.516.099.706.363.245.341.236 1.107.236 1.107s.141 2.102-.329 2.364c-.324.18-.768-.187-1.722-1.865-.488-.864-.857-1.82-.857-1.82s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.286.015s-.343.01-.469.162c-.112.135-.009.413-.009.413s1.797 4.289 3.831 6.453c1.867 1.986 3.986 1.854 3.986 1.854h.961z" />
                  </svg>
                  Войти через VK
                </button>
              </>
            )}
          </div>
        </div>

        {/* Test Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">{infoTitle}</h3>
          <p className="text-sm text-blue-800">{infoText || defaultInfoText}</p>
        </div>
      </div>
    </div>
  );
}
