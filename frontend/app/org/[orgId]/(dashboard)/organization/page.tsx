'use client';

import React, { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { BuildingOfficeIcon, PhotoIcon, CheckBadgeIcon, MapPinIcon, GlobeAltIcon, EnvelopeIcon, PhoneIcon, DevicePhoneMobileIcon, AtSymbolIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { organizationsApi, Organization, getOrganizationTypeName } from '../../../../../lib/organizations-api';
import YandexMap from '../../../../../components/main/shared/YandexMap';
import CityAutocomplete from '../../../../../components/main/shared/CityAutocomplete';
import LocationPicker from '../../../../../components/main/shared/LocationPicker';
import { getMediaUrl } from '../../../../../lib/utils';
import ImageCropperModal from '../../../../../components/main/shared/ImageCropperModal';
type Tab = 'general' | 'contacts' | 'media' | 'legal';
const TABS: {
  id: Tab;
  icon: string;
  label: string;
}[] = [{
  id: 'general',
  icon: '📋',
  label: 'Основная информация'
}, {
  id: 'contacts',
  icon: '📍',
  label: 'Контакты и Адрес'
}, {
  id: 'media',
  icon: '📸',
  label: 'Оформление'
}, {
  id: 'legal',
  icon: '🏢',
  label: 'Юридические данные'
}];
export default function OrganizationDashboardPage({
  params
}: {
  params: Promise<{
    orgId: string;
  }>;
}) {
  const {
    orgId
  } = use(params);
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isMobile, setIsMobile] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const handleLocationSelect = async (loc: {
    lat: number;
    lon: number;
    name: string;
  }) => {
    if (savingField) return;
    setSavingField('address_full');
    try {
      const payload = {
        address_full: loc.name,
        geo_lat: loc.lat,
        geo_lon: loc.lon
      };
      const res = await organizationsApi.update(Number(orgId), payload);
      if (res && (!res.error || res.success !== false)) {
        setOrg(prev => prev ? {
          ...prev,
          ...payload
        } : null);
        setShowLocationPicker(false);
      } else {
        alert('Ошибка при сохранении координат: ' + (res?.error || ''));
      }
    } catch (e) {
      alert('Ошибка соединения при сохранении карты');
    } finally {
      setSavingField(null);
    }
  };
  const handleCitySelect = async (city: string) => {
    if (savingField) return;
    setSavingField('address_city');
    try {
      const payload = {
        address_city: city
      };
      const res = await organizationsApi.update(Number(orgId), payload);
      if (res && (!res.error || res.success !== false)) {
        setOrg(prev => prev ? {
          ...prev,
          ...payload
        } : null);
        setEditingField(null);
      } else {
        alert('Ошибка при сохранении города: ' + (res?.error || ''));
      }
    } catch (e) {
      alert('Ошибка соединения при сохранении');
    } finally {
      setSavingField(null);
    }
  };
  useEffect(() => {
    loadOrganization();

    // Мобильный детект для горизонтальных табов
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [orgId]);
  const loadOrganization = async () => {
    try {
      setLoading(true);
      const res = await organizationsApi.getById(Number(orgId));
      if (res.success && res.data) {
        setOrg(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const startEdit = (field: string, val: string) => {
    setEditingField(field);
    setEditValue(val || '');
  };
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };
  const saveEdit = async (field: string) => {
    if (savingField) return;
    setSavingField(field);
    try {
      const payload: Record<string, any> = {
        [field]: editValue
      };
      const res = await organizationsApi.update(Number(orgId), payload);
      if (res && (!res.error || res.success !== false)) {
        setOrg(prev => prev ? {
          ...prev,
          ...payload
        } : null);
        setEditingField(null);
      } else {
        alert('Ошибка при сохранении: ' + (res?.error || ''));
      }
    } catch (e) {
      alert('Ошибка соединения при сохранении');
    } finally {
      setSavingField(null);
    }
  };
  const saveBooleanEdit = async (field: keyof Organization, val: boolean) => {
    if (savingField) return;
    setSavingField(field);
    try {
      const payload: Record<string, any> = {
        [field]: val ? 'yes' : 'no'
      };
      const res = await organizationsApi.update(Number(orgId), payload);
      if (res && (!res.error || res.success !== false)) {
        setOrg(prev => prev ? {
          ...prev,
          [field]: val ? 'yes' : 'no'
        } : null);
      }
    } catch (e) {
      alert('Ошибка соединения при сохранении');
    } finally {
      setSavingField(null);
    }
  };
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageSrc: string;
    type: 'logo' | 'cover';
    aspect: number;
    title: string;
  }>({
    isOpen: false,
    imageSrc: '',
    type: 'logo',
    aspect: 1,
    title: ''
  });
  const onFileSelect = (type: 'logo' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setCropperState({
      isOpen: true,
      imageSrc: fileUrl,
      type,
      aspect: type === 'cover' ? 4 / 1 : 1,
      title: type === 'cover' ? 'Обрезка обложки (1920x480)' : 'Обрезка логотипа (1:1)'
    });

    // Сбрасываем input
    if (e.target) e.target.value = '';
  };
  const handleCropComplete = async (croppedBlob: Blob) => {
    const {
      type
    } = cropperState;
    setCropperState(prev => ({
      ...prev,
      isOpen: false
    }));
    if (cropperState.imageSrc) {
      URL.revokeObjectURL(cropperState.imageSrc);
    }
    const file = new File([croppedBlob], `cropped-${type}-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    if (type === 'logo') setUploadingLogo(true);else setUploadingCover(true);
    try {
      let res;
      if (type === 'logo') {
        res = await organizationsApi.uploadLogo(Number(orgId), file);
      } else {
        res = await organizationsApi.uploadCover(Number(orgId), file);
      }
      if (res && res.success && res.data) {
        setOrg(prev => {
          if (!prev) return null;
          if (type === 'logo' && 'logo' in res.data) {
            return {
              ...prev,
              logo: res.data.logo
            };
          } else if (type === 'cover' && 'cover_photo' in res.data) {
            return {
              ...prev,
              cover_photo: res.data.cover_photo
            };
          }
          return prev;
        });
        await loadOrganization();
      } else {
        alert('Ошибка при загрузке: ' + (res?.error || ''));
      }
    } catch (err) {
      alert('Ошибка соединения при загрузке');
    } finally {
      if (type === 'logo') setUploadingLogo(false);else setUploadingCover(false);
    }
  };
  const renderEditableRow = ({
    label,
    field,
    value,
    displayValue,
    as = 'input',
    options = [],
    placeholder,
    required = false
  }: {
    label: string;
    field: keyof Organization;
    value: string;
    displayValue: React.ReactNode;
    as?: 'input' | 'select' | 'textarea' | 'readonly';
    options?: {
      label: string;
      value: string;
    }[];
    placeholder?: string;
    required?: boolean;
  }) => {
    const isEditing = editingField === field;
    const isSaving = savingField === field;
    return <div className="relative border-b border-gray-100 pb-3" onMouseLeave={() => {
      if (!isEditing && !isSaving) cancelEdit();
    }}>
        <div className="text-[12px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label} {required && <span className="text-red-500">*</span>}</div>
        
        {as === 'readonly' ? <div className="text-[14px] text-gray-900 min-h-[28px] flex items-center">{displayValue}</div> : isEditing ? <div className="flex items-start gap-2">
            {as === 'select' ? <select value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-violet-50" autoFocus>
                <option value="">Не указано</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select> : as === 'textarea' ? <textarea value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-y bg-violet-50" autoFocus placeholder={placeholder} onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit(field);
          if (e.key === 'Escape') cancelEdit();
        }} /> : <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-violet-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-violet-50" autoFocus placeholder={placeholder} onKeyDown={e => {
          if (e.key === 'Enter') saveEdit(field);
          if (e.key === 'Escape') cancelEdit();
        }} />}
            
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => saveEdit(field)} disabled={isSaving || required && !editValue.trim()} title="Сохранить (Enter)" className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm">
                {isSaving ? '⏳' : '✓'}
              </button>
              <button onClick={cancelEdit} disabled={isSaving} title="Отмена (Esc)" className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-colors">
                ✕
              </button>
            </div>
          </div> : <div className="flex items-center gap-3 min-h-[32px] group">
            <button onClick={() => startEdit(field, value)} title="Редактировать" className="w-8 h-8 rounded-lg bg-transparent border border-transparent text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <div className="text-[14px] text-gray-900 flex-1 whitespace-pre-wrap">{displayValue}</div>
          </div>}
      </div>;
  };
  const renderNavMenu = () => {
    if (isMobile) {
      return <div className="flex gap-2 overflow-x-auto pb-4 pt-2 hide-scrollbar">
          {TABS.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full border whitespace-nowrap transition-all text-sm shrink-0 ${activeTab === tab.id ? 'bg-violet-600 border-violet-600 text-white font-medium shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>)}
        </div>;
    }
    return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {TABS.map((tab, i) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-4 ${activeTab === tab.id ? 'bg-violet-50 border-violet-600' : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-300'} ${i < TABS.length - 1 ? 'border-b border-b-gray-100' : ''}`}>
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-sm ${activeTab === tab.id ? 'font-semibold text-violet-700' : 'text-gray-700'}`}>
              {tab.label}
            </span>
          </button>)}
      </div>;
  };
  if (loading || !org) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>;
  }
  const renderCenter = () => {
    switch (activeTab) {
      case 'general':
        return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Данные профиля</h2>
            
            {renderEditableRow({
            field: "name",
            label: "Название организации",
            value: org.name || '',
            displayValue: <div className="flex items-center gap-2">
                  <span className="font-medium text-base">{org.name || '—'}</span>
                  {org.is_verified && <CheckBadgeIcon className="w-5 h-5 text-violet-500" title="Профиль верифицирован" />}
                </div>,
            required: true
          })}
            
            {renderEditableRow({
            field: "short_name",
            label: "Краткое название",
            value: org.short_name || '',
            displayValue: org.short_name || '—'
          })}
            
            {renderEditableRow({
            field: "type",
            label: "Категория (Тип)",
            value: org.type || 'other',
            displayValue: getOrganizationTypeName(org.type),
            as: "select",
            options: [{
              value: 'shelter',
              label: 'Приют'
            }, {
              value: 'vet_clinic',
              label: 'Ветеринарная клиника'
            }, {
              value: 'pet_shop',
              label: 'Зоомагазин'
            }, {
              value: 'foundation',
              label: 'Благотворительный фонд'
            }, {
              value: 'kennel',
              label: 'Кинологический центр'
            }, {
              value: 'other',
              label: 'Другое'
            }]
          })}
            
            {renderEditableRow({
            field: "bio",
            label: "Короткий слоган (до 150 символов)",
            value: org.bio || '',
            displayValue: org.bio || '—',
            as: "textarea",
            placeholder: "Краткое сообщение в карточке каталога"
          })}
            
            {renderEditableRow({
            field: "description",
            label: "Подробное описание",
            value: org.description || '',
            displayValue: org.description || '—',
            as: "textarea",
            placeholder: "История создания, миссия, условия..."
          })}
          </div>;
      case 'contacts':
        return <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                  Связь с организацией и Мессенджеры
                </h2>
                {renderEditableRow({
                field: "phone",
                label: "Номер телефона",
                value: org.phone || '',
                displayValue: org.phone || '—',
                placeholder: "+7 (999) 000-00-00"
              })}
                {renderEditableRow({
                field: "email",
                label: "Адрес электронной почты",
                value: org.email || '',
                displayValue: org.email || '—',
                placeholder: "hello@example.com"
              })}
                {renderEditableRow({
                field: "website",
                label: "Сайт / Ресурсы",
                value: org.website || '',
                displayValue: org.website ? <a href={org.website} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.website}</a> : '—',
                placeholder: "https://..."
              })}
                
                {renderEditableRow({
                field: "telegram_link",
                label: "Telegram",
                value: org.telegram_link || '',
                displayValue: org.telegram_link ? <a href={org.telegram_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.telegram_link}</a> : '—',
                placeholder: "https://t.me/..."
              })}
                {renderEditableRow({
                field: "whatsapp_link",
                label: "WhatsApp",
                value: org.whatsapp_link || '',
                displayValue: org.whatsapp_link ? <a href={org.whatsapp_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.whatsapp_link}</a> : '—',
                placeholder: "https://wa.me/..."
              })}
                {renderEditableRow({
                field: "max_link",
                label: "Max",
                value: org.max_link || '',
                displayValue: org.max_link ? <a href={org.max_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.max_link}</a> : '—',
                placeholder: "https://..."
              })}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                  Социальные сети и каналы
                </h2>
                {renderEditableRow({
                field: "telegram_channel_link",
                label: "Telegram Канал",
                value: org.telegram_channel_link || '',
                displayValue: org.telegram_channel_link ? <a href={org.telegram_channel_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.telegram_channel_link}</a> : '—',
                placeholder: "https://t.me/..."
              })}
                {renderEditableRow({
                field: "max_channel_link",
                label: "Max Канал",
                value: org.max_channel_link || '',
                displayValue: org.max_channel_link ? <a href={org.max_channel_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.max_channel_link}</a> : '—',
                placeholder: "https://..."
              })}
                {renderEditableRow({
                field: "vk_link",
                label: "ВКонтакте",
                value: org.vk_link || '',
                displayValue: org.vk_link ? <a href={org.vk_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.vk_link}</a> : '—',
                placeholder: "https://vk.com/..."
              })}
                {renderEditableRow({
                field: "ok_link",
                label: "Одноклассники",
                value: org.ok_link || '',
                displayValue: org.ok_link ? <a href={org.ok_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.ok_link}</a> : '—',
                placeholder: "https://ok.ru/..."
              })}
                {renderEditableRow({
                field: "youtube_link",
                label: "YouTube",
                value: org.youtube_link || '',
                displayValue: org.youtube_link ? <a href={org.youtube_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.youtube_link}</a> : '—',
                placeholder: "https://youtube.com/..."
              })}
                {renderEditableRow({
                field: "rutube_link",
                label: "Rutube",
                value: org.rutube_link || '',
                displayValue: org.rutube_link ? <a href={org.rutube_link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{org.rutube_link}</a> : '—',
                placeholder: "https://rutube.ru/..."
              })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
              <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                Физический адрес
              </h2>
              
              {/* Поле Города с DaData */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 sm:py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group px-1 rounded-md -mx-1">
                <div className="w-full sm:w-1/3 mb-1 sm:mb-0 text-[13px] font-medium text-gray-500">
                  Город / Населенный пункт
                </div>
                <div className="w-full sm:w-2/3 flex items-center justify-between min-w-0 gap-3">
                  {editingField === 'address_city' ? <div className="flex-1 min-w-0 flex items-center gap-2">
                      <CityAutocomplete value={editValue} onChange={val => setEditValue(val)} placeholder="Начните вводить город..." className="w-full" />
                      <button onClick={() => handleCitySelect(editValue)} disabled={savingField === 'address_city'} className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50">
                        {savingField === 'address_city' ? '...' : 'Сохранить'}
                      </button>
                      <button onClick={() => cancelEdit()} className="flex-shrink-0 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                        Отмена
                      </button>
                    </div> : <>
                      <div className="text-sm text-gray-900 font-medium truncate">
                        {org.address_city || '—'}
                      </div>
                      <button onClick={() => startEdit('address_city', org.address_city || '')} className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-all focus:opacity-100 flex-shrink-0">
                        Изменить
                      </button>
                    </>}
                </div>
              </div>

              {/* Поле Точного Адреса и Карты */}
              <div className="flex flex-col sm:flex-row sm:items-start pt-4 sm:py-3 hover:bg-gray-50/50 transition-colors group px-1 rounded-md -mx-1">
                <div className="w-full sm:w-1/3 mb-1 sm:mb-0 text-[13px] font-medium text-gray-500 pt-1">
                  Точный адрес
                </div>
                <div className="w-full sm:w-2/3 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="text-sm text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
                      {org.address_full || 'Адрес не указан'}
                    </div>
                    <button onClick={() => setShowLocationPicker(true)} className="opacity-100 px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0 flex items-center gap-1 border border-blue-100 shadow-sm">
                      <MapPinIcon className="w-4 h-4" />
                      На карте
                    </button>
                  </div>

                  {(org.address_full || org.geo_lat && org.geo_lon) && <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm relative group/map">
                      <YandexMap address={org.address_full || org.address_city || ''} organizationName={org.name} latitude={org.geo_lat} longitude={org.geo_lon} height="200px" />
                      {/* Оверлей для смены адреса при клике на просмотровую карту */}
                      <div onClick={() => setShowLocationPicker(true)} className="absolute inset-0 bg-black/5 hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center opacity-0 group-hover/map:opacity-100">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-md font-medium text-sm text-gray-700 flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-blue-500" />
                          Изменить точку
                        </div>
                      </div>
                    </div>}
                </div>
              </div>

            </div>
          </div>;
      case 'legal':
        return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Юридическая информация</h2>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-sm text-amber-800 mb-6">
              Изменение юридических данных (ИНН, ОГРН) недоступно в целях безопасности. Обратитесь в техническую поддержку, если вам нужно изменить эти данные.
            </div>
            
            {renderEditableRow({
            field: "director_name",
            label: "ФИО руководителя",
            value: org.director_name || '',
            displayValue: org.director_name || '—',
            placeholder: "Иванов И. И."
          })}
            {renderEditableRow({
            field: "director_position",
            label: "Должность",
            value: org.director_position || '',
            displayValue: org.director_position || '—',
            placeholder: "Генеральный директор, Председатель"
          })}
            
            <div className="border-t border-gray-100 pt-5 mt-5"></div>
            
            {renderEditableRow({
            field: "legal_form",
            label: "Правовая форма",
            value: org.legal_form || '',
            displayValue: org.legal_form || '—',
            as: "readonly"
          })}
            {renderEditableRow({
            field: "inn",
            label: "ИНН",
            value: org.inn || '',
            displayValue: org.inn ? <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{org.inn}</span> : '—',
            as: "readonly"
          })}
            {renderEditableRow({
            field: "ogrn",
            label: "ОГРН/ОГРНИП",
            value: org.ogrn || '',
            displayValue: org.ogrn ? <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{org.ogrn}</span> : '—',
            as: "readonly"
          })}
            {renderEditableRow({
            field: "kpp",
            label: "КПП",
            value: org.kpp || '',
            displayValue: org.kpp ? <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{org.kpp}</span> : '—',
            as: "readonly"
          })}
          </div>;
      case 'media':
        return <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
            <div>
              <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Обложка профиля (Banner)</h2>
              <p className="text-sm text-gray-500 mb-4">Рекомендуемый размер 1920x480 пикселей. Формат JPG, PNG.</p>
              
              <div className="relative w-full aspect-[21/9] sm:aspect-[4/1] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:bg-gray-100 transition-colors">
                {org.cover_photo ? <>
                    <img src={getMediaUrl(org.cover_photo)} alt="Обложка" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="px-6 py-2 bg-white text-gray-900 rounded-lg text-sm font-semibold shadow-lg hover:bg-gray-100">
                        {uploadingCover ? 'Загрузка...' : 'Заменить обложку'}
                      </button>
                    </div>
                  </> : <>
                    <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50">
                      {uploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
                    </button>
                  </>}
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => onFileSelect('cover', e)} />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6"></div>

            <div>
              <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Логотип (Avatar)</h2>
              <p className="text-sm text-gray-500 mb-4">Рекомендуемый размер 512x512 пикселей. Идеально подходят квадратные изображения.</p>
              
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow bg-gray-100 flex items-center justify-center overflow-hidden relative group">
                  {org.logo ? <img src={getMediaUrl(org.logo)} alt="Логотип" className="w-full h-full object-cover" /> : <BuildingOfficeIcon className="w-12 h-12 text-gray-300" />}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    <PhotoIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div>
                  <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors">
                    {uploadingLogo ? 'Загрузка...' : 'Выбрать файл...'}
                  </button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => onFileSelect('logo', e)} />
                </div>
              </div>
            </div>
          </div>;
    }
  };
  return <div className="px-4 pb-8 w-full max-w-full relative">
      {/* 3-Колоночный Грид */}
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr_280px] gap-4 items-start">
        
        {/* Левая колонка (Avatar / Passport + Menu) */}
        <div className="flex flex-col gap-3 sticky top-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Паспортный заголовок */}
            <div className="h-28 bg-gradient-to-br from-indigo-100 via-violet-50 to-emerald-50 relative flex items-center justify-center">
              {org.cover_photo && <img src={getMediaUrl(org.cover_photo)} alt="Обложка" className="w-full h-full object-cover opacity-50 absolute inset-0 mix-blend-overlay" />}
              {isMobile ? null : <div className="absolute -bottom-10 shadow-md w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center overflow-hidden group">
                   {org.logo ? <img src={getMediaUrl(org.logo)} alt="Логотип" className="w-full h-full object-cover" /> : <BuildingOfficeIcon className="w-10 h-10 text-gray-300" />}
                   <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" onClick={() => setActiveTab('media')}>
                     <PhotoIcon className="w-6 h-6 text-white" />
                   </div>
                 </div>}
            </div>
            
            <div className={`px-5 ${isMobile ? 'py-4' : 'pt-14 pb-5'} text-center border-b border-gray-100`}>
              <h1 className="font-bold text-lg text-gray-900 leading-tight" title={org.name}>{org.short_name || org.name}</h1>
              <span className="text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-2 inline-block font-medium">
                {getOrganizationTypeName(org.type)}
              </span>
            </div>
            
            {!isMobile && <div className="p-2 bg-gray-50 border-b border-gray-100">
                <button onClick={() => setActiveTab('media')} className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors shadow-sm">
                  Изменить логотип
                </button>
              </div>}
            
            {/* Меню навигации */}
            {renderNavMenu()}
          </div>
        </div>

        {/* Центральная колонка (Контент табов) */}
        <div className="min-w-0">
          {renderCenter()}
        </div>

        {/* Правая колонка (Actions & Privacy) */}
        <div className="flex flex-col gap-3 sticky top-4">
          
          {/* Action Кнопки */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Управление профилем</h3>
            <div className="space-y-3">
              <button onClick={() => window.open(`/orgs/${orgId}`, '_blank')} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                <GlobeAltIcon className="w-5 h-5" />
                Публичная страница
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Публичный профиль доступен по постоянной ссылке для доноров и волонтеров. Вы можете делиться ею в соц. сетях.
            </p>
          </div>

          {/* Настройки Приватности */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Настройки приватности</h3>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={org.show_phone !== 'no'} onChange={e => saveBooleanEdit('show_phone', e.target.checked)} disabled={savingField === 'show_phone'} className="w-5 h-5 shrink-0 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500 transition-all cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><DevicePhoneMobileIcon className="w-4 h-4 text-gray-500" />Телефон</span>
                  <span className="text-xs text-gray-500 mt-0.5">Отображать номер телефона в карточке каталога</span>
                </div>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={org.show_email !== 'no'} onChange={e => saveBooleanEdit('show_email', e.target.checked)} disabled={savingField === 'show_email'} className="w-5 h-5 shrink-0 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500 transition-all cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><AtSymbolIcon className="w-4 h-4 text-gray-500" />Email Контакты</span>
                  <span className="text-xs text-gray-500 mt-0.5">Показывать адрес электронной почты</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={org.allow_messages !== 'no'} onChange={e => saveBooleanEdit('allow_messages', e.target.checked)} disabled={savingField === 'allow_messages'} className="w-5 h-5 shrink-0 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500 transition-all cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-gray-500" />Личные сообщения</span>
                  <span className="text-xs text-gray-500 mt-0.5">Пользователи могут писать вам в мессенджер платформы</span>
                </div>
              </label>
            </div>
          </div>
          
        </div>
      </div>
      {/* Location Picker Modal */}
      {showLocationPicker && <LocationPicker initialLocation={org.geo_lat && org.geo_lon ? {
      lat: org.geo_lat,
      lon: org.geo_lon,
      name: org.address_full || org.address_city || 'Организация'
    } : undefined} onLocationSelect={handleLocationSelect} onClose={() => setShowLocationPicker(false)} />}

      {/* Модалка кроппера */}
      <ImageCropperModal isOpen={cropperState.isOpen} onClose={() => setCropperState(prev => ({
      ...prev,
      isOpen: false
    }))} imageSrc={cropperState.imageSrc} aspect={cropperState.aspect} title={cropperState.title} onCropComplete={handleCropComplete} />
    </div>;
}