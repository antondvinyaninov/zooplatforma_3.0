'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminLayout, { AdminTab } from '../../../components/admin/AdminLayout';
import { ChartBarIcon, BookOpenIcon, HeartIcon } from '@heroicons/react/24/outline';
import { BreadcrumbProvider, useBreadcrumb } from '../../../components/BreadcrumbContext';

// Внутренний компонент для чтения хлебных крошек из контекста
function PetidDashboardInner({
  tabs,
  activeTab,
  handleTabChange,
  adminUser,
  handleLogout,
  children,
}: {
  tabs: AdminTab[];
  activeTab: string;
  handleTabChange: (id: string) => void;
  adminUser: { email: string; name?: string; avatar?: string; role: string };
  handleLogout: () => void;
  children: React.ReactNode;
}) {
  const { items } = useBreadcrumb();
  const router = useRouter();

  const breadcrumb = items.length > 0 ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ color: '#d1d5db', fontSize: 13 }}>/</span>}
          {item.href
            ? <button onClick={() => router.push(item.href!)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', padding: 0 }}>{item.label}</button>
            : <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{item.label}</span>
          }
        </span>
      ))}
    </div>
  ) : null;

  return (
    <AdminLayout
      logoSrc="/logo.svg"
      logoText="PetID"
      logoAlt="PetID - База данных питомцев"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      adminUser={adminUser}
      onLogout={handleLogout}
      mainSiteUrl="/"
      breadcrumb={breadcrumb}
    >
      {children}
    </AdminLayout>
  );
}

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
    // Проверка авторизации через основной API
    const checkAuth = async () => {
      try {
        const response = await fetch(`/main/api/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.user || data.data;

          console.log('🔍 Layout auth check:', data);

          if (data.success && userData && userData.email) {
            // Проверяем суперпользователя по email
            const hasSuperAdmin = userData.email === 'anton@dvinyaninov.ru';

            if (!hasSuperAdmin) {
              alert('Доступ запрещен. Требуются права суперадмина.');
              router.push('/main/auth?redirect=/petid/dashboard');
              return;
            }

            setAdminUser({
              email: userData.email,
              name: userData.name || userData.first_name,
              avatar: userData.avatar || userData.avatar_url,
              role: 'superadmin',
            });
          } else {
            router.push('/main/auth?redirect=/petid/dashboard');
          }
        } else {
          router.push('/main/auth?redirect=/petid/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/main/auth?redirect=/petid/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Определяем активную вкладку по URL
    if (pathname.includes('/breeds')) {
      setActiveTab('reference');
    } else if (pathname.includes('/pets')) {
      setActiveTab('pets');
    } else {
      setActiveTab('dashboard');
    }
  }, [pathname]);

  const tabs: AdminTab[] = [
    {
      id: 'dashboard',
      label: 'Дашборд',
      icon: <ChartBarIcon className="w-5 h-5" />,
    },
    {
      id: 'pets',
      label: 'Питомцы',
      icon: <HeartIcon className="w-5 h-5" />,
    },
    {
      id: 'reference',
      label: 'Справочник',
      icon: <BookOpenIcon className="w-5 h-5" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Навигация по табам
    const routes: Record<string, string> = {
      dashboard: '/petid/dashboard',
      reference: '/petid/breeds',
      pets: '/petid/pets',
    };

    if (routes[tabId]) {
      router.push(routes[tabId]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`/main/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/main/auth?redirect=/petid');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/main/auth?redirect=/petid');
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
      <PetidDashboardInner
        tabs={tabs}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        adminUser={adminUser}
        handleLogout={handleLogout}
      >
        {children}
      </PetidDashboardInner>
    </BreadcrumbProvider>
  );
}
