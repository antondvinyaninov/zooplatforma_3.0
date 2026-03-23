'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '../../../components/shared/AuthForm';

export default function GovCabinetAuth() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const res = await fetch(`${apiBase}/api/owner/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (!result.success) {
        return { success: false, error: result.error || 'Неверный email или пароль' };
      }

      router.push('/gov');
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  return (
    <div>
      <AuthForm
        mode="login"
        showTabs={false}
        onSubmit={handleSubmit}
        logoText="ЗооПлатформа"
        logoAlt="ЗооПлатформа — Кабинет государственного органа"
        subtitle="Войдите в кабинет государственного органа"
        infoTitle="🏛️ Кабинет госоргана"
        infoText="Реестр, надзор и отчётность по организациям"
        showVKLogin={false}
        onVKSuccess={() => router.push('/gov')}
        onVKError={() => {}}
      />
    </div>
  );
}
