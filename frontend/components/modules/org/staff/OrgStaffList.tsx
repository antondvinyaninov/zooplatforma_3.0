'use client';

import React, { useEffect, useState } from 'react';
import { useBreadcrumb } from '@/components/BreadcrumbContext';
import AddStaffDrawer from './AddStaffDrawer';
import Link from 'next/link';

export default function OrgStaffList({ orgId }: { orgId: string }) {
  const { setItems } = useBreadcrumb();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    try {
      const res = await fetch(`/api/org/${orgId}/staff`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setStaffList(data.data);
      } else {
        setError(data.error || 'Ошибка загрузки сотрудников');
      }
    } catch (e) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [orgId]);
  
  useEffect(() => {
    setItems([
      { label: 'Сотрудники' }
    ]);
  }, [setItems]);

  const handleStaffAdded = () => {
    loadStaff();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 relative overflow-hidden">
        
        {/* Декоративный фон для премиальности */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-violet-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 relative z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Управление командой</h1>
            <p className="text-sm text-gray-500 mt-1">Оцифруйте команду и распределите доступы к модулям</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 hover:shadow-md px-5 py-2.5 rounded-lg transition-all flex items-center"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Пригласить сотрудника
          </button>
        </div>
        
        {/* Информационный блок */}
        <div className="bg-blue-50/70 rounded-lg p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 border border-blue-100/50">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Детальные профили специалистов</h3>
            <p className="text-sm text-gray-600 max-w-2xl">
              Нажмите на карточку любого сотрудника, чтобы перейти в его профиль. Там вы сможете загрузить корпоративное фото, настроить права доступа и изменить должность.
            </p>
          </div>
        </div>
        
        {/* Динамический список сотрудников */}
        <div className="border border-gray-100 rounded-lg overflow-hidden mt-6">
           <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
             <div className="text-sm font-bold text-gray-700 uppercase tracking-wide">
               Активные сотрудники {loading ? '...' : `(${staffList.length})`}
             </div>
           </div>
           
           {loading ? (
             <div className="p-12 text-center text-gray-400">Загрузка команды...</div>
           ) : error ? (
             <div className="p-8 text-center text-red-500">{error}</div>
           ) : staffList.length === 0 ? (
             <div className="p-12 text-center text-gray-500">Сотрудников пока нет. Пригласите первого специалиста!</div>
           ) : (
             <div className="divide-y divide-gray-100">
               {staffList.map((staff) => (
                 <Link 
                   href={`/org/${orgId}/staff/${staff.id}`}
                   key={staff.id} 
                   className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors block cursor-pointer group"
                 >
                   <div className="flex items-center gap-4">
                     
                     {/* Аватар (Загрузка перенесена в профиль) */}
                     <div className="relative shrink-0">
                       <div className={`overflow-hidden w-12 h-12 rounded-full font-bold flex items-center justify-center text-lg shadow-inner ${staff.isOwner ? 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700' : 'bg-gray-100 text-gray-600 border border-gray-200'} group-hover:ring-2 group-hover:ring-violet-200 transition-all`}>
                         {staff.orgAvatarUrl ? (
                           <img src={staff.orgAvatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                         ) : staff.avatar && staff.avatar.length > 2 && staff.avatar.startsWith('http') ? (
                           <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover grayscale opacity-80" />
                         ) : (
                           staff.avatar || staff.name?.[0]?.toUpperCase() || 'S'
                         )}
                       </div>
                     </div>
                     
                     <div>
                       <div className="text-base font-bold text-gray-900 flex items-center gap-2 group-hover:text-violet-700 transition-colors">
                          {staff.name || 'Сотрудник'}
                          {staff.isOwner && (
                            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                       </div>
                       <div className="text-sm text-gray-500 mt-0.5">{staff.email}</div>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${staff.isOwner ? 'bg-violet-100 text-violet-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {staff.jobTitle || 'Специалист'}
                        </span>
                        {!staff.isOwner && (
                          <span className="text-xs font-medium text-gray-400">В штате</span>
                        )}
                        {staff.isOwner && (
                           <span className="text-xs font-medium text-gray-400">Полный доступ</span>
                        )}
                     </div>
                     <div className="text-gray-300 group-hover:text-violet-500 transition-colors hidden sm:block">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                       </svg>
                     </div>
                   </div>
                 </Link>
               ))}
             </div>
           )}
        </div>
      </div>

      <AddStaffDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        orgId={orgId} 
        onSuccess={handleStaffAdded}
      />
    </div>
  );
}
