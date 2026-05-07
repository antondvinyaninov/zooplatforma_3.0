'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { getOrganizationTypeName } from '../../../../lib/organizations-api';
import { getOrgLogoUrl } from '../../../../lib/urls';

interface CitiesData {
  regions: Array<{
    name: string;
    cities: string[];
  }>;
}

interface OrganizationCard {
  id: number;
  name: string;
  short_name?: string;
  type: string;
  logo?: string;
  bio?: string;
  address_city?: string;
  address_region?: string;
  is_verified: boolean;
  created_at: string;
  role?: string;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [citiesData, setCitiesData] = useState<CitiesData>({ regions: [] });
  const [userCity, setUserCity] = useState<string | null>(null);
  const [autoFilterDisabled, setAutoFilterDisabled] = useState(false);
  const isAutoSettingRef = useRef(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const FilterOptions = () => (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Тип организации</h3>
        <div className="space-y-2">
          {['all', 'shelter', 'vet_clinic', 'pet_shop', 'foundation', 'kennel', 'other'].map(
            (type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={filterType === type}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {type === 'all'
                    ? 'Все типы'
                    : type === 'shelter'
                      ? 'Приюты'
                      : type === 'vet_clinic'
                        ? 'Ветклиники'
                        : type === 'pet_shop'
                          ? 'Зоомагазины'
                          : type === 'foundation'
                            ? 'Фонды'
                            : type === 'kennel'
                              ? 'Кинологические центры'
                              : 'Другое'}
                </span>
              </label>
            ),
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-900 mb-3">Местоположение</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Регион</label>
            <select
              value={filterRegion}
              onChange={(e) => {
                setFilterRegion(e.target.value);
                if (e.target.value === 'all') setAutoFilterDisabled(true);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">Все регионы</option>
              {allRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Город</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              disabled={filterRegion === 'all'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="all">Все города</option>
              {cities
                .filter((c) => c !== 'all')
                .map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );

  // Определяем город пользователя
  useEffect(() => {
    // Пытаемся получить город из localStorage (если пользователь уже выбирал)
    const savedCity = localStorage.getItem('userCity');
    if (savedCity) {
      setUserCity(savedCity);
      return;
    }

    // Определяем город через Geolocation API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Используем обратное геокодирование через Nominatim (OpenStreetMap)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ru`,
            );
            const data = await response.json();
            let city = data.address?.city || data.address?.town || data.address?.village;
            if (city) {
              // Убираем префиксы "г.", "город" и т.д.
              city = city.replace(/^(г\.|город|гор\.)\s*/i, '').trim();
              setUserCity(city);
              localStorage.setItem('userCity', city);
            }
          } catch (error) {
            console.error('Error getting city from coordinates:', error);
          }
        },
        (error) => {
          console.log('Geolocation not available:', error);
        },
      );
    }
  }, []);

  // Загружаем справочник городов
  useEffect(() => {
    fetch('/data/russia-cities-full.json')
      .then((res) => res.json())
      .then((data) => setCitiesData(data))
      .catch((err) => console.error('Error loading cities data:', err));
  }, []);

  // Автоматически устанавливаем регион по городу пользователя
  useEffect(() => {
    if (
      userCity &&
      citiesData.regions.length > 0 &&
      filterRegion === 'all' &&
      !autoFilterDisabled
    ) {
      // Ищем регион пользователя в справочнике
      for (const region of citiesData.regions) {
        if (region.cities.includes(userCity)) {
          isAutoSettingRef.current = true;
          setFilterRegion(region.name);
          break;
        }
      }
    }
  }, [userCity, citiesData, filterRegion, autoFilterDisabled]);

  // Автоматически устанавливаем город после установки региона
  useEffect(() => {
    if (userCity && filterRegion !== 'all' && filterCity === 'all' && isAutoSettingRef.current) {
      // Проверяем, что город есть в выбранном регионе
      const region = citiesData.regions.find((r) => r.name === filterRegion);
      if (region && region.cities.includes(userCity)) {
        setFilterCity(userCity);
        // Сбрасываем флаг после установки
        setTimeout(() => {
          isAutoSettingRef.current = false;
        }, 100);
      }
    }
  }, [userCity, filterRegion, filterCity, citiesData]);

  // Статический список всех регионов России (из справочника)
  const allRegions = citiesData.regions.map((r) => r.name);

  // Получаем города для выбранного региона из справочника
  const cities =
    filterRegion === 'all'
      ? []
      : citiesData.regions.find((r) => r.name === filterRegion)?.cities || [];

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Сбросить город при смене региона (только если не автоматическая установка)
  useEffect(() => {
    if (!isAutoSettingRef.current) {
      setFilterCity('all');
    }
  }, [filterRegion]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      // Используем apiClient вместо прямого fetch
      const { apiClient } = await import('../../../../lib/api');
      const response = await apiClient.get<OrganizationCard[]>('/api/organizations/all');
      if (response.success && response.data) {
        setOrganizations(response.data);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация организаций
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || org.type === filterType;
    const matchesRegion = filterRegion === 'all' || org.address_region === filterRegion;
    const matchesCity = filterCity === 'all' || org.address_city === filterCity;

    return matchesSearch && matchesType && matchesRegion && matchesCity;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* Mobile Top Controls */}
      <div className="xl:hidden w-full space-y-2.5">
        <button
          onClick={() => router.push('/orgs/create')}
          className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm shadow-sm border border-blue-600"
        >
          Создать организацию
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M9 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m11.25-6h2.25m-2.25 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5"
                />
              </svg>
              Фильтры
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Найдено:{' '}
            <span className="font-semibold text-gray-900">{filteredOrganizations.length}</span>
          </div>
        </div>

        {showMobileFilters && (
          <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <FilterOptions />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-medium text-sm mt-2"
            >
              Применить
            </button>
          </div>
        )}
      </div>

      {/* Middle column - Organizations list */}
      <div className="w-full xl:w-[600px] xl:flex-shrink-0">
        {/* Organizations List */}
        {filteredOrganizations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterType !== 'all'
                ? 'Организации не найдены'
                : 'Пока нет организаций'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterType !== 'all'
                ? 'Попробуйте изменить параметры поиска'
                : 'Станьте первым, кто создаст организацию'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                onClick={() => router.push(`/orgs/${org.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  {/* Logo */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    {org.logo ? (
                      <img
                        src={getOrgLogoUrl(org.logo)}
                        alt={org.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <BuildingOfficeIcon className="w-10 h-10 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name and Badge */}
                    <div className="flex items-start gap-2 mb-1">
                      <h3
                        className="text-lg font-bold text-gray-900 flex-1 truncate"
                        title={org.name}
                      >
                        {org.short_name || org.name}
                      </h3>
                      {org.is_verified && (
                        <CheckBadgeIcon
                          className="w-5 h-5 text-blue-500 flex-shrink-0"
                          title="Верифицирована"
                        />
                      )}
                    </div>

                    {/* Type */}
                    <div className="text-sm text-gray-600 mb-2">
                      {getOrganizationTypeName(org.type)}
                    </div>

                    {/* Bio */}
                    {org.bio && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{org.bio}</p>
                    )}

                    {/* City */}
                    {org.address_city && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{org.address_city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column - Filters */}
      <aside className="hidden xl:block w-[320px]">
        <div className="sticky top-[48px] space-y-2.5">
          {/* Create Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <button
              onClick={() => router.push('/orgs/create')}
              className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
            >
              Создать организацию
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Results count */}
            <div className="text-sm text-gray-600">
              Найдено:{' '}
              <span className="font-semibold text-gray-900">{filteredOrganizations.length}</span>
            </div>
          </div>

          <FilterOptions />
        </div>
      </aside>
    </div>
  );
}
