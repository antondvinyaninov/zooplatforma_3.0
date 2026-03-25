'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';
import AdminLayout, { AdminTab } from '../../../../components/admin/AdminLayout';
import { BreadcrumbProvider, useBreadcrumb } from '../../../../components/BreadcrumbContext';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';

// Иконка лапки
function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-2.91-8-6.5 0-1.953 1.03-3.706 2.68-4.919M12 21c4.418 0 8-2.91 8-6.5 0-1.953-1.03-3.706-2.68-4.919M12 21V10M7 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM5 10a1.5 1.5 0 1 1 3 0A1.5 1.5 0 0 1 5 10Zm11 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>
  );
}

export function getOrgModulesKey(orgId: string) {
  return `org-modules-${orgId}`;
}

export function getActiveModules(orgId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(getOrgModulesKey(orgId)) || '[]');
  } catch { return []; }
}

/* ─── Внутренний компонент — читает breadcrumb из контекста ─── */
function OrgDashboardInner({
  orgInfo,
  tabs,
  activeTab,
  handleTabChange,
  orgUser,
  handleLogout,
  children,
}: {
  orgInfo: { name: string; logo: string };
  tabs: AdminTab[];
  activeTab: string;
  handleTabChange: (id: string) => void;
  orgUser: { email: string; name?: string; avatar?: string; role: string } | null;
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

  if (!orgUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <AdminLayout
      logoSrc={orgInfo.logo || '/favicon.svg'}
      logoText={orgInfo.name || 'Организация'}
      logoAlt={orgInfo.name || 'Организация'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      adminUser={orgUser}
      onLogout={handleLogout}
      mainSiteUrl="/"
      breadcrumb={breadcrumb}
    >
      {children}
    </AdminLayout>
  );
}

/* ─── Основной layout ─── */
export default function OrgDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const pathname = usePathname();

  const [orgUser, setOrgUser] = useState<{
    email: string;
    name?: string;
    avatar?: string;
    role: string;
  } | null>(null);
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo: string }>({ name: '', logo: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModules, setActiveModules] = useState<string[]>([]);

  // Загружаем активные модули из localStorage
  useEffect(() => {
    setActiveModules(getActiveModules(orgId));
    const handler = () => setActiveModules(getActiveModules(orgId));
    window.addEventListener('org-modules-changed', handler);
    return () => window.removeEventListener('org-modules-changed', handler);
  }, [orgId]);

  // Определяем активный таб по URL
  useEffect(() => {
    if (pathname.includes('/dashboard')) setActiveTab('dashboard');
    else if (pathname.includes('/organization')) setActiveTab('organization');
    else if (pathname.includes('/pets')) setActiveTab('pets');
    else if (pathname.includes('/modules')) setActiveTab('modules');
    else if (pathname.includes('/staff')) setActiveTab('staff');
    else if (pathname.includes('/settings')) setActiveTab('settings');
    else setActiveTab('dashboard');
  }, [pathname]);

  // Проверяем авторизацию и загружаем данные
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [meRes, orgsRes] = await Promise.all([
          fetch('/api/owner/auth/me', { credentials: 'include' }),
          fetch('/api/org/my', { credentials: 'include' }),
        ]);

        if (!meRes.ok) { window.location.href = '/org/auth'; return; }
        const meData = await meRes.json();
        const userData = meData.user || meData.data || meData;

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          const currentOrg = (orgsData.data || []).find(
            (o: { id: number }) => String(o.id) === String(orgId)
          );
          if (currentOrg) setOrgInfo({ name: currentOrg.name || '', logo: currentOrg.logo || '' });
        }

        const memberRes = await fetch(`/api/org/${orgId}/membership`, { credentials: 'include' });
        if (!memberRes.ok) { alert('У вас нет доступа к этой организации.'); router.push('/org'); return; }
        const memberData = await memberRes.json();

        setOrgUser({
          email: userData.email || '',
          name: userData.name || userData.first_name,
          avatar: userData.avatar || userData.avatar_url,
          role: memberData.role || 'member',
        });
      } catch (e) {
        console.error('Auth check failed:', e);
        window.location.href = '/org/auth';
      }
    };
    checkAuth();
  }, [orgId, router]);

  const baseTabs: AdminTab[] = [
    { id: 'dashboard', label: 'Главная', icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'organization', label: 'Организация', icon: <BuildingOfficeIcon className="w-5 h-5" /> },
  ];

  const moduleTabs: AdminTab[] = [];
  if (activeModules.includes('pets')) {
    moduleTabs.push({ id: 'pets', label: 'Питомцы', icon: <PawIcon className="w-5 h-5" /> });
  }

  const systemTabs: AdminTab[] = [
    { id: 'modules', label: 'Модули', icon: <PuzzlePieceIcon className="w-5 h-5" /> },
    { id: 'staff', label: 'Сотрудники', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Настройки', icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  const tabs = [...baseTabs, ...moduleTabs, ...systemTabs];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const routes: Record<string, string> = {
      dashboard: `/org/${orgId}/dashboard`,
      organization: `/org/${orgId}/organization`,
      pets: `/org/${orgId}/pets`,
      modules: `/org/${orgId}/modules`,
      staff: `/org/${orgId}/staff`,
      settings: `/org/${orgId}/settings`,
    };
    if (routes[tabId]) router.push(routes[tabId]);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/owner/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/org';
    }
  };

  return (
    <BreadcrumbProvider>
      <OrgDashboardInner
        orgInfo={orgInfo}
        tabs={tabs}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        orgUser={orgUser}
        handleLogout={handleLogout}
      >
        {children}
      </OrgDashboardInner>
    </BreadcrumbProvider>
  );
}
