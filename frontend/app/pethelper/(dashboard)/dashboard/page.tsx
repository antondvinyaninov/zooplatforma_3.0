'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface Stats {
  total_users: number;
  verified_users: number;
  total_posts: number;
  total_organizations: number;
  online_users: number;
  active_last_hour: number;
  active_last_24h: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    verified_users: 0,
    total_posts: 0,
    total_organizations: 0,
    online_users: 0,
    active_last_hour: 0,
    active_last_24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [myPetsCount, setMyPetsCount] = useState(0);

  useEffect(() => {
    loadStats();
    loadMyPets();
  }, []);

  const loadMyPets = async () => {
    try {
      const response = await fetch('/api/pethelper/pets', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const pets = data.data || data.pets || [];
        setMyPetsCount(Array.isArray(pets) ? pets.length : 0);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Здесь пока оставляем заглушки, так как у зоопомощника
      // нет доступа к глобальной статистике администратора.
      setStats({
        total_users: 0,
        verified_users: 0,
        total_posts: 0,
        total_organizations: 0,
        online_users: 0,
        active_last_hour: 0,
        active_last_24h: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Кабинет зоопомощника</h1>
          <p className="text-gray-600">Управление подопечными питомцами</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Мои подопечные</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{myPetsCount}</p>
                <p className="text-xs text-gray-500 mt-1">Питомцев на попечении</p>
              </div>
              <DocumentTextIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего пользователей</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
                <p className="text-xs text-gray-500 mt-1">Зарегистрировано на платформе</p>
              </div>
              <UsersIcon className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Организации</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_organizations}</p>
                <p className="text-xs text-gray-500 mt-1">Приюты, клиники, фонды</p>
              </div>
              <BuildingOfficeIcon className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/pethelper/pets"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <DocumentTextIcon className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Мои подопечные</h3>
            <p className="text-sm text-gray-600">Просмотр и управление питомцами на попечении</p>
          </a>

          <a
            href="/pethelper/organizations"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <BuildingOfficeIcon className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Организации</h3>
            <p className="text-sm text-gray-600">Приюты и клиники, с которыми вы работаете</p>
          </a>
        </div>
      </div>
    </div>
  );
}
