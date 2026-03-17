'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { getMediaUrl, getFullName } from '@/lib/utils';
import CityDetector from './CityDetector';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  BuildingOfficeIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type UserMenuVariant = 'mobile' | 'desktop';

type UserMenuProps = {
  variant?: UserMenuVariant;
};

export default function UserMenu({ variant = 'mobile' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Закрытие меню при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/auth');
  };

  // Показываем placeholder пока идет загрузка
  if (isLoading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push('/auth')}
        className="px-4 pt-1.5 pb-1 rounded-lg text-white font-medium transition-colors text-sm"
        style={{ backgroundColor: '#1B76FF' }}
      >
        Войти
      </button>
    );
  }

  // Generate cache buster based on user.avatar to force reload when avatar changes
  const avatarUrl = user?.avatar
    ? `${getMediaUrl(user.avatar)}?v=${encodeURIComponent(user.avatar)}`
    : undefined;
  const displayEmail =
    user?.email && !user.email.endsWith('@vk.placeholder') ? user.email : 'Email скрыт';

  return (
    <div ref={menuRef} className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 pt-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  {getFullName(user?.name || 'Пользователь', user?.last_name)}
                  <span className="text-blue-500">✓</span>
                </div>
                <div className="text-sm text-gray-500">{displayEmail}</div>
                <button
                  onClick={() => {
                    if (user?.id) {
                      router.push(`/id${user.id}`);
                      setIsOpen(false);
                    }
                  }}
                  className="mt-0.5 text-xs text-blue-600 hover:text-blue-700"
                >
                  Управление аккаунтом
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {variant !== 'desktop' && (
              <>
                {/* Город */}
                <div className="px-4 py-2.5">
                  <div className="rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 flex items-center justify-between">
                    <CityDetector buttonClassName="text-gray-700" textClassName="font-semibold" />
                    <span className="text-xs text-blue-600">Сменить</span>
                  </div>
                </div>

                {/* Навигация */}
                <button
                  onClick={() => {
                    router.push('/');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <DocumentTextIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">Метки</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/catalog');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <RectangleStackIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">Каталог</span>
                </button>

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      router.push('/messenger');
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                    <span className="text-sm text-gray-900">Мессенджер</span>
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      router.push('/org');
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                    <span className="text-sm text-gray-900">Организации</span>
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      router.push('/services');
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Cog6ToothIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                    <span className="text-sm text-gray-900">Сервисы</span>
                  </button>
                )}

                <div className="border-t border-gray-200 my-2"></div>

                <button
                  onClick={() => {
                    router.push('/about');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <InformationCircleIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">О платформе</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/statistics');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <ChartBarIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">Статистика</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/support');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">Техподдержка</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/team');
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <UserGroupIcon className="w-5 h-5 text-gray-600 ml-2.5" />
                  <span className="text-sm text-gray-900">Команда</span>
                </button>
              </>
            )}

            {/* Выйти */}
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${variant === 'desktop' ? '' : 'border-t border-gray-200 mt-2'}`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-600 ml-2.5" />
              <span className="text-sm text-gray-900">Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
