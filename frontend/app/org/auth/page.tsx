'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '../../../components/shared/AuthForm';

export default function OrgCabinetAuth() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
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

      router.push('/org');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  const handleVKSuccess = () => {
    router.push('/org');
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
        logoAlt="ЗооПлатформа - Кабинет организации"
        subtitle="Войдите в кабинет организации"
        infoTitle="🏢 Кабинет организации"
        infoText="Управляйте своей организацией на платформе"
        showVKLogin={true}
        onVKSuccess={handleVKSuccess}
        onVKError={handleVKError}
      />
    </div>
  );
}
