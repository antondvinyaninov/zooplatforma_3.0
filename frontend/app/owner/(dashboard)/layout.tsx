'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout, { AdminTab } from '../../../components/admin/AdminLayout';
import { BreadcrumbProvider } from '../../../components/BreadcrumbContext';
import { ChartBarIcon, BookOpenIcon, HeartIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<{
    email: string;
    name?: string;
    last_name?: string;
    avatar?: string;
    role: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Проверка авторизации через owner API
    const checkAuth = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiBase}/api/owner/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();

          // Данные приходят в data.data, а не в data.user
          const userData = data.user || data.data;

          if (data.success && userData) {
            const user = {
              email: userData.email,
              name: userData.name || userData.first_name,
              last_name: userData.last_name,
              avatar: userData.avatar || userData.avatar_url,
              role: userData.role || 'user',
            };
            setAdminUser(user);
          } else {
            router.push('/owner/auth');
          }
        } else {
          router.push('/owner/auth');
        }
      } catch (error) {
        router.push('/owner/auth');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Определяем активную вкладку по URL
    if (pathname.includes('/dashboard')) {
      setActiveTab('dashboard');
    } else if (pathname.includes('/pets')) {
      setActiveTab('pets');
    } else {
      setActiveTab('dashboard'); // По умолчанию дашборд
    }
  }, [pathname]);

  const tabs: AdminTab[] = [
    {
      id: 'dashboard',
      label: 'Главная',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      id: 'pets',
      label: 'Мои питомцы',
      icon: <HeartIcon className="w-5 h-5" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Навигация по табам
    if (tabId === 'dashboard') {
      router.push('/owner/dashboard');
    } else if (tabId === 'pets') {
      router.push('/owner/pets');
    }
  };

  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiBase}/api/owner/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/owner/auth');
    } catch (error) {
      router.push('/owner/auth');
    }
  };

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <BreadcrumbProvider>
      <AdminLayout
        logoSrc="/favicon.svg"
        logoText="ЗооПлатформа"
        logoAlt="ЗооПлатформа - Кабинет владельца"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        adminUser={adminUser}
        onLogout={handleLogout}
        mainSiteUrl="https://zooplatforma.ru"
        breadcrumb={true}
      >
        {children}
      </AdminLayout>
    </BreadcrumbProvider>
  );
}
