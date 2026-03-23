import { useState } from 'react';
import PetTimeline from './PetTimeline';
import PetGeneralInfo from './PetGeneralInfo';
import PetIdentification from './PetIdentification';
import PetHealth from './PetHealth';
import PublicationTab from './PublicationTab';
import GalleryTab from './GalleryTab';

interface PetTabsProps {
  isEditing: boolean;
  pet: any;
  editData: any;
  setEditData: (data: any) => void;
  breeds: any[];
  breedSearch: string;
  setBreedSearch: (search: string) => void;
  showBreedDropdown: boolean;
  setShowBreedDropdown: (show: boolean) => void;
  birthDateType: 'exact' | 'approximate';
  setBirthDateType: (type: 'exact' | 'approximate') => void;
  calculateBirthDate: (years: number, months: number) => void;
  age: { years: number; months: number } | null;
}

type TabType = 'publication' | 'timeline' | 'general' | 'identification' | 'health' | 'gallery' | 'system';

export default function PetTabs({
  isEditing,
  pet,
  editData,
  setEditData,
  breeds,
  breedSearch,
  setBreedSearch,
  showBreedDropdown,
  setShowBreedDropdown,
  birthDateType,
  setBirthDateType,
  calculateBirthDate,
  age,
}: PetTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('publication');

  const tabs = [
    { id: 'timeline' as TabType, label: 'Хронология', icon: '📅' },
    { id: 'publication' as TabType, label: 'Каталог', icon: '📢' },
    { id: 'general' as TabType, label: 'Общая информация', icon: '📋' },
    { id: 'identification' as TabType, label: 'Идентификация', icon: '🏷️' },
    { id: 'health' as TabType, label: 'Здоровье', icon: '🏥' },
    { id: 'gallery' as TabType, label: 'Галерея', icon: '📸' },
    { id: 'system' as TabType, label: 'Система', icon: '⚙️' },
  ];

  return (
    <div>
      {/* Табы */}
      <div className="bg-white rounded-t-lg shadow border-b overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Контент табов */}
      <div className="bg-white rounded-b-lg shadow p-6">
        {activeTab === 'publication' && (
          <PublicationTab
            isEditing={isEditing}
            pet={pet}
            editData={editData}
            setEditData={setEditData}
          />
        )}

        {activeTab === 'timeline' && <PetTimeline petId={pet.id} pet={pet} />}

        {activeTab === 'general' && (
          <PetGeneralInfo
            isEditing={isEditing}
            pet={pet}
            editData={editData}
            setEditData={setEditData}
            breeds={breeds}
            breedSearch={breedSearch}
            setBreedSearch={setBreedSearch}
            showBreedDropdown={showBreedDropdown}
            setShowBreedDropdown={setShowBreedDropdown}
            age={age}
          />
        )}

        {activeTab === 'identification' && (
          <PetIdentification
            isEditing={isEditing}
            pet={pet}
            editData={editData}
            setEditData={setEditData}
          />
        )}

        {activeTab === 'health' && (
          <PetHealth
            isEditing={isEditing}
            pet={pet}
            editData={editData}
            setEditData={setEditData}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryTab
            isEditing={isEditing}
            pet={pet}
            editData={editData}
            setEditData={setEditData}
          />
        )}

        {activeTab === 'system' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ID питомца</label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">#{pet.id}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Дата регистрации
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {new Date(pet.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {pet.species_id && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ID вида</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {pet.species_id}
                </p>
              </div>
            )}

            {pet.breed_id && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ID породы</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {pet.breed_id}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
