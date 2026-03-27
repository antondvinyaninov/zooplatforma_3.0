'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MapPinIcon, EyeIcon, ShareIcon, PencilIcon, ChartBarIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { Pet } from '../../../../../../lib/api';

interface TopSectionProps {
  pet: Pet;
  isOwnerOrCurator: boolean;
}

export default function TopSection({ pet, isOwnerOrCurator }: TopSectionProps) {
  const router = useRouter();

  const status = pet.catalog_status || pet.status;

  // Маппинг статусов на бейджи
  const getBadgeInfo = () => {
    switch (status) {
      case 'needs_help':
        return { text: 'Сбор средств', color: 'text-purple-600', dot: 'bg-purple-600' };
      case 'looking_for_home':
        return { text: 'Ищет дом', color: 'text-blue-600', dot: 'bg-blue-600' };
      case 'lost':
        return { text: 'Потерян', color: 'text-red-500', dot: 'bg-red-500' };
      case 'found':
        return { text: 'Найден', color: 'text-cyan-500', dot: 'bg-cyan-500' };
      default:
        return { text: 'Объявление', color: 'text-gray-600', dot: 'bg-gray-500' };
    }
  };

  const badge = getBadgeInfo();

  // Форматирование даты
  const formattedDate = new Date(pet.created_at || Date.now()).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const viewsCount = pet.views_count || 0;

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/main/pets/${pet.id}`;
    const shareTitle = `ЗооПлатформа | ${pet.name || 'Питомец'} (${pet.species_name || pet.species || 'животное'})`;
    const shareText = pet.description 
      ? pet.description.substring(0, 100) + (pet.description.length > 100 ? '...' : '') 
      : `${badge.text}. Узнайте подробности на платформе.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        console.log('Пользователь отменил шаринг или API не поддерживается', err);
        navigator.clipboard.writeText(postUrl);
        alert('Ссылка скопирована в буфер обмена!');
      }
    } else {
      navigator.clipboard.writeText(postUrl);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  return (
    <>
      <div className="bg-[#eff5ff] rounded-xl border border-blue-100 p-4 sm:p-6 mb-2.5">
        {/* Top Breadcrumb / Back button area */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад в каталог
          </button>

          <div className={`flex items-center gap-2 text-sm font-semibold ${badge.color}`}>
            <div className={`w-2 h-2 rounded-full ${badge.dot}`}></div>
            {badge.text}
          </div>
        </div>

        {/* Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 mb-3 leading-tight">
              {pet.name || 'Питомец'}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 font-medium">
              {pet.city && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  г. {pet.city.split(',')[0].trim()}
                </div>
              )}
              {pet.city && <span className="text-gray-400">•</span>}
              <div className="flex items-center">
                {formattedDate}
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {viewsCount} просмотров
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button 
              onClick={handleShare}
              className="p-2.5 text-[#00c853] border border-[#00c853]/30 bg-green-50/50 rounded-lg hover:bg-green-50 transition-colors"
              title="Поделиться"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            {isOwnerOrCurator && (
              <>
                <a
                  href={pet.relationship === 'curator' ? `/pethelper/pets/${pet.id}` : `/owner/pets/${pet.id}`}
                  className="p-2.5 text-blue-400 border border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  title="Редактировать"
                >
                  <PencilIcon className="w-5 h-5" />
                </a>
                <button 
                  className="p-2.5 text-purple-400 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                  title="Статистика"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Breadcrumbs */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="text-sm font-medium text-gray-400 flex flex-wrap gap-2 items-center">
          <span onClick={() => router.push('/')} className="cursor-pointer hover:text-blue-600 transition-colors">Главная</span>
          <span>/</span>
          <span onClick={() => router.push('/catalog')} className="cursor-pointer hover:text-blue-600 transition-colors">Каталог питомцев</span>
          <span>/</span>
          <span onClick={() => router.push(`/catalog?status=${status}`)} className="cursor-pointer hover:text-blue-600 transition-colors">{badge.text}</span>
          <span>/</span>
          <span onClick={() => router.push(`/catalog?status=${status}&species_id=${pet.species_id || ''}`)} className="cursor-pointer hover:text-blue-600 transition-colors">{pet.species_name || pet.species || 'Животное'}</span>
          <span>/</span>
          <span className="text-gray-900">{pet.name || 'Питомец'}</span>
        </div>
      </div>
    </>
  );
}
