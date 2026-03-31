'use client';

import React, { useEffect } from 'react';
import { useBreadcrumb } from '../../../../../components/BreadcrumbContext';

export default function SettingsPage() {
  const { setItems } = useBreadcrumb();
  
  useEffect(() => {
    setItems([
      { label: 'Настройки' }
    ]);
  }, [setItems]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Системные настройки</h1>
        
        <div className="space-y-8 max-w-2xl">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-gray-900">Уведомления на email</h2>
            <p className="text-sm text-gray-500 mb-4">Настройте получение системных уведомлений о заявках, сообщениях и новых питомцах.</p>
            
            <label className="flex items-center gap-3 cursor-pointer mt-1 w-max">
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Получать системные уведомления</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer mt-3 w-max">
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Рассылка новостей и обновлений</span>
            </label>
          </div>
          
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-base font-bold text-red-600 mb-2">Опасная зона</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="text-sm font-bold text-red-800 mb-1">Удаление платформы</h3>
              <p className="text-sm text-red-600 mb-5 max-w-lg">
                Безвозвратное удаление профиля организации и всех прикрепленных к нему данных (животных, сотрудников, отчетов). Это действие невозможно отменить.
              </p>
              <button className="px-5 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-400 transition-colors shadow-sm">
                Удалить организацию
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
