'use client';

import { useState, useEffect } from 'react';
import { MegaphoneIcon, MagnifyingGlassCircleIcon, PlusCircleIcon, HeartIcon } from '@heroicons/react/24/outline';

interface PublicationTabProps {
  isEditing: boolean;
  pet: any;
  editData: any;
  setEditData: (data: any) => void;
}

export default function PublicationTab({
  isEditing,
  pet,
  editData,
  setEditData,
}: PublicationTabProps) {

  const [localStatus, setLocalStatus] = useState(pet?.catalog_status || 'draft');
  const [localData, setLocalData] = useState(pet?.catalog_data || {});
  const [localDesc, setLocalDesc] = useState(pet?.description || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Синхронизация при приходе новых данных из пропсов (если загрузились позже)
  useEffect(() => {
    if (!isEditing) {
      setLocalStatus(pet?.catalog_status || 'draft');
      setLocalData(pet?.catalog_data || {});
      setLocalDesc(pet?.description || '');
    }
  }, [pet?.catalog_status, pet?.catalog_data, pet?.description, isEditing]);

  const saveToServer = async (updates: any) => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/pethelper/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        // Локальное обновление для консистентности (оптимистичный UI)
        if (updates.catalog_status !== undefined) pet.catalog_status = updates.catalog_status;
        if (updates.catalog_data !== undefined) pet.catalog_data = updates.catalog_data;
        if (updates.description !== undefined) pet.description = updates.description;
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleStatusChange = (newStatus: string) => {
    // В режиме глобального редактирования просто меняем стейт
    if (isEditing) {
      setEditData({ ...editData, catalog_status: newStatus });
      setLocalStatus(newStatus);
      return;
    }

    setLocalStatus(newStatus);
    saveToServer({ catalog_status: newStatus });
  };

  const updateLocalData = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    
    if (isEditing) {
      setEditData({
        ...editData,
        catalog_data: { ...editData.catalog_data, [key]: value }
      });
    }
  };

  const handleDataBlur = () => {
    if (isEditing) return; // Сохранит общая кнопка
    // Проверяем, изменились ли данные (простое сравнение)
    if (JSON.stringify(localData) === JSON.stringify(pet.catalog_data || {})) return;
    saveToServer({ catalog_data: localData });
  };

  const handleDescBlur = () => {
    if (isEditing) {
      setEditData({ ...editData, description: localDesc });
      return;
    }
    if (localDesc === pet.description) return;
    saveToServer({ description: localDesc });
  };

  // Определяем, какие данные отображать: локальные (режим автосохранения) или из editData
  const displayStatus = isEditing ? (editData.catalog_status || 'draft') : localStatus;
  const displayData = isEditing ? (editData.catalog_data || {}) : localData;

  const hasPhoto = !!(pet?.photo || pet?.photo_url || (pet?.media_urls && pet?.media_urls.length > 0));
  const isPublished = displayStatus !== 'draft';

  const handleTogglePublish = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (checked) {
      if (!hasPhoto) {
        alert('Для публикации в каталоге у питомца должно быть загружено хотя бы одно фото. Перейдите во вкладку "Галерея" или "Основная информация".');
        return;
      }
      handleStatusChange('looking_for_home'); // По умолчанию ставим "Ищет дом"
    } else {
      handleStatusChange('draft');
    }
  };

  const statuses = [
    { id: 'looking_for_home', label: 'Ищет дом', icon: <HeartIcon className="w-5 h-5 text-pink-500" />, desc: 'Обычное пристройство' },
    { id: 'needs_help', label: 'Сбор средств', icon: <PlusCircleIcon className="w-5 h-5 text-purple-500" />, desc: 'Нужна помощь на лечение' },
    { id: 'lost', label: 'Потерян', icon: <MegaphoneIcon className="w-5 h-5 text-red-500" />, desc: 'Поиск пропавшего питомца' },
    { id: 'found', label: 'Найден', icon: <MagnifyingGlassCircleIcon className="w-5 h-5 text-blue-500" />, desc: 'Поиск старых хозяев' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Главный переключатель публикации */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Отображать в каталоге</h3>
          <p className="text-sm text-gray-500 mt-1">
            Включите, чтобы карточка питомца стала доступна всем посетителям платформы.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isPublished}
            onChange={handleTogglePublish}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Статус публикации (Доступно только если опубликовано) */}
      {isPublished && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Тип объявления</h3>
            {!isEditing && saveStatus === 'saving' && <span className="text-sm text-blue-500 animate-pulse">Сохранение...</span>}
            {!isEditing && saveStatus === 'saved' && <span className="text-sm text-green-500">Сохранено</span>}
            {!isEditing && saveStatus === 'error' && <span className="text-sm text-red-500">Ошибка сохранения</span>}
          </div>
          
          <div className="max-w-md">
            <select
              value={displayStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white text-gray-900 font-medium cursor-pointer appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111827%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '2.5rem' }}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
              <span className="flex-shrink-0">{statuses.find(s => s.id === displayStatus)?.icon}</span>
              <span>{statuses.find(s => s.id === displayStatus)?.desc}</span>
            </div>
          </div>
        </div>
      )}

      {/* Специфика статусов */}
      {displayStatus === 'needs_help' && (
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <PlusCircleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-900">Сбор средств временно недоступен</h3>
              <p className="text-orange-700 text-sm mt-1">
                Этот статус пока не работает и будет реализован в следующих обновлениях платформы.
              </p>
            </div>
          </div>
        </div>
      )}

      {displayStatus === 'lost' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Информация о пропаже</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время пропажи</label>
              <input
                type="text"
                value={displayData.lost_date || ''}
                onChange={(e) => updateLocalData('lost_date', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: 15 января 2024, около 18:00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Место пропажи</label>
              <input
                type="text"
                value={displayData.lost_location || ''}
                onChange={(e) => updateLocalData('lost_location', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: ул. Ленина, д. 15 (у магазина)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вознаграждение (₽)</label>
              <input
                type="number"
                value={displayData.reward_amount || ''}
                onChange={(e) => updateLocalData('reward_amount', Number(e.target.value))}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ошейник / адресник</label>
              <input
                type="text"
                value={displayData.collar_details || ''}
                onChange={(e) => updateLocalData('collar_details', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: Да, красный с жетоном"
              />
            </div>
          </div>
        </div>
      )}

      {displayStatus === 'found' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Информация о находке</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время находки</label>
              <input
                type="text"
                value={displayData.found_date || ''}
                onChange={(e) => updateLocalData('found_date', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: 15 января 2024, около 14:30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Место находки</label>
              <input
                type="text"
                value={displayData.found_location || ''}
                onChange={(e) => updateLocalData('found_location', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: ул. Сокольническая, д. 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Состояние животного</label>
              <input
                type="text"
                value={displayData.found_condition || ''}
                onChange={(e) => updateLocalData('found_condition', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: Спокойный, не агрессивный, напуган"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Внешние приметы (ошейник)</label>
              <input
                type="text"
                value={displayData.found_collar || ''}
                onChange={(e) => updateLocalData('found_collar', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: Красный потертый ошейник"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Где сейчас находится</label>
              <input
                type="text"
                value={displayData.found_current_place || ''}
                onChange={(e) => updateLocalData('found_current_place', e.target.value)}
                onBlur={handleDataBlur}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white focus:bg-white"
                placeholder="Например: Временный приют у нашедшего"
              />
            </div>
          </div>
        </div>
      )}

      {/* Описание */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 relative">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Публичное описание</h3>
          {saveStatus === 'saving' && <span className="text-sm text-blue-500 animate-pulse">Сохранение...</span>}
          {saveStatus === 'saved' && <span className="text-sm text-green-500">Сохранено</span>}
          {saveStatus === 'error' && <span className="text-sm text-red-500">Ошибка сохранения</span>}
        </div>
        <div>
          <textarea
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Дополнительная информация о питомце: особенности характера, привычки, подробности и история..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50 hover:bg-white focus:bg-white"
          />
          {!isEditing && (
            <p className="text-xs text-gray-400 mt-2">Редактируется автосохранением: просто введите текст и кликните вне поля.</p>
          )}
        </div>
      </div>
    </div>
  );
}
