'use client';

import React, { useState } from 'react';
import { XMarkIcon, EnvelopeIcon, CheckCircleIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface AddStaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onSuccess?: (newStaff: any) => void;
}

export default function AddStaffDrawer({ isOpen, onClose, orgId, onSuccess }: AddStaffDrawerProps) {
  const [mode, setMode] = useState<'search' | 'invite'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Поиск пользователей через API
  React.useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/org/${orgId}/users/search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    // Дебаунс 500мс
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, orgId]);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    
    let targetEmail = email;
    if (mode === 'search' && selectedUserId) {
      const u = searchResults.find(u => u.id === selectedUserId);
      if (u) targetEmail = u.email;
    }
    
    try {
      const res = await fetch(`/api/org/${orgId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: targetEmail,
          jobTitle: jobTitle.trim() || 'Специалист'
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        setErrorMsg(data.error || 'Ошибка при добавлении сотрудника');
        setIsSubmitting(false);
        return;
      }
      
      setIsSubmitting(false);
      setIsSuccess(true);
      
      if (onSuccess) onSuccess(null);
      
      // Закрыть после паузы
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setIsSuccess(false);
          setEmail('');
          setSearchQuery('');
          setSelectedUserId(null);
          setJobTitle('');
          setMode('search');
          setErrorMsg('');
        }, 500);
      }, 1500);
      
    } catch (e) {
      setErrorMsg('Ошибка соединения с сервером');
      setIsSubmitting(false);
    }
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isFormValid = (mode === 'search' ? selectedUserId !== null : email.length > 3) && jobTitle.trim().length > 0;

  return (
    <>
      {/* Подложка */}
      <div 
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={handlePanelClick}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Добавить сотрудника</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircleIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{mode === 'search' ? 'Сотрудник добавлен!' : 'Приглашение отправлено!'}</h3>
              <p className="text-gray-500">
                {mode === 'search' 
                  ? 'Пользователь успешно привязан к вашей организации и получил уведомление.' 
                  : 'Сотрудник получит письмо со ссылкой для подтверждения.'}
              </p>
            </div>
          ) : (
            <form id="invite-staff-form" onSubmit={handleSubmit} className="p-6 space-y-8">
              
              {/* Переключатель режимов */}
              <div className="bg-gray-100 p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'search' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Найти в системе
                </button>
                <button
                  type="button"
                  onClick={() => setMode('invite')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'invite' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Инвайт по Email
                </button>
              </div>

              {/* Тело формы в зависимости от режима */}
              <div className="min-h-[160px]">
                {mode === 'search' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm transition-all"
                        placeholder="Введите имя, Email или PetID"
                      />
                    </div>

                    {/* Результаты поиска */}
                    {searchQuery.length >= 1 ? (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Найденные пользователи</div>
                        {isSearching ? (
                          <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center gap-2">
                             <svg className="animate-spin h-4 w-4 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Поиск...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map(user => (
                            <div 
                              key={user.id}
                              onClick={() => setSelectedUserId(user.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedUserId === user.id ? 'border-violet-600 bg-violet-50/50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300'}`}
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden relative">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                  user.name?.[0]?.toUpperCase() || '👤'
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900">{user.name || `User #${user.id}`}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                              {selectedUserId === user.id && (
                                <div className="ml-auto text-violet-600">
                                  <CheckCircleIcon className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                            Пользователь не найден
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <UserCircleIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Начните вводить данные для поиска пользователя в базе ЗооПлатформы</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900">Email для приглашения</label>
                    <p className="text-sm text-gray-500 mb-3">Если пользователя еще нет в системе, мы отправим ему письмо со ссылкой на регистрацию.</p>
                    <div className="relative mt-2">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-all"
                        placeholder="ivan@example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ошибки */}
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* Указание должности */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Должность в организации</h3>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Обязательно</span>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                    className="block w-full rounded-lg border-0 py-3 pl-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 transition-all"
                    placeholder="Например: Врач-терапевт, Волонтер, Администратор..."
                  />
                  <p className="text-xs text-gray-500">Эта должность будет отображаться в карточке сотрудника внутри системы.</p>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Футер */}
        {!isSuccess && (
          <div className="border-t border-gray-100 p-6 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="invite-staff-form"
              disabled={isSubmitting || !isFormValid}
              className={`px-4 py-2.5 text-sm font-semibold text-white rounded-lg flex items-center justify-center transition-all min-w-[140px] ${
                isSubmitting || !isFormValid ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow-md'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Отправка...
                </>
              ) : (mode === 'search' ? 'Добавить в команду' : 'Отправить инвайт')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
