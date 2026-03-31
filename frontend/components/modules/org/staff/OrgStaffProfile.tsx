'use client';

import React, { useEffect, useState } from 'react';
import { useBreadcrumb } from '@/components/BreadcrumbContext';
import Link from 'next/link';
import { 
  CameraIcon, 
  ArrowLeftIcon, 
  ShieldCheckIcon, 
  TrashIcon, 
  NoSymbolIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useMediaUpload } from '@/app/main/hooks/useMediaUpload';
import { useRouter } from 'next/navigation';

// Иконка лапки
function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-2.91-8-6.5 0-1.953 1.03-3.706 2.68-4.919M12 21c4.418 0 8-2.91 8-6.5 0-1.953-1.03-3.706-2.68-4.919M12 21V10M7 6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM5 10a1.5 1.5 0 1 1 3 0A1.5 1.5 0 0 1 5 10Zm11 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>
  );
}

export default function OrgStaffProfile({ orgId, staffId }: { orgId: string, staffId: string }) {
  const { setItems } = useBreadcrumb();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'pets' | 'activity'>('settings');
  
  const router = useRouter();
  const { uploadFile, progress } = useMediaUpload();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/org/${orgId}/staff/${staffId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
        } else {
          setError(data.error || 'Ошибка загрузки профиля');
        }
      } catch (e) {
        setError('ОШибка сети');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [orgId, staffId]);

  useEffect(() => {
    if (profile) {
      setItems([
        { label: 'Сотрудники', href: `/org/${orgId}/staff` },
        { label: `Карточка: ${profile.name || 'Загрузка...'}` }
      ]);
    }
  }, [setItems, orgId, profile]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Показываем реальный выбранный файл временно через ObjectURL
      const localUrl = URL.createObjectURL(file);
      setProfile((prev: any) => ({ ...prev, orgAvatarUrl: localUrl }));
      setSelectedFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    
    try {
      let finalAvatarUrl = profile.orgAvatarUrl;
      
      // Если было выбрано новое фото, загружаем его сначала
      if (selectedFile) {
        try {
          const uploaded = await uploadFile(selectedFile, 'photo');
          if (uploaded && uploaded.url) {
            finalAvatarUrl = uploaded.url;
            setProfile((prev: any) => ({ ...prev, orgAvatarUrl: finalAvatarUrl }));
            setSelectedFile(null); // сброс после успешной загрузки
          }
        } catch (uploadError) {
          console.error("Ошибка загрузки фото", uploadError);
          setIsSaving(false);
          return;
        }
      }
      
      const res = await fetch(`/api/org/${orgId}/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: profile.jobTitle,
          orgAvatarUrl: finalAvatarUrl,
          permissions: profile.permissions || { pets: true, medical: true, finance: false }
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Ошибка сохранения');
      }
    } catch (e) {
      alert('Ошибка при сохранении данных');
    }
    
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите исключить сотрудника из штата?')) return;
    
    try {
      const res = await fetch(`/api/org/${orgId}/staff/${staffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/org/${orgId}/staff`);
      } else {
        alert(data.error || 'Ошибка при удалении');
      }
    } catch (e) {
      alert('Ошибка при удалении сотрудника');
    }
  };

  const TABS = [
    { id: 'settings', label: 'Доступы и роль', icon: <Cog6ToothIcon className="w-5 h-5" /> },
    { id: 'pets', label: 'Курируемые питомцы (3)', icon: <PawIcon className="w-5 h-5" /> },
    { id: 'activity', label: 'История действий', icon: <ClockIcon className="w-5 h-5" /> },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Загрузка профиля...</div>;
  if (error || !profile) return <div className="p-8 text-center text-red-500">{error || 'Профиль не найден'}</div>;

  return (
    <div className="px-4 pb-8 w-full max-w-full space-y-4">
      
      {/* Кнопка назад */}
      <div className="flex items-center sticky top-2 z-10 bg-gray-50/80 backdrop-blur py-2 -mx-4 px-4">
        <Link 
          href={`/org/${orgId}/staff`}
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          К списку команды
        </Link>
      </div>

      {/* 3-Колоночный Грид */}
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr_280px] gap-4 items-start pt-2">
        
        {/* Левая колонка (Аватар, Статус, Меню и Инфа) */}
        <div className="flex flex-col gap-3 sticky top-16 w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Обложка и паспортная зона */}
            <div className="h-28 bg-gradient-to-br from-indigo-100 via-violet-50 to-emerald-50 relative flex items-center justify-center border-b border-gray-100">
              <div className="absolute -bottom-10 shadow-md w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center overflow-hidden group">
                {profile.orgAvatarUrl ? (
                  <img src={profile.orgAvatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : profile.avatar && profile.avatar.length > 2 && profile.avatar.startsWith('http') ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover grayscale opacity-80" />
                ) : (
                  <span className="text-3xl font-bold text-gray-400 bg-gray-100 w-full h-full flex items-center justify-center">
                    {profile.avatar || profile.name?.[0]?.toUpperCase()}
                  </span>
                )}
                <div 
                  onClick={handleUploadAvatarClick}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  <CameraIcon className="w-6 h-6 text-white mb-1" />
                  <span className="text-[9px] text-white uppercase font-bold tracking-wider">Изменить</span>
                </div>
                {/* Скрытый инпут для выбора фото */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
            
            <div className="px-5 pt-14 pb-5 text-center border-b border-gray-100 relative">
               {profile.orgAvatarUrl && (
                  <div className="absolute top-2 right-2" title="Установлено корпоративное фото">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </div>
               )}
               <h1 className="font-bold text-lg text-gray-900 leading-tight">{profile.name}</h1>
               <span className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1.5 font-bold border border-green-100/50">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm animate-pulse"></span> 
                 В ШТАТЕ
               </span>
            </div>
            
            {/* Системные данные */}
            <div className="p-4 bg-gray-50 flex flex-col gap-3 text-sm">
               <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Личный Email</div>
                  <div className="font-medium text-gray-800 break-all">{profile.email}</div>
               </div>
               <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Оригинальное имя пользователя</div>
                  <div className="font-medium text-gray-600">{profile.name}</div>
               </div>
            </div>

          </div>

          {/* Меню навигации в отдельном блоке, как в карточке питомца */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-violet-50' 
                    : 'bg-transparent hover:bg-gray-50'
                } ${i < TABS.length - 1 ? 'border-b border-gray-100' : 'border-none'}`}
                style={{
                  borderLeft: activeTab === tab.id ? '3px solid #7c3aed' : '3px solid transparent'
                }}
              >
                <span className={`text-[16px] flex-shrink-0 ${activeTab === tab.id ? 'text-violet-600' : 'text-gray-500'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[13px] ${activeTab === tab.id ? 'font-semibold text-violet-700' : 'text-gray-700'}`}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Центральная колонка (Контент зависит от Таба) */}
        <div className="min-w-0 w-full flex flex-col gap-4">
          
          {activeTab === 'settings' && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Редактирование профиля</h2>
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Внутренняя должность (Публичная)</label>
                  <p className="text-xs text-gray-500 mb-2">Эта роль будет отображаться клиентам на вашей странице и в карточках питомцев.</p>
                  <input
                    type="text"
                    value={profile.jobTitle}
                    onChange={e => setProfile({...profile, jobTitle: e.target.value})}
                    className="block w-full max-w-lg rounded-lg border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm font-medium transition-all"
                    placeholder="Например: Главный врач, Волонтер..."
                  />
                </div>
              </div>

              {profile.role !== 'owner' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
                  <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-violet-500" />
                    Права доступа к модулям
                  </h2>
                  
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start group cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          checked={profile.permissions?.pets ?? true}
                          onChange={e => setProfile({...profile, permissions: {...profile.permissions, pets: e.target.checked}})}
                          className="h-5 w-5 rounded border-gray-300 text-violet-600 focus:ring-violet-600 cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <span className="font-bold text-gray-900">Управление питомцами и Заявками</span>
                        <p className="text-gray-500 text-xs mt-0.5">Позволяет добавлять, редактировать учетные карточки животных, менять их статусы (Ищет дом) и обрабатывать заявки.</p>
                      </div>
                    </label>

                    <label className="flex items-start group cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          checked={profile.permissions?.medical ?? true}
                          onChange={e => setProfile({...profile, permissions: {...profile.permissions, medical: e.target.checked}})}
                          className="h-5 w-5 rounded border-gray-300 text-violet-600 focus:ring-violet-600 cursor-pointer"
                        />
                      </div>
                      <div className="ml-3 text-sm leading-6">
                        <span className="font-bold text-gray-900">Электронная Медицинская Карта (ЭМК)</span>
                        <p className="text-gray-500 text-xs mt-0.5">Доступ к системе вакцинаций, чипированию и закрытой истории болезней питомцев.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'pets' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <PawIcon className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Курируемые питомцы</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">Этот сотрудник прикреплен к 3 питомцам в вашей организации в качестве лечащего врача или куратора (Демо).</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <ClockIcon className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Журнал активности</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">Здесь будет отображаться вся активность сотрудника: изменения медкарт, новые статусы и ответы на заявки.</p>
            </div>
          )}

        </div>

        {/* Правая колонка: Управление и Опасная зона (Всегда видна) */}
        <div className="flex flex-col gap-4 sticky top-16 w-full">
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Управление</h3>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full px-4 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-md rounded-lg transition-all disabled:opacity-75 disabled:shadow-none flex items-center justify-center"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить профиль'}
            </button>
            <p className="text-[11px] text-gray-400 mt-3 text-center">Изменения моментально применятся к рабочему столу сотрудника.</p>
          </div>

          <div className="bg-red-50/40 rounded-lg shadow-sm border border-red-100 p-4">
            <h3 className="text-[12px] font-bold text-red-900/60 uppercase tracking-wider mb-4 border-b border-red-100/50 pb-2 flex items-center gap-1.5">
              Опасная зона
            </h3>
            
            {profile.role !== 'owner' ? (
              <div className="space-y-3">
                <button className="w-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <NoSymbolIcon className="w-4 h-4" />
                  Приостановить доступ
                </button>
                <button onClick={handleDelete} className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-200/50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <TrashIcon className="w-4 h-4" />
                  Исключить из штата
                </button>
                <div className="text-[11px] text-red-600 leading-tight bg-red-50/50 p-2 rounded text-center border border-red-100">
                  Удаление закроет сотруднику вход. Связанные с ним питомцы останутся в базе вашей организации.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 leading-relaxed text-center mt-2 px-2">
                Владельца организации нельзя исключить. Для передачи прав или удаления обратитесь в службу заботы.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
