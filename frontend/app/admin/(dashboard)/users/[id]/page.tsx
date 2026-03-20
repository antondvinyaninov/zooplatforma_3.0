'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  UserIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  CogIcon,
  CheckBadgeIcon as CheckBadgeIconOutline,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeIconSolid } from '@heroicons/react/24/solid';

interface User {
  id: number;
  name: string;
  last_name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  verified: boolean;
  verified_at?: string;
  created_at: string;
}

type TabType = 'logs' | 'pets' | 'posts' | 'settings';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('logs');

  useEffect(() => {
    loadUser();
  }, [params.id]);

  const loadUser = async () => {      // Загрузка основной информации
    try {
      const response = await fetch(`/main/api/users/${params.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data || result);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!user) return;
    if (!confirm(`Вы уверены, что хотите войти под учетной записью пользователя ${user.name}? Вы потеряете текущую сессию администратора.`)) return;

    try {
      const response = await fetch(`/main/api/auth/impersonate/${user.id}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const token = data?.data?.token;

        if (token) {
          // Сохраняем токен администратора для возможности возврата
          const adminToken = localStorage.getItem('auth_token');
          if (adminToken) {
            localStorage.setItem('admin_auth_token', adminToken);
          }

          // Устанавливаем новый токен
          localStorage.setItem('auth_token', token);
          const maxAge = 30 * 24 * 60 * 60; // 30 дней
          document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        }

        // Redirect to main frontpage
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(`Ошибка входа: ${error.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Ошибка при попытке входа');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Пользователь не найден</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name} {user.last_name}
                {user.verified && (
                  <CheckBadgeIconSolid className="inline w-7 h-7 text-blue-500 ml-2" />
                )}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <div>
            <button
              onClick={handleImpersonate}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Войти как пользователь
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-2" />
              Логирование
            </button>
            <button
              onClick={() => setActiveTab('pets')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'pets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon className="w-5 h-5 inline mr-2" />
              Питомцы
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Посты
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CogIcon className="w-5 h-5 inline mr-2" />
              Настройки
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'logs' && <LogsTab userId={user.id} />}
          {activeTab === 'pets' && <PetsTab userId={user.id} />}
          {activeTab === 'posts' && <PostsTab userId={user.id} />}
          {activeTab === 'settings' && <SettingsTab user={user} onUpdate={loadUser} />}
        </div>
      </div>
    </div>
  );
}

// Helper to format log actions into human readable text and styling
const getLogStyling = (actionType: string) => {
  switch(actionType) {
    case 'user_login': return { icon: '🔑', color: 'bg-blue-100 text-blue-600', text: 'Вход в систему' };
    case 'user_logout': return { icon: '👋', color: 'bg-gray-100 text-gray-500', text: 'Выход из системы' };
    case 'profile_update': return { icon: '✏️', color: 'bg-purple-100 text-purple-600', text: 'Обновление профиля' };
    case 'user_verify': return { icon: '✅', color: 'bg-emerald-100 text-emerald-600', text: 'Верификация аккаунта' };
    case 'post_create': return { icon: '📝', color: 'bg-indigo-100 text-indigo-600', text: 'Публикация поста' };
    case 'post_like': return { icon: '❤️', color: 'bg-rose-100 text-rose-600', text: 'Новая отметка нравится' };
    case 'comment_create': return { icon: '💬', color: 'bg-blue-100 text-blue-500', text: 'Оставлен комментарий' };
    case 'user_register': return { icon: '🎉', color: 'bg-pink-100 text-pink-600', text: 'Регистрация аккаунта' };
    case 'pet_create': return { icon: '🐾', color: 'bg-orange-100 text-orange-600', text: 'Добавление питомца' };
    case 'user_follow': return { icon: '👤', color: 'bg-teal-100 text-teal-600', text: 'Новая подписка' };
    case 'favorite_add': return { icon: '⭐', color: 'bg-yellow-100 text-yellow-600', text: 'Добавление в избранное' };
    case 'report_create': return { icon: '🚩', color: 'bg-red-100 text-red-600', text: 'Отправлена жалоба' };
    default: return { icon: '⚡', color: 'bg-slate-100 text-slate-500', text: actionType };
  }
};

// Компонент вкладки "Логирование"
function LogsTab({ userId }: { userId: number }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/main/api/users/logs/${userId}?limit=50`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Загрузка истории действий...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900">История действий</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Последние {logs.length} записей</span>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Действий пока не зафиксировано</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 ml-3">
          {logs.map((log) => {
            const style = getLogStyling(log.action_type);
            const date = new Date(log.created_at);
            
            return (
              <div key={log.id} className="relative">
                {/* Timeline dot */}
                <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[10px] ${style.color}`}>
                  {style.icon}
                </div>
                
                <div className="bg-white border text-sm border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all rounded-xl p-4 ml-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{style.text}</h4>
                      {log.action_details && log.action_details !== '{}' && (
                        <p className="text-gray-600 mt-1.5 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100 text-xs font-mono break-all whitespace-pre-wrap">
                          {log.action_details}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-gray-500 font-medium">
                        {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {log.ip_address && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          IP: {log.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Компонент вкладки "Питомцы"
function PetsTab({ userId }: { userId: number }) {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPets();
  }, [userId]);

  const loadPets = async () => {
    try {
      const response = await fetch(`/main/api/pets/user/${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setPets(result.data || []);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  const curatedPets = pets.filter(pet => pet.relationship === 'curator' || pet.curator_id === Number(userId));
  const ownedPets = pets.filter(pet => pet.relationship === 'owner' || (!curatedPets.includes(pet) && pet.user_id === Number(userId)));

  return (
    <div className="space-y-8">
      {pets.length === 0 ? (
        <p className="text-gray-500 text-center py-8 border border-gray-100 rounded-xl bg-gray-50/50">
          У пользователя нет привязанных питомцев
        </p>
      ) : (
        <>
          {ownedPets.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Владельческие питомцы <span className="text-gray-400 text-lg font-normal ml-2">({ownedPets.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedPets.map((pet) => (
                  <div key={`owned-${pet.id}`} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      {pet.photo ? (
                        <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-lg">
                          {pet.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{pet.name}</div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">ID: {pet.id}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-50">
                      <span className="font-medium text-gray-700">{pet.species}</span>
                      {pet.breed && <span className="mx-1.5 text-gray-300">•</span>}
                      {pet.breed && <span>{pet.breed}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {curatedPets.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Питомцы на кураторстве <span className="text-gray-400 text-lg font-normal ml-2">({curatedPets.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {curatedPets.map((pet) => (
                  <div key={`curated-${pet.id}`} className="border border-purple-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-purple-50/20">
                    <div className="flex items-center gap-3 mb-2">
                      {pet.photo ? (
                        <img src={pet.photo} alt={pet.name} className="w-12 h-12 rounded-full object-cover border border-purple-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg border border-purple-200">
                          {pet.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{pet.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full inline-flex">Куратор</div>
                          <div className="text-xs text-gray-500">ID: {pet.id}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-3 pt-3 border-t border-purple-100/50">
                      <span className="font-medium text-gray-700">{pet.species}</span>
                      {pet.breed && <span className="mx-1.5 text-gray-300">•</span>}
                      {pet.breed && <span>{pet.breed}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Компонент вкладки "Посты"
function PostsTab({ userId }: { userId: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      const response = await fetch(`/main/api/posts/user/${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Посты пользователя <span className="text-gray-400 font-normal ml-2">({posts.length})</span></h2>
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8 border border-gray-100 rounded-xl bg-gray-50/50">У пользователя пока нет постов</p>
      ) : (
        <div className="space-y-5 max-w-3xl">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Шапка поста */}
              <div className="p-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-3">
                  {post.user?.avatar_url ? (
                    <img src={post.user.avatar_url} alt="User Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold select-none text-sm">
                      {post.user?.first_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 leading-tight">
                        {post.user?.first_name} {post.user?.last_name}
                      </span>
                      {post.user?.is_verified && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(post.created_at).toLocaleString('ru-RU', { 
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
                      })} • ID: {post.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Текст поста */}
              {post.content && (
                <div className="p-4 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>
              )}

              {/* Медиа */}
              {post.media && post.media.length > 0 && (
                <div className={`grid gap-1 ${post.media.length === 1 ? 'grid-cols-1' : post.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} ${!post.content && 'mt-0'}`}>
                  {post.media.map((mediaUrl: string, idx: number) => (
                    <img 
                      key={idx} 
                      src={mediaUrl} 
                      alt={`Post attachment ${idx}`} 
                      className="w-full h-64 object-cover border-y border-gray-100 bg-gray-50"
                    />
                  ))}
                </div>
              )}

              {/* Вложения (файлы) */}
              {post.attachments && post.attachments.length > 0 && (
                <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-gray-50">
                  {post.attachments.map((file: any, idx: number) => {
                    const fileUrl = typeof file === 'string' ? file : file?.url || '';
                    if (!fileUrl) return null;
                    const fileName = fileUrl.split('/').pop() || `Файл ${idx + 1}`;
                    const displayName = typeof file === 'object' && file?.name ? file.name : fileName;
                    
                    return (
                      <a 
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="truncate max-w-[200px]">{displayName}</span>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Привязанные питомцы (если есть) */}
              {post.pets && Array.isArray(post.pets) && post.pets.length > 0 && typeof post.pets[0] === 'object' && typeof post.pets[0].id !== 'undefined' && (
                <div className="px-4 py-3 flex flex-wrap gap-2 bg-slate-50 border-t border-gray-100">
                  {post.pets.map((pet: any, idx: number) => (
                    <span key={pet?.id || `pet-${post.id}-${idx}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
                      <span className="text-slate-400 truncate max-w-[120px]">🐾 {pet?.name || 'Питомец'}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Подвал со статистикой */}
              <div className="px-5 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-medium">{post.comments_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент вкладки "Настройки"
function SettingsTab({ user, onUpdate }: { user: User; onUpdate: () => void }) {
  const [storage, setStorage] = useState<any>(null);
  const [storageLoading, setStorageLoading] = useState(true);

  useEffect(() => {
    loadStorage();
  }, [user.id]);

  const loadStorage = async () => {      // Admin storage stats are not directly implemented, stubbing this route for frontend consistency logic
    try {
      const response = await fetch(`/main/api/users/storage/${user.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setStorage(result.data);
      }
    } catch (error) {
      console.error('Error loading storage:', error);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch('/main/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: user.id }),
      });

      if (response.ok) {
        alert('Пользователь верифицирован');
        onUpdate();
      }
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Верификация</h2>
        <button
          onClick={handleVerify}
          disabled={user.verified}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {user.verified ? 'Верифицирован' : 'Верифицировать'}
        </button>
      </div>

      {/* Управление ролями - загружается независимо */}
      <RolesManager userId={user.id} />

      {/* Использование хранилища */}
      {storageLoading ? (
        <div className="text-center py-4">Загрузка статистики...</div>
      ) : storage ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Использование хранилища</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Посты</div>
              <div className="text-2xl font-bold">{storage.posts_count}</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Питомцы</div>
              <div className="text-2xl font-bold">{storage.pets_count}</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Медиа файлы</div>
              <div className="text-2xl font-bold">{storage.media_count}</div>
              <div className="text-xs text-gray-500">{storage.media_size_mb.toFixed(2)} MB</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Друзья</div>
              <div className="text-2xl font-bold">{storage.friends_count}</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Организации</div>
              <div className="text-2xl font-bold">{storage.organizations_count}</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600">Комментарии</div>
              <div className="text-2xl font-bold">{storage.comments_count}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Компонент управления ролями
function RolesManager({ userId }: { userId: number }) {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [userRolesRes, availableRolesRes] = await Promise.all([
        fetch(`/main/api/admin/roles/user/${userId}`, { credentials: 'include' }),
        fetch('/main/api/admin/roles/available', { credentials: 'include' }),
      ]);

      if (userRolesRes.ok) {
        const result = await userRolesRes.json();
        setUserRoles(result.data || []);
      }

      if (availableRolesRes.ok) {
        const result = await availableRolesRes.json();
        setAvailableRoles(result.data || []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch('/main/api/admin/roles/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          role: selectedRole,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        alert('Роль успешно назначена');
        setShowAddModal(false);
        setSelectedRole('');
        setNotes('');
        loadData();
      } else {
        const error = await response.text();
        alert(`Ошибка: ${error}`);
      }
    } catch (error) {
      console.error('Error granting role:', error);
      alert('Ошибка при назначении роли');
    }
  };

  const handleRevokeRole = async (role: string) => {
    if (!confirm(`Вы уверены, что хотите отозвать роль "${role}"?`)) return;

    try {
      const response = await fetch('/main/api/admin/roles/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          role: role,
        }),
      });

      if (response.ok) {
        alert('Роль успешно отозвана');
        loadData();
      } else {
        const error = await response.text();
        alert(`Ошибка: ${error}`);
      }
    } catch (error) {
      console.error('Error revoking role:', error);
      alert('Ошибка при отзыве роли');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'bg-gray-100 text-gray-800',
      volunteer: 'bg-green-100 text-green-800',
      shelter_admin: 'bg-blue-100 text-blue-800',
      clinic_admin: 'bg-purple-100 text-purple-800',
      moderator: 'bg-orange-100 text-orange-800',
      superadmin: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      user: 'Пользователь',
      volunteer: 'Волонтёр',
      shelter_admin: 'Администратор приюта',
      clinic_admin: 'Администратор ветклиники',
      moderator: 'Модератор',
      superadmin: 'Суперадминистратор',
    };
    return labels[role] || role;
  };

  if (loading) return <div className="text-center py-4">Загрузка ролей...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Роли пользователя</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Добавить роль
        </button>
      </div>

      {userRoles.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Нет назначенных ролей</p>
      ) : (
        <div className="space-y-2">
          {userRoles.map((userRole) => (
            <div
              key={userRole.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole.role)}`}
                  >
                    {getRoleLabel(userRole.role)}
                  </span>
                </div>
                {userRole.notes && (
                  <div className="text-sm text-gray-600 mt-2">{userRole.notes}</div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Назначена: {new Date(userRole.granted_at).toLocaleString('ru-RU')}
                </div>
              </div>
              {userRole.role !== 'user' && (
                <button
                  onClick={() => handleRevokeRole(userRole.role)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Отозвать
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления роли */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Добавить роль</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите роль
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Выберите роль --</option>
                  {availableRoles
                    .filter((role) => !userRoles.some((ur) => ur.role === role.value))
                    .map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Примечание (опционально)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Причина назначения роли..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGrantRole}
                disabled={!selectedRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Назначить
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedRole('');
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
