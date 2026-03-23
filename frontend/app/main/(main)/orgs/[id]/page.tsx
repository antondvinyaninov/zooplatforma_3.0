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
} from '@heroicons/react/24/outline';
import {
  organizationsApi,
  Organization,
  OrganizationMember,
  getOrganizationTypeName,
} from '@/lib/organizations-api';
import { postsApi, Post } from '@/lib/api';
import PostCard from '@/components/main/posts/PostCard';
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
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [claimingOwnership, setClaimingOwnership] = useState(false);
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);

  // Проверка является ли пользователь участником организации
  const isMember = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => m.user_id === user.id);
  };

  // Проверка является ли пользователь owner/admin
  const isOwnerOrAdmin = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => m.user_id === user.id && ['owner', 'admin'].includes(m.role));
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

  // Переход в систему управления в зависимости от типа организации
  const handleGoToManagement = () => {
    if (!org) return;

    const managementUrls: Record<string, string> = {
      shelter: `http://localhost:5100/dashboard?orgId=${org.id}`,
      clinic: `http://localhost:6300/select`,
      store: `http://localhost:7100/dashboard?orgId=${org.id}`, // Пока не создан
      foundation: `http://localhost:7200/dashboard?orgId=${org.id}`, // Пока не создан
      kennel: `http://localhost:7300/dashboard?orgId=${org.id}`, // Пока не создан
    };

    const url = managementUrls[org.type];
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Система управления для этого типа организации пока не доступна');
    }
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
              src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${org.cover_photo}`}
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
                    src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${org.logo}`}
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
          {/* О организации */}
          {org.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">О нас</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{org.description}</p>
            </div>
          )}

          {/* Контакты */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Контакты</h2>

            <div className="space-y-4">
              {org.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${org.phone}`} className="text-blue-500 hover:text-blue-600">
                    {org.phone}
                  </a>
                </div>
              )}

              {org.email && (
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${org.email}`} className="text-blue-500 hover:text-blue-600">
                    {org.email}
                  </a>
                </div>
              )}

              {org.website && (
                <div className="flex items-center gap-3">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {org.website}
                  </a>
                </div>
              )}

              {org.address_full && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="text-gray-700">{org.address_full}</div>
                  </div>

                  {/* Компактная карта */}
                  {org.geo_lat && org.geo_lon && (
                    <div className="mt-3">
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
              )}
            </div>
          </div>

          {/* Команда */}
          {members.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                Команда
              </h2>

              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.user_avatar ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${member.user_avatar}`}
                          alt={member.user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{member.user_name}</div>
                      <div className="text-sm text-gray-600">{member.position || member.role}</div>
                    </div>
                    {member.role === 'owner' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Владелец
                      </span>
                    )}
                  </div>
                ))}
              </div>
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

          {/* Информация */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация</h3>
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
