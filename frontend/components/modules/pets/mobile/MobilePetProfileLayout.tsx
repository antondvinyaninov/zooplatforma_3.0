'use client';

import React, { useRef, useState, useEffect } from 'react';
import PetNavMenu, { Tab } from '@/components/modules/pets/shared/PetNavMenu';
import { PetDetail } from '../profile/PetProfileLayout';

export default function MobilePetProfileLayout({
  pet, orgId, apiUrl, activeTab, setActiveTab, photoUrl, gradient, isdog, ageStr,
  uploading, uploadSuccess, handleQuickUpload, uploadInputRef,
  catalogToggle, handleCatalogStatusChange, handleDelete,
  extraRightActions, showFundraising, renderCenter, InfoRow,
}: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    // Небольшая задержка, чтобы контент успел отрендериться
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const renderMobileInfoTab = () => {
    const SIZE_LABELS: Record<string, string> = { small: 'Маленький', medium: 'Средний', large: 'Крупный' };
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-2">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Инфо</div>
        
        <div className="flex flex-col gap-3 pb-4 border-b border-gray-100 mb-2">
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">Системный ID</div>
            <div className="text-[13px] text-gray-700 font-semibold">#{pet.id}</div>
          </div>
          {pet.org_pet_number && (
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">Учетный номер</div>
              <div className="text-[13px] text-gray-700 font-bold">#{pet.org_pet_number}</div>
            </div>
          )}
          {(pet.city || pet.location_address) && (
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">Город</div>
              <div className="text-[13px] text-gray-700 font-semibold">{pet.city || pet.location_address}</div>
            </div>
          )}
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">Добавлен</div>
            <div className="text-[13px] text-gray-700">
              {new Date(pet.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-400 mb-0.5">Ответственный</div>
            <div className="text-[13px] text-gray-700 font-semibold">
              {pet.org_id ? (
                <span>Организация ({pet.org_name || 'Профиль'})</span>
              ) : pet.user_id ? (
                <span>{pet.relationship === 'curator' ? 'Куратор' : pet.relationship === 'guardian' ? 'Опекун' : 'Владелец'} ({pet.owner_name || 'Профиль'})</span>
              ) : (
                pet.relationship === 'curator' ? 'Куратор' : pet.relationship === 'guardian' ? 'Опекун' : 'Владелец'
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <InfoRow icon="⚧" label="Пол" value={pet.gender === 'male' ? 'Самец ♂' : 'Самка ♀'} />
          {ageStr && <InfoRow icon="🎂" label="Возраст" value={ageStr} />}
          <InfoRow icon="📏" label="Размер" value={pet.size ? SIZE_LABELS[pet.size] : null} />
          <InfoRow icon="🎨" label="Окрас" value={pet.color} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full pb-8">
      {/* 1. Верхний блок: Фото и основная инфа */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div style={{
          height: 220, background: photoUrl ? '#000' : gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80,
          position: 'relative'
        }}>
          {photoUrl
            ? <img src={photoUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (isdog ? '🐕' : '🐈')}
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] font-bold text-gray-700">
            №{pet.org_pet_number || pet.id}
          </span>
        </div>
        <div className="p-4 pb-3">
          <div className="font-bold text-xl text-gray-900 mb-1">{pet.name}</div>
          <div className="text-sm text-gray-500">
            {pet.species_name || (isdog ? 'Собака' : 'Кошка')}{pet.breed_name ? ` · ${pet.breed_name}` : ''}
          </div>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
            className={`w-full py-2.5 rounded-lg text-sm transition-all font-medium ${
              uploadSuccess 
                ? 'border border-green-300 bg-green-50 text-green-600' 
                : uploading 
                  ? 'bg-gray-50 text-gray-400 border border-dashed border-gray-300' 
                  : 'bg-transparent text-gray-500 border border-dashed border-gray-300 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {uploadSuccess ? '✓ Фото загружено' : uploading ? 'Загрузка...' : '+ Изменить фото'}
          </button>
        </div>
      </div>


      {/* 3. Горизонтальное меню (Scrollable) */}
      <div className="w-full relative">
        {canScrollLeft && (
          <button 
            onClick={() => scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' })}
            className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pr-6 pl-1 flex items-center text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        
        <div 
          ref={scrollRef} 
          onScroll={checkScroll}
          className="overflow-x-auto scrollbar-hide relative z-0 pb-2 -mb-2"
        >
          <div className="min-w-max px-2 py-1">
             <PetNavMenu activeTab={activeTab} onChange={setActiveTab} showFundraising={showFundraising && pet.catalog_status === 'needs_help'} mobileView />
          </div>
        </div>

        {canScrollRight && (
          <button 
            onClick={() => scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' })}
            className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pl-6 pr-1 flex items-center text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      {/* 4. Динамический контент по табу */}
      <div className="min-h-[300px]">
        {activeTab === 'info' ? renderMobileInfoTab() : renderCenter()}
      </div>

      {/* 5. Управление (Действия) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-2">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Управление карточкой</div>
        <div className="flex flex-col gap-3">
          
          {catalogToggle && (
            <div className="pb-3 border-b border-gray-100 mb-1">
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-semibold ${pet.catalog_status && pet.catalog_status !== 'draft' ? 'text-blue-600' : 'text-gray-700'}`}>
                  {pet.catalog_status && pet.catalog_status !== 'draft' ? 'В каталоге' : 'Скрыт из каталога'}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" className="sr-only peer"
                    checked={pet.catalog_status !== 'draft'}
                    onChange={(e) => handleCatalogStatusChange(e.target.checked ? 'looking_for_home' : 'draft')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              
              {pet.catalog_status && pet.catalog_status !== 'draft' && (
                <div className="mt-3">
                  <div className="text-[11px] text-gray-500 mb-1">Статус публикации:</div>
                  <select 
                    value={pet.catalog_status}
                    onChange={(e) => handleCatalogStatusChange(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 outline-none"
                  >
                    <option value="looking_for_home">Ищет дом</option>
                    <option value="needs_help">Сбор средств</option>
                    <option value="lost">Потерян</option>
                    <option value="found">Найден</option>
                  </select>
                  <a 
                    href={`/main/pets/${pet.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline text-center"
                  >
                    ↗ Открыть в каталоге
                  </a>
                </div>
              )}
            </div>
          )}

          {extraRightActions}

          <button 
            onClick={handleDelete}
            className="w-full text-left font-semibold text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm transition-colors hover:bg-red-100 mt-2"
          >
            🗑Удалить карточку питомца
          </button>
        </div>
      </div>
    </div>
  );
}
