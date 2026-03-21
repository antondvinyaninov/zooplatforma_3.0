'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, MapPinIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/favorites-api';
import { useAuth } from '@/contexts/AuthContext';

interface CitiesData {
  regions: Array<{
    name: string;
    cities: string[];
  }>;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string;
  photo?: string;
  status: string;
  city?: string;
  region?: string;
  urgent?: boolean;
  contact_name?: string;
  contact_phone?: string;
  description?: string;
  organization_id?: number;
  organization_name?: string;
  organization_type?: string;
  owner_name?: string;
  owner_avatar?: string;
}

export default function CatalogPage() {
  const { user } = useAuth(); // Получаем информацию о пользователе
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterOrganization, setFilterOrganization] = useState<string>('all');
  const [filterFromOrganization, setFilterFromOrganization] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [copiedPetId, setCopiedPetId] = useState<number | null>(null);
  const [favoritePetIds, setFavoritePetIds] = useState<Set<number>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<number | null>(null);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [citiesData, setCitiesData] = useState<CitiesData>({ regions: [] });
  const [userCity, setUserCity] = useState<string | null>(null);
  const [autoFilterDisabled, setAutoFilterDisabled] = useState(false);
  const isAutoSettingRef = useRef(false);

  useEffect(() => {
    const savedCity = localStorage.getItem('userCity');
    if (savedCity) {
      setUserCity(savedCity);
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ru`,
            );
            const data = await response.json();
            let city = data.address?.city || data.address?.town || data.address?.village;
            if (city) {
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

  useEffect(() => {
    fetch('/data/russia-cities-full.json')
      .then((res) => res.json())
      .then((data) => setCitiesData(data))
      .catch((err) => console.error('Error loading cities data:', err));
  }, []);

  useEffect(() => {
    if (
      userCity &&
      citiesData.regions.length > 0 &&
      filterRegion === 'all' &&
      !autoFilterDisabled
    ) {
      for (const region of citiesData.regions) {
        if (region.cities.includes(userCity)) {
          isAutoSettingRef.current = true;
          setFilterRegion(region.name);
          break;
        }
      }
    }
  }, [userCity, citiesData, filterRegion, autoFilterDisabled]);

  useEffect(() => {
    if (userCity && filterRegion !== 'all' && filterCity === 'all' && isAutoSettingRef.current) {
      const region = citiesData.regions.find((r) => r.name === filterRegion);
      if (region && region.cities.includes(userCity)) {
        setFilterCity(userCity);
        setTimeout(() => {
          isAutoSettingRef.current = false;
        }, 100);
      }
    }
  }, [userCity, filterRegion, filterCity, citiesData]);

  useEffect(() => {
    if (!isAutoSettingRef.current) {
      setFilterCity('all');
    }
  }, [filterRegion]);

  const allRegions = citiesData.regions.map((r) => r.name);
  const cities =
    filterRegion === 'all'
      ? []
      : citiesData.regions.find((r) => r.name === filterRegion)?.cities || [];

  useEffect(() => {
    loadPets();
    // TODO: Избранное будет реализовано позже
    // if (user) {
    //   loadFavorites();
    // }
  }, [user]);

  const loadPets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/pets/catalog`);
      const result = await response.json();

      if (result.success && result.data) {
        setPets(result.data);
      } else {
        setPets([]);
      }
    } catch (error) {
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    // TODO: Избранное будет реализовано позже
    // try {
    //   const favorites = await getFavorites();
    //   const petIds = new Set(favorites.map(f => f.pet_id));
    //   setFavoritePetIds(petIds);
    // } catch (error) {
    //   // Не авторизован или ошибка - просто не загружаем избранное
    // }
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch =
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pet.status === filterStatus;
    const matchesSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    const matchesOrganization =
      filterOrganization === 'all' || pet.organization_type === filterOrganization;
    const matchesFromOrganization = !filterFromOrganization || pet.organization_id !== undefined;

    const cleanCityPrefix = (str: string) => str.replace(/^(г\.|город|гор\.)\s*/i, '').trim();
    const petCityClean = cleanCityPrefix((pet.city || pet.region || '').split(',')[0]);
    const matchesRegion = filterRegion === 'all' || 
                          (pet.region === filterRegion) || 
                          ((pet.city || '').toLowerCase().includes(filterRegion.toLowerCase()));
    const matchesCity = filterCity === 'all' || 
                        petCityClean.toLowerCase() === filterCity.toLowerCase() || 
                        (pet.city && pet.city.toLowerCase().includes(filterCity.toLowerCase()));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSpecies &&
      matchesOrganization &&
      matchesFromOrganization &&
      matchesRegion &&
      matchesCity
    );
  });

  const getAge = (birthDate?: string) => {
    if (!birthDate) return 'Возраст не указан';

    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years > 0) {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    }
    return 'Новорождённый';
  };

  // Быстрые действия
  const handleShare = async (petId: number) => {
    const url = `${window.location.origin}/petid/${petId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPetId(petId);
      setTimeout(() => setCopiedPetId(null), 2000);
    } catch (err) {
      // Failed to copy
    }
  };

  const handleFavorite = async (petId: number) => {
    // TODO: Избранное будет реализовано позже
    alert('Функция "Избранное" будет реализована позже');
    return;

    // // Проверяем авторизацию
    // if (!user) {
    //   alert('Для добавления в избранное необходимо авторизоваться');
    //   return;
    // }

    // setFavoriteLoading(petId);
    // try {
    //   const isFavorite = favoritePetIds.has(petId);
    //
    //   if (isFavorite) {
    //     await removeFavorite(petId);
    //     setFavoritePetIds(prev => {
    //       const newSet = new Set(prev);
    //       newSet.delete(petId);
    //       return newSet;
    //     });
    //   } else {
    //     await addFavorite(petId);
    //     setFavoritePetIds(prev => new Set(prev).add(petId));
    //   }
    // } catch (error) {
    //   console.error('Error toggling favorite:', error);
    //   alert('Ошибка при добавлении в избранное');
    // } finally {
    //   setFavoriteLoading(null);
    // }
  };

  const handleMessage = (petId: number, contactPhone?: string) => {
    // TODO: Открыть мессенджер с контактом
    alert('Функция "Написать" будет реализована в следующей версии');
  };

  const statusLabels: Record<string, string> = {
    all: 'Все',
    looking_for_home: 'Ищет дом',
    found: 'Найден',
    lost: 'Потерян',
    needs_help: 'Сбор средств',
  };

  const statusStyles: Record<string, { badge: string; dot: string }> = {
    looking_for_home: { badge: 'bg-[#00c853] text-white', dot: 'bg-[#00c853]' },
    found: { badge: 'bg-[#00b0ff] text-white', dot: 'bg-[#00b0ff]' },
    lost: { badge: 'bg-[#ff3d00] text-white', dot: 'bg-[#ff3d00]' },
    needs_help: { badge: 'bg-[#aa00ff] text-white', dot: 'bg-[#aa00ff]' },
    default: { badge: 'bg-gray-500 text-white', dot: 'bg-gray-500' }
  };

  // Подсчет количества питомцев для каждого статуса
  const statusCounts = {
    all: pets.length,
    looking_for_home: pets.filter(p => p.status === 'looking_for_home').length,
    found: pets.filter(p => p.status === 'found').length,
    lost: pets.filter(p => p.status === 'lost').length,
    needs_help: pets.filter(p => p.status === 'needs_help').length,
  };

  const filterOptions = [
    { id: 'all', label: 'Все' },
    { id: 'looking_for_home', label: 'Ищет дом' },
    { id: 'found', label: 'Найден' },
    { id: 'lost', label: 'Потерян' },
    { id: 'needs_help', label: 'Сбор средств' },
  ];

  return (
    <div className="space-y-2.5">
      {/* Header Card (Full Width) */}
      <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 m-0 leading-tight">
          Каталог питомцев
        </h1>
        <p className="text-gray-600 m-0">
          Найдите питомца, который ищет дом или помогите найти потерявшегося
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        
        {/* Левая колонка - Карточки */}
        <div className="lg:col-span-2 flex flex-col gap-2.5 min-w-0 order-2 lg:order-1">
          {/* Список питомцев */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 rounded-[24px] aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="bg-white rounded-[24px] p-16 text-center shadow-sm border border-gray-100">
              <div className="text-6xl mb-4 opacity-50">🐾</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Питомцев пока нет</h3>
              <p className="text-gray-500 mb-6">В каталоге пока нет ни одного питомца</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-2.5" : "flex flex-col gap-2.5"}>
              {filteredPets.map((pet) => {
                const style = statusStyles[pet.status] || statusStyles.default;
                const petPhoto = pet.photo || '/placeholder-pet.jpg';
                const daysAgo = 1; // Условность для дизайна
                const timeString = '1 день'; // Условность для дизайна

                if (viewMode === 'list') {
                  const listBadgeClass = pet.status === 'looking_for_home' ? 'bg-blue-100 text-blue-700' :
                                         pet.status === 'needs_help' ? 'bg-purple-100 text-purple-700' :
                                         pet.status === 'lost' ? 'bg-red-100 text-red-700' :
                                         'bg-green-100 text-green-700';

                  return (
                    <div
                      key={pet.id}
                      onClick={() => (window.location.href = `/pets/${pet.id}`)}
                      className="bg-white rounded-[24px] p-4 flex flex-col sm:flex-row gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full group"
                    >
                      {/* Image */}
                      <div className="relative w-full sm:w-[150px] h-[200px] sm:h-[150px] flex-shrink-0 rounded-[16px] overflow-hidden bg-gray-100">
                        {pet.photo ? (
                          <img
                            src={pet.photo}
                            alt={pet.name || 'Питомец'}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105">
                            <span className="text-6xl opacity-30 drop-shadow-sm pb-4">
                              {pet.species === 'Собака' && '🐕'}
                              {pet.species === 'Кошка' && '🐈'}
                              {pet.species === 'Птица' && '🐦'}
                              {!['Собака', 'Кошка', 'Птица'].includes(pet.species) && '🐾'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col min-w-0 py-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                           <h3 className="text-[22px] font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{pet.name}</h3>
                           <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${listBadgeClass}`}>
                                {statusLabels[pet.status] || 'ДРУГОЕ'}
                              </span>
                           </div>
                        </div>

                        <div className="text-[13px] font-medium text-gray-600 mb-1.5">
                           {pet.breed || 'Без породы'} <span className="mx-1.5 opacity-40">•</span> {getAge(pet.birth_date)}
                        </div>

                        <p className="text-[13.5px] leading-relaxed text-gray-500 line-clamp-2 mb-auto pr-4">
                          {pet.description || 'Описание отсутствует...'}
                        </p>

                        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3 min-w-0">
                             <div className="flex items-center gap-2">
                                {pet.owner_avatar ? (
                                  <img src={pet.owner_avatar} alt={pet.owner_name || 'Пользователь'} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[11px] flex-shrink-0">
                                     {(pet.organization_name || pet.owner_name || pet.contact_name || 'Ч')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[13px] font-medium text-gray-700 truncate max-w-[150px]">{pet.organization_name || pet.owner_name || pet.contact_name || 'Частное лицо'}</span>
                             </div>
                             <span className="text-xs text-gray-300 hidden sm:inline-block">•</span>
                             <div className="hidden sm:flex items-center gap-1.5 text-[13px] text-gray-500 truncate max-w-[150px]">
                                <MapPinIcon className="w-4.5 h-4.5 text-gray-400" />
                                <span className="truncate">{(pet.city || pet.region || 'Не указано').split(',')[0].trim()}</span>
                             </div>
                          </div>

                          <div className="flex items-center text-gray-400">
                             <div className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#1B76FF]">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={pet.id}
                    onClick={() => (window.location.href = `/pets/${pet.id}`)}
                    className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 block group cursor-pointer"
                  >
                    {/* Background Image or Placeholder */}
                    {pet.photo ? (
                      <img
                        src={pet.photo}
                        alt={pet.name || 'Питомец'}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        <span className="text-8xl opacity-30 drop-shadow-sm pb-10">
                          {pet.species === 'Собака' && '🐕'}
                          {pet.species === 'Кошка' && '🐈'}
                          {pet.species === 'Птица' && '🐦'}
                          {!['Собака', 'Кошка', 'Птица'].includes(pet.species) && '🐾'}
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-900/95 via-gray-900/20 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                      <div className={`${style.badge} px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm`}>
                        {statusLabels[pet.status] || 'ДРУГОЕ'}
                      </div>
                      
                      <div className={`w-3 h-3 rounded-full border-2 border-white/60 shadow-sm ${style.dot}`} />
                    </div>

                    {/* Bottom Content Area */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 z-10 flex flex-col justify-end text-white text-left">
                      <h3 className="text-[26px] font-extrabold mb-0.5 leading-tight line-clamp-1 drop-shadow-sm">
                        {pet.name}
                      </h3>

                      <p className="text-[15px] text-gray-200 line-clamp-1 mb-3.5 font-medium">
                        {pet.breed || 'Порода неизвестна'}, {getAge(pet.birth_date)}
                      </p>

                      {pet.status === 'needs_help' && (
                        <div className="mb-3.5">
                          <div className="flex items-end justify-between text-xs font-semibold mb-1.5 drop-shadow-sm">
                            <span>0 ₽</span>
                            <span className="text-gray-300">0%</span>
                          </div>
                          <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                            <div className={`${style.badge} h-full transition-all`} style={{ width: `0%` }} />
                          </div>
                        </div>
                      )}

                      {/* Location & Meta Footer */}
                      <div className="flex items-center justify-between text-[14px] text-gray-300">
                        <div className="flex items-center gap-3">
                          {(pet.city || pet.region) && (
                            <div className="flex items-center gap-1 font-medium">
                              <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{(pet.city || pet.region || '').split(',')[0].trim()}</span>
                            </div>
                          )}
                          
                          {pet.status === 'needs_help' ? (
                             <div className="flex items-center gap-1 font-medium">
                               ★ <span className="text-gray-200">0 донов</span>
                             </div>
                          ) : pet.status === 'looking_for_home' ? (
                            <div className="flex items-center gap-1 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              <span>0</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 font-medium text-green-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>{timeString}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Правая колонка - Сайдбар фильтров */}
        <div className="w-full order-1 lg:order-2">
          <div className="bg-white rounded-[24px] p-5 shadow-sm lg:sticky lg:top-6">
            <div 
              className="flex items-center justify-between cursor-pointer lg:cursor-auto mb-1 lg:mb-4"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            >
              <h2 className="text-xl font-bold text-gray-900 m-0">Фильтры</h2>
              <button className="lg:hidden text-gray-500 hover:bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <svg className={`w-5 h-5 transition-transform ${isMobileFiltersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div className={`${isMobileFiltersOpen ? 'block mt-4' : 'hidden'} lg:block`}>
              {/* Search */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Поиск</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Поиск по кличке, породе..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Вид животного */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Вид животного</p>
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все виды</option>
                <option value="Собака">Собаки</option>
                <option value="Кошка">Кошки</option>
                <option value="Птица">Птицы</option>
                <option value="Другое">Другие</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Тип объявления</p>
              <div className="flex flex-col gap-0.5">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                      filterStatus === filter.id
                        ? 'bg-[#EAF2FF] text-[#1B76FF] font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`text-[13px] ${filterStatus === filter.id ? 'text-[#1B76FF]/70' : 'text-gray-400'}`}>
                      ({statusCounts[filter.id as keyof typeof statusCounts] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Местоположение */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Местоположение</p>
              <div className="space-y-2">
                {/* Region */}
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Регион</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => {
                      setFilterRegion(e.target.value);
                      if (e.target.value === 'all') {
                        setAutoFilterDisabled(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">Все регионы</option>
                    {allRegions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Город</label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    disabled={filterRegion === 'all'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
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

            {/* Дополнительные фильтры для каталога */}
            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filterFromOrganization}
                  onChange={(e) => setFilterFromOrganization(e.target.checked)}
                  className="w-4 h-4 text-[#1B76FF] border-gray-300 rounded focus:ring-[#1B76FF]"
                />
                <span>Только из организаций</span>
              </label>
            </div>


            {/* View Mode */}
            <div className="mb-0">
              <p className="text-sm font-medium text-gray-700 mb-2">Отображение</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                    viewMode === 'list' ? 'border-2 border-[#1B76FF] bg-[#EAF2FF] text-[#1B76FF]' : 'border border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  <span className={`text-[11px] text-center ${viewMode === 'list' ? 'font-bold' : 'font-medium'}`}>Список</span>
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                    viewMode === 'grid' ? 'border-2 border-[#1B76FF] bg-[#EAF2FF] text-[#1B76FF]' : 'border border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 mb-1 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  <span className={`text-[11px] text-center ${viewMode === 'grid' ? 'font-bold' : 'font-medium'}`}>Сетка</span>
                </button>
              </div>
            </div>

            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
