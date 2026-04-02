'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ShareIcon,
  HeartIcon,
  CheckBadgeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  InformationCircleIcon,
  ClockIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import {
  organizationsApi,
  Organization,
  OrganizationMember,
  getOrganizationTypeName,
} from '@/lib/organizations-api';
import { postsApi, Post, petsApi, Pet } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import PostCard from '@/components/main/posts/PostCard';
import PetCard from '@/components/main/posts/PetCard';
import CreatePost from '@/components/main/posts/CreatePost';
import YandexMap from '@/components/main/shared/YandexMap';
import ConfirmModal from '@/components/main/shared/ConfirmModal';

type OrganizationPageProps = {
  params: Promise<{ id: string }>;
};

export default function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth(); // Используем useAuth вместо localStorage
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [petsLoading, setPetsLoading] = useState(true);
  const [claimingOwnership, setClaimingOwnership] = useState(false);
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'team' | 'pets'>('info');

  // Проверка является ли пользователь участником организации
  const isMember = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => String(m.user_id) === String(user.id));
  };

  // Проверка является ли пользователь owner/admin
  const isOwnerOrAdmin = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => String(m.user_id) === String(user.id) && ['owner', 'admin'].includes(m.role));
  };

  // Проверка есть ли у организации владелец
  const hasOwner = () => {
    return members.some((m) => m.role === 'owner');
  };

  useEffect(() => {
    if (id) {
      loadOrganization();
      loadMembers();
      loadPosts();
      loadPets();
    }
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const response = await organizationsApi.getById(Number(id));
      if (response.success && response.data) {
        setOrg(response.data);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await organizationsApi.getMembers(Number(id));
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await postsApi.getOrganizationPosts(Number(id));
      if (response?.data) {
        setPosts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadPets = async () => {
    try {
      setPetsLoading(true);
      const response = await petsApi.getOrganizationPets(Number(id));
      if (response?.data) {
        setPets(response.data || []);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setPetsLoading(false);
    }
  };

  // Переход в единую систему управления (ZooPlatform 3.0)
  const handleGoToManagement = () => {
    if (!org) return;
    router.push(`/org/${org.id}/dashboard`);
  };

  // Заявить о владении организацией
  const handleClaimOwnership = async () => {
    if (!org || !user) return;

    try {
      setClaimingOwnership(true);
      const response = await organizationsApi.claimOwnership(org.id);

      if (response.success) {
        alert('Вы стали владельцем организации!');
        // Перезагружаем участников
        await loadMembers();
      } else {
        alert(response.error || 'Не удалось заявить о владении');
      }
    } catch (error) {
      console.error('Error claiming ownership:', error);
      alert('Произошла ошибка при заявке на владение');
    } finally {
      setClaimingOwnership(false);
      setShowClaimConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Организация не найдена</h2>
          <button onClick={() => router.back()} className="text-blue-500 hover:text-blue-600">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cover and Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2.5">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
          {org.cover_photo ? (
            <img
              src={getMediaUrl(org.cover_photo)}
              alt={org.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
              <BuildingOfficeIcon className="w-24 h-24" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Logo */}
            <div className="relative -mt-16 sm:-mt-20">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {org.logo ? (
                  <img
                    src={getMediaUrl(org.logo)}
                    alt={org.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BuildingOfficeIcon className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {org.name}
                    </h1>
                    {org.is_verified && (
                      <CheckBadgeIcon
                        className="w-6 h-6 text-blue-500 flex-shrink-0"
                        title="Верифицирована"
                      />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{getOrganizationTypeName(org.type)}</span>
                    </div>
                    {org.address_city && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{org.address_city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ShareIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                    <HeartIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-2.5">
          
          {/* TAB SWITCHER (Premium Apple Style Pill Menu) */}
          <div className="flex items-center overflow-x-auto gap-2.5 pb-3 mb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200/60'
                  : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-transparent'
              }`}
            >
              <InformationCircleIcon className={`w-5 h-5 ${activeTab === 'info' ? 'text-gray-900' : 'text-gray-400'}`} />
              Инфо
            </button>
            {members.length > 0 && (
              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'team'
                    ? 'bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200/60'
                    : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-transparent'
                }`}
              >
                <UserGroupIcon className={`w-5 h-5 ${activeTab === 'team' ? 'text-gray-900' : 'text-gray-400'}`} />
                Команда
              </button>
            )}
            {pets.length > 0 && (
              <button
                onClick={() => setActiveTab('pets')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'pets'
                    ? 'bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200/60'
                    : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-transparent'
                }`}
              >
                <HeartIcon className={`w-5 h-5 ${activeTab === 'pets' ? 'text-gray-900' : 'text-gray-400'}`} />
                Подопечные
              </button>
            )}
          </div>

          {/* О организации */}
          {activeTab === 'info' && org.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <InformationCircleIcon className="w-5 h-5 text-violet-600" />
                О нас
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{org.description}</p>
            </div>
          )}

          {/* Локация и время работы */}
          {activeTab === 'info' && org.address_full && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <MapPinIcon className="w-5 h-5 text-violet-600" />
                Где мы находимся
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="text-gray-900 leading-relaxed font-medium">{org.address_full}</div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="text-gray-900 leading-relaxed font-medium">Ежедневно с 10:00 до 20:00</div>
                </div>

                {/* Компактная карта */}
                {org.geo_lat && org.geo_lon && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm relative">
                    <YandexMap
                      address={org.address_full}
                      organizationName={org.name}
                      latitude={org.geo_lat}
                      longitude={org.geo_lon}
                      zoom={15}
                      height="250px"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Команда (Премиальные карточки) */}
          {activeTab === 'team' && members.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-violet-600" />
                  Команда
                </h2>
                <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                  {members.length} {members.length === 1 ? 'сотрудник' : members.length < 5 ? 'сотрудника' : 'сотрудников'}
                </div>
              </div>

              {/* Горизонтальный скролл со скрытым ползунком */}
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] -mx-2 px-2">
                {members.map((member) => {
                  const avatarSrc = getMediaUrl(member.org_avatar) || getMediaUrl(member.user_avatar);
                      
                  return (
                    <div
                      key={member.id}
                      className="snap-start shrink-0 w-32 sm:w-40 flex flex-col group cursor-pointer"
                    >
                      {/* Карточка (Фотография) */}
                      <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm bg-gray-50 mb-2">
                        {/* Фоновое изображение */}
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={member.user_name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-emerald-50 text-4xl font-bold text-gray-300">
                            {member.user_name?.[0]?.toUpperCase() || '👤'}
                          </div>
                        )}
                        
                        {/* Легкий градиент для читаемости белого имени */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                        {/* Имя сотрудника (На карточке) */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="font-bold text-white text-[13px] sm:text-[14px] leading-tight line-clamp-2 drop-shadow-md">
                            {member.user_name}
                          </div>
                        </div>
                      </div>

                      {/* Специальность (Под карточкой) */}
                      <div className="px-1">
                        <div className="text-[12px] sm:text-[13px] font-medium text-gray-500 line-clamp-2 leading-snug">
                          {member.position || 'Специалист'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Питомцы организации */}
          {activeTab === 'pets' && pets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HeartIcon className="w-5 h-5 text-orange-500" />
                  {['shelter', 'foundation'].includes(org?.type || '') ? 'Ищут дом' : 'Наши животные'}
                </h2>
                <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                  {pets.length} {pets.length % 10 === 1 && pets.length % 100 !== 11 ? 'подопечный' : 'подопечных'}
                </div>
              </div>

              {petsLoading ? (
                <div className="flex justify-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] -mx-2 px-2">
                  {pets.map((pet) => {
                    const photoSrc = getMediaUrl(pet.photo_url) || getMediaUrl(pet.photo);
                    
                    // Форматирование возраста
                    const getAgeText = () => {
                      if (!pet.birth_date) return null;
                      const birth = new Date(pet.birth_date);
                      const now = new Date();
                      const years = now.getFullYear() - birth.getFullYear();
                      const months = now.getMonth() - birth.getMonth();
                      if (years === 0) return `${months} мес.`;
                      return `${years} ${years === 1 ? 'год' : (years >= 2 && years <= 4) ? 'года' : 'лет'}`;
                    };

                    const ageText = getAgeText();

                    return (
                      <div
                        key={pet.id}
                        onClick={() => router.push(`/pets/${pet.id}`)}
                        className="snap-start shrink-0 w-32 sm:w-40 flex flex-col group cursor-pointer"
                      >
                        {/* Карточка (Фотография) */}
                        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm bg-gray-50 mb-2">
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={pet.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-emerald-50 text-4xl font-bold text-gray-300">
                              🐾
                            </div>
                          )}
                          
                          {/* Бейдж срочности или статуса */}
                          {pet.status === 'looking_for_home' && (
                            <div className="absolute top-2 right-2 bg-orange-500/90 backdrop-blur text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              Ищет дом
                            </div>
                          )}

                          {/* Градиент */}
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                          {/* Имя питомца (На карточке) */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                            <div className="font-bold text-white text-[13px] sm:text-[15px] leading-tight line-clamp-1 drop-shadow-md">
                              {pet.name}
                            </div>
                            {pet.gender && (
                              <div className={pet.gender === 'male' ? 'text-blue-300' : 'text-pink-300'}>
                                {pet.gender === 'male' ? '♂' : '♀'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Информация (Под карточкой) */}
                        <div className="px-1">
                          <div className="text-[12px] sm:text-[13px] font-medium text-gray-800 line-clamp-1">
                            {pet.breed || pet.species}
                          </div>
                          {ageText && (
                            <div className="text-[11px] sm:text-[12px] text-gray-500">
                              {ageText}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Посты организации */}
          <div className="space-y-2.5">
            {/* Форма создания поста (только для owner/admin с правом публикации) */}
            {isOwnerOrAdmin() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CreatePost onPostCreated={loadPosts} />
              </div>
            )}

            {/* Список постов */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Публикации</h2>

              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Пока нет публикаций</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-2.5">
          {/* Кнопка "Я владелец" (если нет владельца и пользователь не участник) */}
          {user && !hasOwner() && !isMember() && !membersLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Организация не подтверждена владельцем
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                У этой организации нет подтвержденного владельца. Если вы являетесь официальным
                представителем организации, вы можете подтвердить владение.
              </p>
              <button
                onClick={() => setShowClaimConfirm(true)}
                disabled={claimingOwnership}
                className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {claimingOwnership ? 'Обработка...' : 'Подтвердить владение'}
              </button>
            </div>
          )}

          {/* Управление организацией (для всех участников) */}
          {isMember() && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Управление</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleGoToManagement()}
                  className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <BuildingOfficeIcon className="w-5 h-5" />
                  Система управления
                </button>

                {isOwnerOrAdmin() && (
                  <button
                    onClick={() => router.push(`/orgs/${org.id}/edit`)}
                    className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Редактировать профиль
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Быстрые контакты (Telegram/Apple Style) */}
          {(org.phone || org.email || org.website) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-violet-600" />
                Связаться
              </h3>
              
              <div className="grid grid-cols-4 gap-2">
                {org.phone && (
                  <a 
                    href={`tel:${org.phone}`}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    title="Позвонить"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-transform duration-200">
                      <PhoneIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Вызов</span>
                  </a>
                )}
                
                {org.phone && (
                  <a 
                    href={`https://t.me/+${org.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    title="Написать в Telegram"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-100 group-hover:scale-105 transition-transform duration-200">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Telegram</span>
                  </a>
                )}

                {org.email && (
                  <a 
                    href={`mailto:${org.email}`}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    title="Написать письмо"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-transform duration-200">
                      <EnvelopeIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Почта</span>
                  </a>
                )}

                {org.website && (
                  <a 
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    title="Перейти на сайт"
                  >
                    <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center group-hover:bg-violet-100 group-hover:scale-105 transition-transform duration-200">
                      <GlobeAltIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Сайт</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Информация */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
              <BuildingOfficeIcon className="w-5 h-5 text-violet-600" />
              Информация
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">Тип</div>
                <div className="font-semibold text-gray-900">
                  {getOrganizationTypeName(org.type)}
                </div>
              </div>

              {org.inn && (
                <div>
                  <div className="text-gray-500 mb-1">ИНН</div>
                  <div className="font-semibold text-gray-900">{org.inn}</div>
                </div>
              )}

              {org.ogrn && (
                <div>
                  <div className="text-gray-500 mb-1">ОГРН</div>
                  <div className="font-semibold text-gray-900">{org.ogrn}</div>
                </div>
              )}

              {org.director_name && (
                <div>
                  <div className="text-gray-500 mb-1">Руководитель</div>
                  <div className="font-semibold text-gray-900">{org.director_name}</div>
                  {org.director_position && (
                    <div className="text-xs text-gray-600 mt-0.5">{org.director_position}</div>
                  )}
                </div>
              )}

              <div>
                <div className="text-gray-500 mb-1">Дата создания</div>
                <div className="font-semibold text-gray-900">
                  {new Date(org.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showClaimConfirm}
        title="Подтвердить владение организацией?"
        message="После подтверждения вы станете владельцем организации."
        confirmText="Подтвердить"
        loading={claimingOwnership}
        onClose={() => setShowClaimConfirm(false)}
        onConfirm={() => {
          void handleClaimOwnership();
        }}
      />
    </div>
  );
}
