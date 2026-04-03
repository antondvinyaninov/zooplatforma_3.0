'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  CheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { notificationsApi, Notification } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

type FilterType = 'all' | 'unread' | 'like' | 'comment' | 'friend';

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...notifications];

    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    } else if (filter === 'like') {
      filtered = filtered.filter((n) => n.type === 'like');
    } else if (filter === 'comment') {
      filtered = filtered.filter((n) => n.type === 'comment');
    } else if (filter === 'friend') {
      filtered = filtered.filter(
        (n) => n.type === 'friend_request' || n.type === 'friend_accepted'
      );
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтра
  };

  const handleMarkAsRead = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      }
    } catch (error) {
      console.error('Ошибка отметки уведомления', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      notificationsApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }

    if (notification.type === 'comment' || notification.type === 'like') {
      router.push('/');
    } else if (notification.type === 'friend_request') {
      router.push('/friends/requests');
    } else if (notification.type === 'friend_accepted') {
      router.push('/friends');
    } else if (notification.type === 'radar_sos') {
      router.push('/radar');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="bg-red-50 p-2 rounded-xl">
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="bg-blue-50 p-2 rounded-xl">
            <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />
          </div>
        );
      case 'friend_request':
        return (
          <div className="bg-green-50 p-2 rounded-xl">
            <UserPlusIcon className="w-5 h-5 text-green-500" />
          </div>
        );
      case 'friend_accepted':
        return (
          <div className="bg-emerald-50 p-2 rounded-xl">
            <CheckIcon className="w-5 h-5 text-emerald-500" />
          </div>
        );
      case 'radar_sos':
        return (
          <div className="bg-orange-50 p-2 rounded-xl animate-pulse">
            <BellIcon className="w-5 h-5 text-orange-500" animate-bounce="true" />
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-xl">
            <BellIcon className="w-5 h-5 text-gray-500" />
          </div>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return `Вчера в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} дн назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'Все', count: notifications.length },
    { id: 'unread', label: 'Новые', count: unreadCount },
    { id: 'like', label: 'Лайки' },
    { id: 'comment', label: 'Комментарии' },
    { id: 'friend', label: 'Заявки' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 pb-20">
      
      {/* Стеклянный Sticky Header */}
      <div className="sticky top-0 z-30 pt-6 pb-4 px-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                <BellIcon className="w-6 h-6 text-white" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
                <p className="text-sm font-medium text-gray-500 mt-0.5">
                  {unreadCount > 0 
                    ? `У вас ${unreadCount} необработанных событий` 
                    : 'Вы прочитали абсолютно всё!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-all font-medium active:scale-95"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Прочитать все
              </button>
            )}
          </div>

          {/* Сегментированные фильтры (Apple Style) */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl overflow-x-auto no-scrollbar gap-1 ring-1 ring-inset ring-gray-200/50">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 select-none flex-1 justify-center ${
                  filter === f.id
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {f.label}
                {f.count !== undefined && (
                  <span 
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                      filter === f.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200/80 text-gray-500'
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Синхронизация...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-16 text-center transition-all duration-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-gray-50">
              <BellIcon className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {filter === 'all' ? 'Пока ничего нет' : 'В этой категории пусто'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
              {filter === 'all'
                ? 'Здесь будут появляться все новые лайки, комментарии и заявки в друзья.'
                : 'Попробуйте переключить вкладку или зайти сюда немного позже.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative bg-white border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                  !notification.is_read 
                    ? 'border-blue-100 shadow-[0_8px_30px_rgb(59,130,246,0.06)]' 
                    : 'border-transparent shadow-sm'
                }`}
              >
                {/* Светящийся индикатор непрочитанного (Glowing Dot) */}
                {!notification.is_read && (
                  <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)] opacity-100 transition-opacity"></div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  
                  {/* Иконка или Аватар */}
                  <div className="relative flex-shrink-0">
                    {notification.actor ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/id${notification.actor_id}`);
                        }}
                        className="w-14 h-14 rounded-[1.25rem] bg-gray-100 flex items-center justify-center text-gray-400 font-bold overflow-hidden ring-1 ring-inset ring-black/5 hover:ring-blue-400 focus:outline-none transition-all"
                      >
                        {notification.actor.avatar ? (
                          <img
                            src={getMediaUrl(notification.actor.avatar) || ''}
                            alt={notification.actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {notification.actor.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ) : (
                      getNotificationIcon(notification.type)
                    )}
                    
                    {/* Badge типа действия поверх аватара, если есть автор */}
                    {notification.actor && (
                      <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full bg-white shadow-sm">
                        {notification.type === 'like' && <HeartSolidIcon className="w-5 h-5 text-red-500" />}
                        {notification.type === 'comment' && <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500" />}
                        {notification.type === 'friend_request' && <UserPlusIcon className="w-5 h-5 text-green-500" />}
                      </div>
                    )}
                  </div>

                  {/* Текст Уведомления */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className={`text-[15px] leading-relaxed break-words ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-400 font-medium mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>

                  {/* Быстрое действие Отметить/Прочитано */}
                  {!notification.is_read && (
                    <div className="absolute top-4 right-4 sm:static opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors tooltip"
                        title="Пометить как прочитанное"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Пагинация (обновленная) */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {startIndex + 1} &ndash; {Math.min(endIndex, filteredNotifications.length)} из {filteredNotifications.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
              >
                Назад
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
              >
                Далее
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
