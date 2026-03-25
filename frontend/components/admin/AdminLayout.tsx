'use client';

import { ReactNode, useState, useEffect } from 'react';
import {
  BellIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/utils';
import { useBreadcrumb } from '../BreadcrumbContext';

export interface AdminTab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface AdminLayoutProps {
  logoSrc: string;
  logoText: string;
  logoAlt: string;
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  adminUser?: { email: string; name?: string; avatar?: string; role: string } | null;
  onLogout?: () => void;
  mainSiteUrl?: string;
  breadcrumb?: ReactNode;
}

export default function AdminLayout({
  logoSrc,
  logoText,
  logoAlt,
  tabs,
  activeTab,
  onTabChange,
  children,
  adminUser,
  onLogout,
  mainSiteUrl = '/main',
  breadcrumb,
}: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { items: breadcrumbItems } = useBreadcrumb();
  
  const defaultBreadcrumb = breadcrumbItems.length > 0 ? (
    <div className="flex items-center gap-1.5 text-[13px]">
      {breadcrumbItems.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-gray-500 hover:text-gray-800 transition-colors no-underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  ) : null;

  const finalBreadcrumb = breadcrumb === true || (!breadcrumb && breadcrumbItems.length > 0) ? defaultBreadcrumb : breadcrumb;

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-wrapper')) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const sidebarW = sidebarCollapsed ? 56 : 200;

  return (
    <div className="flex h-screen bg-[#eff2f7] overflow-hidden w-full" style={{ zoom: 1.1 }}>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — полная высота */}
      <aside
        style={{ width: sidebarW }}
        className={`
          bg-transparent flex flex-col flex-shrink-0 transition-all duration-300 h-screen border-r border-gray-200
          max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:h-screen max-lg:z-50 max-lg:bg-[#eff2f7]
          ${mobileMenuOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
      >
        {/* Лого + название */}
        <div className={`flex items-center gap-2 px-3 flex-shrink-0 ${sidebarCollapsed ? 'justify-center py-4' : 'py-4'}`}>
          {logoSrc && logoSrc !== '/favicon.svg' ? (
            <img src={logoSrc} alt={logoAlt} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {logoText?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          {!sidebarCollapsed && (
            <span className="text-xs font-semibold text-gray-800 truncate">{logoText}</span>
          )}
        </div>


        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {isClient ? (
            <>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`
                    w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-200 border-none cursor-pointer whitespace-nowrap
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    hover:bg-gray-200
                  `}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  title={tab.label}
                >
                  <div className="w-5 h-5 flex-shrink-0 text-gray-600">
                    {tab.icon}
                  </div>
                  {!sidebarCollapsed && (
                    <span className={`text-sm text-gray-700 ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>
                      {tab.label}
                    </span>
                  )}
                </button>
              ))}
            </>
          ) : (
            <div className="h-[200px]" />
          )}
        </nav>

        {/* Свернуть — внизу как в Метрике */}
        <button
          className="flex items-center gap-2 px-2 py-1.5 border-none bg-transparent cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200 w-full text-left flex-shrink-0 rounded-lg"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          <ChevronLeftIcon
            className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
          {!sidebarCollapsed && <span className="text-sm">Свернуть</span>}
        </button>
      </aside>

      {/* Правая часть */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Тонкая топ-полоска */}
        <div className="flex items-center justify-between px-4 h-[44px] flex-shrink-0">
          {/* Хлебные крошки / мобильный бургер */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors border-none cursor-pointer bg-transparent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {finalBreadcrumb && <div className="hidden lg:flex items-center">{finalBreadcrumb}</div>}
          </div>
          {/* Правые элементы */}
          <div className="flex items-center gap-1 ml-auto">
            <Link
              href={mainSiteUrl}
              className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors no-underline hidden sm:block"
            >
              На сайт
            </Link>

            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-gray-500">
              <BellIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-gray-500">
              <Cog6ToothIcon className="w-4 h-4" />
            </button>

            {adminUser && (
              <div className="relative user-menu-wrapper">
                <button
                  className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {adminUser.avatar ? (
                    <img src={getMediaUrl(adminUser.avatar)} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">
                        {adminUser.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-gray-700 font-medium hidden sm:block">
                    {adminUser.name || adminUser.email?.split('@')[0]}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+4px)] w-[220px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[1000] py-1">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{adminUser.name || adminUser.email}</div>
                      <div className="text-xs text-gray-500 capitalize">{adminUser.role}</div>
                    </div>
                    <Link
                      href={mainSiteUrl}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                    >
                      На сайт
                    </Link>
                    {onLogout && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer border-t border-gray-100 mt-1"
                        onClick={onLogout}
                      >
                        Выйти
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Контент */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#eff2f7]">
          <div className="w-full max-w-[1600px] mx-auto py-4 max-md:py-2">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
