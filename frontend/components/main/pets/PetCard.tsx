'use client';

import { useState } from 'react';
import {
  MapPinIcon,
  CalendarIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  HomeIcon,
  BanknotesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export type PetCardType = 'default' | 'looking_for_home' | 'found' | 'lost' | 'fundraising';

interface PetCardData {
  id: number;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string;
  color?: string;
  photo?: string;

  // Карточка
  card_type: PetCardType;
  card_description?: string;
  card_contact_phone?: string;
  card_location_city?: string;
  card_location_address?: string;

  // Потерян
  card_lost_date?: string;
  card_lost_location?: string;
  card_reward_amount?: number;

  // Сбор средств
  card_fundraising_goal?: number;
  card_fundraising_current?: number;
  card_fundraising_purpose?: string;

  // Медицинская информация
  is_sterilized?: boolean;
  is_vaccinated?: boolean;
  chip_number?: string;
}

interface PetCardProps {
  pet: PetCardData;
  onAction?: (action: string) => void;
}

export default function PetCard({ pet, onAction }: PetCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Вычисляем возраст
  const getAge = () => {
    if (!pet.birth_date) return null;
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();

    if (years > 0) {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    }
    return 'Новорождённый';
  };

  // Стили в зависимости от типа
  const typeStyles = {
    default: {
      bg: 'bg-white',
      border: 'border-gray-200',
      badge: null,
    },
    looking_for_home: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: { bg: 'bg-blue-500', text: '🏠 Ищет дом' },
    },
    found: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      badge: { bg: 'bg-cyan-500', text: '🔍 Найден' },
    },
    lost: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      badge: { bg: 'bg-pink-500', text: '❗ Потерян' },
    },
    fundraising: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: { bg: 'bg-purple-500', text: '💰 Сбор средств' },
    },
  };

  const style = typeStyles[pet.card_type];
  const age = getAge();

  // Прогресс сбора
  const fundraisingProgress = pet.card_fundraising_goal
    ? ((pet.card_fundraising_current || 0) / pet.card_fundraising_goal) * 100
    : 0;

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-xl overflow-hidden shadow-sm`}>
      {/* Badge типа */}
      {style.badge && (
        <div className={`${style.badge.bg} text-white px-4 py-2 text-sm font-semibold`}>
          {style.badge.text}
        </div>
      )}

      <div className="p-4">
        {/* Фото и основная информация */}
        <div className="flex gap-4 mb-4">
          {/* Фото */}
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
            {pet.photo ? (
              <img
                src={`${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${pet.photo}`}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                🐾
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{pet.name}</h3>

            <div className="space-y-1 text-sm text-gray-600">
              {/* Вид и порода */}
              <div>
                {pet.species}
                {pet.breed && ` • ${pet.breed}`}
              </div>

              {/* Возраст */}
              {age && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{age}</span>
                </div>
              )}

              {/* Пол */}
              {pet.gender && <div>{pet.gender === 'male' ? '♂ Самец' : '♀ Самка'}</div>}

              {/* Город */}
              {pet.card_location_city && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{pet.card_location_city}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Описание */}
        {pet.card_description && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{pet.card_description}</p>
        )}

        {/* Характер/Окрас */}
        {pet.color && (
          <div className="mb-4">
            <span className="text-xs text-gray-500">Окрас:</span>
            <span className="text-sm text-gray-700 ml-2">{pet.color}</span>
          </div>
        )}

        {/* Медицинская информация */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {pet.is_vaccinated && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              <CheckCircleIcon className="w-3 h-3" />
              Привит
            </span>
          )}
          {pet.is_sterilized && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              <CheckCircleIcon className="w-3 h-3" />
              Стерилизован
            </span>
          )}
          {pet.chip_number && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              <CheckCircleIcon className="w-3 h-3" />
              Чипирован
            </span>
          )}
        </div>

        {/* Специфичная информация по типу */}
        {pet.card_type === 'lost' && pet.card_reward_amount && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 mb-4">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-yellow-700" />
              <div>
                <div className="text-xs text-yellow-700">Вознаграждение</div>
                <div className="text-lg font-bold text-yellow-900">
                  {pet.card_reward_amount.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
            {pet.card_lost_location && (
              <div className="text-xs text-yellow-800 mt-2">
                Последний раз видели: {pet.card_lost_location}
              </div>
            )}
          </div>
        )}

        {pet.card_type === 'fundraising' && pet.card_fundraising_goal && (
          <div className="mb-4">
            {/* Цель сбора */}
            {pet.card_fundraising_purpose && (
              <div className="text-sm text-gray-700 mb-2">{pet.card_fundraising_purpose}</div>
            )}

            {/* Прогресс */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{ width: `${Math.min(fundraisingProgress, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-purple-900">
                  {(pet.card_fundraising_current || 0).toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-gray-600">
                  из {pet.card_fundraising_goal.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="space-y-2">
          {/* Основная кнопка */}
          {pet.card_type === 'looking_for_home' && (
            <button
              onClick={() => onAction?.('take_home')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              <HomeIcon className="w-5 h-5" />
              Взять домой
            </button>
          )}

          {pet.card_type === 'found' && (
            <button
              onClick={() => onAction?.('claim_owner')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
            >
              <HomeIcon className="w-5 h-5" />Я владелец
            </button>
          )}

          {pet.card_type === 'lost' && (
            <button
              onClick={() => onAction?.('seen')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors"
            >
              <MapPinIcon className="w-5 h-5" />Я видел
            </button>
          )}

          {pet.card_type === 'fundraising' && (
            <button
              onClick={() => onAction?.('donate')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              <HeartIcon className="w-5 h-5" />
              Помочь
            </button>
          )}

          {/* Дополнительные кнопки */}
          <div className="flex gap-2">
            <button
              onClick={() => onAction?.('ask')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 transition-colors"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              Задать вопрос
            </button>

            <button
              onClick={() => onAction?.('share')}
              className="flex items-center justify-center px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
