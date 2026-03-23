'use client';

import { Pet } from '../../../../../../lib/api';

interface MedicalInfoCardProps {
  pet: Pet;
}

export default function MedicalInfoCard({ pet }: MedicalInfoCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Медицинская информация</h3>
      
      <ul className="space-y-3">
        <li className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${pet.is_vaccinated ? 'bg-[#00c853]' : 'bg-gray-300'}`}></div>
          <span className="text-gray-700">Привит: <span className="font-medium">{pet.is_vaccinated ? 'Да' : 'Нет/Неизвестно'}</span></span>
        </li>
        <li className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${pet.is_sterilized ? 'bg-[#00c853]' : 'bg-gray-300'}`}></div>
          <span className="text-gray-700">Стерилизован: <span className="font-medium">{pet.is_sterilized ? 'Да' : 'Нет/Неизвестно'}</span></span>
        </li>
        <li className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${pet.chip_number ? 'bg-[#00c853]' : 'bg-gray-300'}`}></div>
          <span className="text-gray-700">Чипирован: <span className="font-medium">{pet.chip_number ? 'Да' : 'Нет/Неизвестно'}</span></span>
        </li>
      </ul>
    </div>
  );
}
