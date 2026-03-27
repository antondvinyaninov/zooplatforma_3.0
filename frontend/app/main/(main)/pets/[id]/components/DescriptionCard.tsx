'use client';

import { Pet } from '../../../../../../lib/api';

interface DescriptionCardProps {
  pet: Pet;
}

export default function DescriptionCard({ pet }: DescriptionCardProps) {
  const descriptionText = pet.description?.trim();

  if (!descriptionText) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Описание</h3>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {descriptionText}
      </p>
    </div>
  );
}
