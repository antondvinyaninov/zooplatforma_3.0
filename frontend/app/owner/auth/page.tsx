'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '../../../components/shared/AuthForm';
import VKIDButton from '../../../components/auth/VKIDButton';

export default function AdminAuth() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      // Логинимся через тот же эндпоинт что и main-frontend
      const loginResponse = await fetch(`${apiBase}/api/owner/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResult.success) {
        return { success: false, error: loginResult.error || 'Неверный email или пароль' };
      }

      // Успешный вход - редирект в кабинет
      router.push('/owner/dashboard');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  const handleVKSuccess = () => {
    router.push('/owner/dashboard');
  };

  const handleVKError = (error: any) => {
    console.error('VK Auth Error:', error);
  };

  return (
    <div>
      <AuthForm
        mode="login"
        showTabs={false}
        onSubmit={handleSubmit}
        logoText="ЗооПлатформа"
        logoAlt="ЗооПлатформа - Кабинет владельца"
        subtitle="Войдите в кабинет владельца животных"
        infoTitle="🐾 Кабинет владельца"
        infoText="Управляйте информацией о ваших питомцах"
        showVKLogin={false}
      />

      {/* VK ID Button */}
      <div className="max-w-md mx-auto mt-4">
        <VKIDButton onSuccess={handleVKSuccess} onError={handleVKError} />
      </div>
    </div>
  );
}
