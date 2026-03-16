'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon, PlusCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Stats {
  total_pets: number;
  my_pets: number;
  total_organizations: number;
}

interface Pet {
  id: number;
  name: string;
  species_name: string;
  breed_name: string;
  photo_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    total_pets: 0,
    my_pets: 0,
    total_organizations: 0,
  });
  const [recentPets, setRecentPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [petsRes, orgsRes] = await Promise.all([
        fetch('/api/owner/pets', { credentials: 'include' }),
        fetch('/api/owner/organizations', { credentials: 'include' }),
      ]);

      if (petsRes.ok && orgsRes.ok) {
        const petsResult = await petsRes.json();
        const orgsResult = await orgsRes.json();

        const pets = petsResult.pets || [];
        const orgs = orgsResult.organizations || [];

        setStats({
          total_pets: pets.length,
          my_pets: pets.length,
          total_organizations: orgs.length,
        });

        // Берем последние 3 питомца
        setRecentPets(pets.slice(0, 3));
      }
    } catch (error) {
      // Error loading stats
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
          <h1 className="text-3xl font-bold text-gray-900">Кабинет владельца</h1>
          <p className="text-gray-600">Управление вашими питомцами</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Мои питомцы</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.my_pets}</p>
              </div>
              <HeartIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего питомцев</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_pets}</p>
              </div>
              <HeartIcon className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Организации</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_organizations}</p>
              </div>
              <DocumentTextIcon className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Последние питомцы */}
        {recentPets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Мои питомцы</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPets.map((pet) => (
                <div
                  key={pet.id}
                  onClick={() => router.push(`/pets/${pet.id}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {pet.photo_url ? (
                        <img
                          src={pet.photo_url}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          {pet.species_name === 'Собака' ? '🐕' : '🐈'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{pet.name}</h3>
                      <p className="text-sm text-gray-600">{pet.breed_name || pet.species_name}</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                    Просмотр →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/pets')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <HeartIcon className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Все мои питомцы</h3>
            <p className="text-sm text-gray-600">Просмотр и управление всеми питомцами</p>
          </button>

          <button
            onClick={() => router.push('/pets')}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
          >
            <PlusCircleIcon className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Добавить питомца</h3>
            <p className="text-sm text-gray-600">Зарегистрировать нового питомца в системе</p>
          </button>
        </div>
      </div>
    </div>
  );
}
