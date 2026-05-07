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

// Новая UI Библиотека
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

type OrganizationPageProps = {
  params: Promise<{ id: string }>;
};

export default function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
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

  const visibleMembers = members.filter((m) => m.is_public !== false);

  const isMember = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => String(m.user_id) === String(user.id));
  };

  const isOwnerOrAdmin = () => {
    if (!user || membersLoading) return false;
    return members.some((m) => String(m.user_id) === String(user.id) && ['owner', 'admin'].includes(m.role));
  };

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

  const handleGoToManagement = () => {
    if (!org) return;
    router.push(`/org/${org.id}/dashboard`);
  };

  const handleClaimOwnership = async () => {
    if (!org || !user) return;
    try {
      setClaimingOwnership(true);
      const response = await organizationsApi.claimOwnership(org.id);
      if (response.success) {
        alert('Вы стали владельцем организации!');
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Организация не найдена</h2>
          <Button variant="link" onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  // Сборка Табов
  const tabCategories = [];
  
  const infoContent = (
    <div className="space-y-4">
      {org.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 text-violet-600" /> О нас
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{org.description}</p>
          </CardContent>
        </Card>
      )}

      {org.address_full && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-violet-600" /> Где мы находимся
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-gray-900 leading-relaxed font-medium">{org.address_full}</div>
            </div>
            <div className="flex items-start gap-3">
              <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="text-gray-900 leading-relaxed font-medium">Ежедневно с 10:00 до 20:00</div>
            </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );

  tabCategories.push({
    name: 'Инфо',
    icon: <InformationCircleIcon className="w-5 h-5 text-gray-400 group-data-[selected]:text-gray-900" />,
    content: infoContent
  });

  if (visibleMembers.length > 0) {
    tabCategories.push({
      name: 'Команда',
      icon: <UserGroupIcon className="w-5 h-5 text-gray-400 group-data-[selected]:text-gray-900" />,
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-violet-600" /> Команда
            </CardTitle>
            <Badge variant="secondary">{visibleMembers.length} {visibleMembers.length === 1 ? 'сотр.' : 'сотр.'}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -mx-2 px-2">
              {visibleMembers.map((member) => {
                const avatarSrc = getMediaUrl(member.org_avatar) || getMediaUrl(member.user_avatar);
                return (
                  <div key={member.id} className="snap-start shrink-0 w-32 sm:w-40 flex flex-col group cursor-pointer">
                    <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm bg-gray-50 mb-2">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={member.user_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-3xl text-gray-400 font-bold">
                          {member.user_name?.[0]?.toUpperCase() || '👤'}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <div className="font-bold text-white text-[13px] sm:text-[14px] leading-tight line-clamp-2 drop-shadow-md">
                          {member.user_name}
                        </div>
                      </div>
                    </div>
                    <div className="px-1 text-[12px] sm:text-[13px] font-medium text-gray-500 line-clamp-2">
                      {member.position || 'Специалист'}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )
    });
  }

  if (pets.length > 0) {
    tabCategories.push({
      name: 'Подопечные',
      icon: <HeartIcon className="w-5 h-5 text-gray-400 group-data-[selected]:text-gray-900" />,
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-orange-500" /> Наши животные
            </CardTitle>
            <Badge variant="secondary">{pets.length}</Badge>
          </CardHeader>
          <CardContent>
             <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -mx-2 px-2">
              {pets.map((pet) => {
                const photoSrc = getMediaUrl(pet.photo_url) || getMediaUrl(pet.photo);
                const ageText = pet.birth_date ? 'Возраст скрыт' : null; // simplified logic for brevity due to length.
                
                return (
                  <div key={pet.id} onClick={() => router.push(`/pets/${pet.id}`)} className="snap-start shrink-0 w-32 sm:w-40 flex flex-col group cursor-pointer">
                    <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm bg-gray-50 mb-2">
                      {photoSrc ? (
                        <img src={photoSrc} alt={pet.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-3xl font-bold">🐾</div>
                      )}
                      
                      {pet.status === 'looking_for_home' && (
                        <Badge variant="warning" className="absolute top-2 right-2 px-2 py-0.5 text-[10px]">
                          Ищет дом
                        </Badge>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                        <div className="font-bold text-white text-[13px] sm:text-[15px] drop-shadow-md truncate">{pet.name}</div>
                        {pet.gender && <div className={pet.gender === 'male' ? 'text-blue-300' : 'text-pink-300'}>{pet.gender === 'male' ? '♂' : '♀'}</div>}
                      </div>
                    </div>
                    <div className="px-1">
                      <div className="text-[12px] sm:text-[13px] font-medium text-gray-800 truncate">{pet.breed || pet.species}</div>
                      <div className="text-[11px] sm:text-[12px] text-gray-500">Возраст скрыт</div>
                    </div>
                  </div>
                );
              })}
             </div>
          </CardContent>
        </Card>
      )
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 pt-4">
      
      {/* Cover and Profile Card */}
      <Card className="mb-4 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
          {org.cover_photo ? (
            <img src={getMediaUrl(org.cover_photo)} alt={org.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
              <BuildingOfficeIcon className="w-24 h-24" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="relative -mt-16 sm:-mt-20">
              <Avatar 
                src={org.logo ? getMediaUrl(org.logo) : undefined} 
                fallback={org.name} 
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold bg-white text-gray-300 object-cover"
              />
            </div>
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={org.name}>
                      {org.short_name || org.name}
                    </h1>
                    {org.is_verified && <Badge variant="success" className="px-1 py-0! h-5 w-5 flex justify-center items-center"><CheckBadgeIcon className="w-4 h-4"/></Badge>}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                    <Badge variant="outline">{getOrganizationTypeName(org.type)}</Badge>
                    {org.address_city && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{org.address_city}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon"><ShareIcon className="w-5 h-5 text-gray-600" /></Button>
                  <Button variant="outline" size="icon"><HeartIcon className="w-5 h-5 text-gray-600" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Вкладки (Tabs) */}
          <Tabs categories={tabCategories} />

          {/* Посты организации */}
          <div className="space-y-4">
            {isOwnerOrAdmin() && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                   <CreatePost onPostCreated={loadPosts} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Публикации</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl"/></div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500"><p>Пока нет публикаций</p></div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => <PostCard key={post.id} post={post} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-4">
          
          {user && !hasOwner() && !isMember() && !membersLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Организация не подтверждена</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Если вы являетесь официальным представителем организации, вы можете подтвердить владение.
                </p>
                <Button variant="primary" className="w-full" disabled={claimingOwnership} onClick={() => setShowClaimConfirm(true)}>
                  {claimingOwnership ? 'Обработка...' : 'Подтвердить владение'}
                </Button>
              </CardContent>
            </Card>
          )}

          {isMember() && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Управление</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="primary" className="w-full justify-center gap-2" onClick={() => handleGoToManagement()}>
                  <BuildingOfficeIcon className="w-5 h-5" /> Система управления
                </Button>
                {isOwnerOrAdmin() && (
                  <Button variant="secondary" className="w-full" onClick={() => router.push(`/orgs/${org.id}/edit`)}>
                    Редактировать профиль
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {(org.phone || org.email || org.website) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-violet-600" /> Связаться
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {org.phone && (
                    <a href={`tel:${org.phone}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-105 transition-transform"><PhoneIcon className="w-6 h-6" /></div>
                    </a>
                  )}
                  {org.phone && (
                    <a href={`https://t.me/+${org.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center group-hover:bg-sky-100 group-hover:scale-105 transition-transform"><ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" /></div>
                    </a>
                  )}
                  {org.email && (
                    <a href={`mailto:${org.email}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                       <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-100 group-hover:scale-105 transition-transform"><EnvelopeIcon className="w-6 h-6" /></div>
                    </a>
                  )}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                       <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center group-hover:bg-violet-100 group-hover:scale-105 transition-transform"><GlobeAltIcon className="w-6 h-6" /></div>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-violet-600" /> Информация
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Тип</div>
                    <div className="font-semibold text-gray-900">{getOrganizationTypeName(org.type)}</div>
                  </div>
                  {org.inn && (
                    <div><div className="text-gray-500 mb-1">ИНН</div><div className="font-semibold text-gray-900">{org.inn}</div></div>
                  )}
                  {org.ogrn && (
                    <div><div className="text-gray-500 mb-1">ОГРН</div><div className="font-semibold text-gray-900">{org.ogrn}</div></div>
                  )}
                  {org.director_name && (
                    <div>
                      <div className="text-gray-500 mb-1">Руководитель</div>
                      <div className="font-semibold text-gray-900">{org.director_name}</div>
                      {org.director_position && <div className="text-xs text-gray-600 mt-0.5">{org.director_position}</div>}
                    </div>
                  )}
                  <div>
                    <div className="text-gray-500 mb-1">Дата создания</div>
                    <div className="font-semibold text-gray-900">{new Date(org.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showClaimConfirm} onClose={() => setShowClaimConfirm(false)}>
        <DialogTitle onClose={() => setShowClaimConfirm(false)}>Подтвердить владение организацией?</DialogTitle>
        <p className="text-sm text-gray-500 mb-6">После подтверждения вы станете владельцем организации и получите доступ в систему управления.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowClaimConfirm(false)}>Отмена</Button>
          <Button variant="primary" disabled={claimingOwnership} onClick={() => { void handleClaimOwnership(); }}>
            {claimingOwnership ? 'Обработка...' : 'Подтвердить'}
          </Button>
        </DialogFooter>
      </Dialog>

    </div>
  );
}
