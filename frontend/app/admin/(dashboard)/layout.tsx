'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout, { AdminTab } from '../../../components/admin/AdminLayout';
import {
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  ServerIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<{
    email: string;
    name?: string;
    avatar?: string;
    role: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Проверка авторизации через admin API
    const checkAuth = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiBase}/main/api/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Layout auth check:', data);

          const userData = data.user || data.data;
          if (data.success && userData) {
            const userRole = userData.role;
            const userEmail = userData.email;
            const userRoles = userData.roles || [];
            const roles = userRoles.length > 0 ? userRoles : userRole ? [userRole] : [];

            console.log('🔍 User roles in layout:', roles);

            // Hardcode superadmin logic for anton@dvinyaninov.ru until monolith exposes roles natively
            if (!roles.includes('superadmin') && userEmail !== 'anton@dvinyaninov.ru') {
              alert('Доступ запрещен. Требуются права администратора.');
              window.location.href = '/main/auth?redirect=/admin/dashboard';
              return;
            }

            setAdminUser({
              email: userData.email,
              name: userData.name || userData.first_name,
              avatar: userData.avatar || userData.avatar_url,
              role: userEmail === 'anton@dvinyaninov.ru' ? 'superadmin' : userRole || 'admin',
            });
          } else {
            window.location.href = '/main/auth?redirect=/admin/dashboard';
          }
        } else {
          window.location.href = '/main/auth?redirect=/admin/dashboard';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/main/auth?redirect=/admin/dashboard';
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Определяем активную вкладку по URL
    if (pathname.includes('/dashboard')) {
      setActiveTab('dashboard');
    } else if (pathname.includes('/posts')) {
      setActiveTab('posts');
    } else if (pathname.includes('/logs')) {
      setActiveTab('logs');
    } else if (pathname.includes('/monitoring')) {
      setActiveTab('health');
    } else if (pathname.includes('/organizations')) {
      setActiveTab('organizations');
    } else if (pathname.includes('/moderation')) {
      setActiveTab('moderation');
    } else if (pathname.includes('/users')) {
      setActiveTab('users');
    } else if (pathname.includes('/support')) {
      setActiveTab('support');
    } else if (pathname.includes('/reviews')) {
      setActiveTab('reviews');
    } else {
      setActiveTab('dashboard'); // По умолчанию
    }
  }, [pathname]);

  const tabs: AdminTab[] = [
    {
      id: 'dashboard',
      label: 'Дашборд',
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Пользователи',
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      id: 'posts',
      label: 'Посты',
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      id: 'moderation',
      label: 'Модерация',
      icon: <FlagIcon className="w-5 h-5" />,
    },
    {
      id: 'logs',
      label: 'Логирование',
      icon: <DocumentDuplicateIcon className="w-5 h-5" />,
    },
    {
      id: 'organizations',
      label: 'Организации',
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
    },
    {
      id: 'health',
      label: 'Мониторинг',
      icon: <ServerIcon className="w-5 h-5" />,
    },
    {
      id: 'support',
      label: 'Поддержка',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      id: 'reviews',
      label: 'Отзывы (NPS)',
      icon: <StarIcon className="w-5 h-5" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Навигация по табам
    const routes: Record<string, string> = {
      dashboard: '/admin/dashboard',
      users: '/admin/users',
      posts: '/admin/posts',
      moderation: '/admin/moderation',
      logs: '/admin/logs',
      organizations: '/admin/organizations',
      health: '/admin/monitoring',
      support: '/admin/support',
      reviews: '/admin/reviews',
    };

    if (routes[tabId]) {
      router.push(routes[tabId]);
    }
  };

  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiBase}/main/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/main/auth';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/main/auth';
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
    <AdminLayout
      logoSrc="/logo.svg"
      logoText="ЗооАдминка"
      logoAlt="ЗооПлатформа Админка"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      adminUser={adminUser}
      onLogout={handleLogout}
      mainSiteUrl="http://localhost:3000"
    >
      {children}
    </AdminLayout>
  );
}
