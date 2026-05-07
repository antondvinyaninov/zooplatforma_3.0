'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import VKIDButton from '../auth/VKIDButton';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

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
  onVKSuccess?: (data: any) => void;
  onVKError?: (error: any) => void;
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
  onVKSuccess,
  onVKError,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleVKSuccess = (data: any) => {
    // В случае успешного логина перезагружаем страницу или кидаем эвент
    // AuthForm уже получает onSubmit (который мы тут не можем напрямую переиспользовать), 
    // но в родительских компонентах обычно есть handleVKSuccess. 
    // Для простоты, сделаем redirect через window.location как это было в page.tsx (который мы видели)
    // Но лучше прокинуть onSuccess/onError в пропсы. Давай прокинем!
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
                  <Label htmlFor="name" className="mb-2 block">
                    Имя
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ваше имя"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<EnvelopeIcon className="w-5 h-5" />}
                  placeholder="your@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="mb-2 block">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    icon={<LockClosedIcon className="w-5 h-5" />}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="mt-2 text-right">
                    <Link
                      href="/main/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
                )}
              </div>

              {/* Confirm Password (только для регистрации) */}
              {mode === 'register' && (
                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="mb-2 block"
                  >
                    Подтвердите пароль
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      icon={<LockClosedIcon className="w-5 h-5" />}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
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
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading
                  ? mode === 'login'
                    ? 'Вход...'
                    : 'Регистрация...'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Зарегистрироваться'}
              </Button>
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

                <div className="mt-4">
                  <VKIDButton
                    onSuccess={onVKSuccess}
                    onError={onVKError}
                    showAlternativeLogin={false}
                    oauthList={[]}
                  />
                </div>
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
