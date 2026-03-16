'use client';

import { PetAnnouncement } from '@/types/announcement';
import Link from 'next/link';
import {
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface AnnouncementCardProps {
  announcement: PetAnnouncement;
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  // Цвета и стили в зависимости от типа
  const typeStyles = {
    looking_for_home: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-500 text-white',
      label: '🏠 Ищет дом',
    },
    found: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      badge: 'bg-cyan-500 text-white',
      label: '🔍 Найден',
    },
    lost: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      badge: 'bg-pink-500 text-white',
      label: '❗ Потерян',
    },
    fundraising: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-500 text-white',
      label: '💰 Сбор средств',
    },
  };

  const style = typeStyles[announcement.type];

  // Фото питомца
  const petPhoto = announcement.pet?.photo || '/placeholder-pet.jpg';

  // Прогресс сбора (для fundraising)
  const fundraisingProgress = announcement.fundraising_goal_amount
    ? (announcement.fundraising_current_amount / announcement.fundraising_goal_amount) * 100
    : 0;

  return (
    <Link href={`/announcements/${announcement.id}`}>
      <div
        className={`${style.bg} border-2 ${style.border} rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
      >
        {/* Header с типом */}
        <div
          className={`${style.badge} px-4 py-2 text-sm font-semibold flex items-center justify-between`}
        >
          <span>{style.label}</span>
          <span className="flex items-center gap-1 text-xs opacity-90">
            <EyeIcon className="w-4 h-4" />
            {announcement.views_count}
          </span>
        </div>

        <div className="p-4">
          {/* Фото и основная информация */}
          <div className="flex gap-4 mb-4">
            {/* Фото питомца */}
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
              <img
                src={petPhoto}
                alt={announcement.pet?.name || 'Питомец'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Информация */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                {announcement.title}
              </h3>

              {announcement.pet && (
                <p className="text-sm text-gray-600 mb-2">
                  {announcement.pet.species}{' '}
                  {announcement.pet.breed && `• ${announcement.pet.breed}`}
                  {announcement.pet.gender &&
                    ` • ${announcement.pet.gender === 'male' ? 'Самец' : 'Самка'}`}
                </p>
              )}

              {/* Локация */}
              {announcement.location_city && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{announcement.location_city}</span>
                </div>
              )}

              {/* Дата события */}
              {announcement.event_date && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {new Date(announcement.event_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })}
                    {announcement.event_time && `, ${announcement.event_time}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Описание */}
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">{announcement.description}</p>

          {/* Специфичная информация по типу */}
          {announcement.type === 'lost' && announcement.lost_reward_amount && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-900">
                Вознаграждение: {announcement.lost_reward_amount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          )}

          {announcement.type === 'fundraising' && announcement.fundraising_goal_amount && (
            <div className="space-y-2">
              {/* Прогресс бар */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${Math.min(fundraisingProgress, 100)}%` }}
                />
              </div>

              {/* Суммы */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-purple-900">
                  {announcement.fundraising_current_amount.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-gray-600">
                  из {announcement.fundraising_goal_amount.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              {/* Процент */}
              <div className="text-xs text-gray-500 text-center">
                Собрано {Math.round(fundraisingProgress)}%
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>
              {new Date(announcement.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>

            {announcement.posts && announcement.posts.length > 0 && (
              <span className="flex items-center gap-1">
                📝 {announcement.posts.length}{' '}
                {announcement.posts.length === 1 ? 'публикация' : 'публикаций'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
