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
      badge: 'bg-[#00c853] text-white',
      dot: 'bg-[#00c853]',
      label: 'ИЩЕТ ДОМ',
    },
    found: {
      badge: 'bg-[#00b0ff] text-white',
      dot: 'bg-[#00b0ff]',
      label: 'НАЙДЕН',
    },
    lost: {
      badge: 'bg-[#ff3d00] text-white',
      dot: 'bg-[#ff3d00]',
      label: 'ПОТЕРЯН',
    },
    fundraising: {
      badge: 'bg-[#aa00ff] text-white',
      dot: 'bg-[#aa00ff]',
      label: 'СБОР СРЕДСТВ',
    },
  };

  const style = typeStyles[announcement.type];

  // Фото питомца
  const petPhoto = announcement.pet?.photo || '/placeholder-pet.jpg';

  // Прогресс сбора (для fundraising)
  const fundraisingProgress = announcement.fundraising_goal_amount
    ? (announcement.fundraising_current_amount / announcement.fundraising_goal_amount) * 100
    : 0;
    
  // Time ago logic (very basic)
  const daysAgo = Math.floor((new Date().getTime() - new Date(announcement.created_at).getTime()) / (1000 * 3600 * 24));
  const timeString = daysAgo === 0 ? 'Сегодня' : daysAgo === 1 ? '1 день' : daysAgo < 5 ? `${daysAgo} дня` : `${daysAgo} дней`;

  return (
    <Link href={`/announcements/${announcement.id}`} className="block group">
      <div className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
        
        {/* Background Image */}
        <img
          src={petPhoto}
          alt={announcement.title || 'Питомец'}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 tracking-wide via-gray-900/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div className={`${style.badge} px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm`}>
            {style.label}
          </div>
          
          <div className={`w-3 h-3 rounded-full border-2 border-white/60 shadow-sm ${style.dot}`} />
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col justify-end text-white text-left">
          
          {/* Title / Name */}
          <h3 className="text-xl font-bold mb-1 leading-tight line-clamp-1 drop-shadow-sm">
            {announcement.pet?.name || announcement.title}
          </h3>

          {/* Subtitle (Breed, Age) */}
          <p className="text-[13px] text-gray-200 line-clamp-1 mb-3 font-medium">
            {announcement.pet?.breed ? `${announcement.pet.breed}` : "Порода неизвестна"}
            {announcement.pet?.approximate_years || announcement.pet?.approximate_months
              ? `, ${announcement.pet.approximate_years ? `${announcement.pet.approximate_years} г.` : ''} ${
                  announcement.pet.approximate_months ? `${announcement.pet.approximate_months} мес.` : ''
                }`.trim()
              : ''}
          </p>

          {/* Fundraising Details (if any) */}
          {announcement.type === 'fundraising' && announcement.fundraising_goal_amount && (
            <div className="mb-3">
              <div className="flex items-end justify-between text-xs font-semibold mb-1.5 drop-shadow-sm">
                <span>{announcement.fundraising_current_amount.toLocaleString('ru-RU')} ₽</span>
                <span className="text-gray-300">{Math.round(fundraisingProgress)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${style.badge} h-full transition-all`}
                  style={{ width: `${Math.min(fundraisingProgress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Location & Meta Footer */}
          <div className="flex items-center justify-between mt-1 text-[13px] text-gray-300">
            <div className="flex items-center gap-3">
              {announcement.location_city && (
                <div className="flex items-center gap-1 font-medium">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="truncate max-w-[100px]">{announcement.location_city}</span>
                </div>
              )}
              {announcement.type === 'fundraising' ? (
                 <div className="flex items-center gap-1 font-medium">
                   ★ <span className="text-gray-200">12 донов</span>
                 </div>
              ) : announcement.type === 'looking_for_home' ? (
                <div className="flex items-center gap-1 font-medium">
                  <EyeIcon className="w-4 h-4" />
                  <span>{announcement.views_count > 0 ? (announcement.views_count >= 1000 ? `${(announcement.views_count/1000).toFixed(1)}k` : announcement.views_count) : 0}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 font-medium text-green-400">
                  <CalendarIcon className="w-4 h-4" />
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
    </Link>
  );
}
