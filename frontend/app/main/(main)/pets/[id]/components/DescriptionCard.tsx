'use client';

import { Pet } from '../../../../../../lib/api';

interface DescriptionCardProps {
  pet: Pet;
}

export default function DescriptionCard({ pet }: DescriptionCardProps) {
  // Временно используем заглушку, если описания нет в модели Pet
  const defaultDescription = pet.status === 'needs_help' 
    ? `Нашему любимому ${pet.gender === 'female' ? 'кошке' : 'коту'} ${pet.name} срочно требуется операция, и без своевременного лечения ${pet.gender === 'female' ? 'она' : 'он'} может погибнуть. Мы обращаемся к вам за помощью - любая сумма будет очень важна для спасения.`
    : pet.status === 'looking_for_home'
    ? `Милый ${pet.gender === 'female' ? 'ребенок' : 'малыш'} ${pet.name}, привит, стерилизован. Очень ласковый и игривый. Ищет добрую семью, которая сможет уделить достаточно внимания и заботы.`
    : pet.status === 'lost'
    ? `Потерялся ${pet.species.toLowerCase()} ${pet.name}, ${pet.breed || ''}, окрас ${pet.color || 'неизвестно'}. Последний раз видели возле дома. Если найдете, пожалуйста, свяжитесь с нами!`
    : `Найден ${pet.species.toLowerCase()}, похож на ${pet.breed || 'обычного'}, окрас ${pet.color || 'неизвестно'}. Очень ласковый и не агрессивный. Ошейник без номера.`;

  const descriptionText = pet.description?.trim() || defaultDescription;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Описание</h3>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {descriptionText}
      </p>
    </div>
  );
}
