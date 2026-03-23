'use client';

import { Pet } from '../../../../../../lib/api';
import { CurrencyDollarIcon, UserGroupIcon, ClockIcon, MapPinIcon, IdentificationIcon, MagnifyingGlassCircleIcon, ShieldCheckIcon, DocumentTextIcon, BugAntIcon, BoltIcon, FireIcon } from '@heroicons/react/24/outline';

interface StatusSpecificCardProps {
  pet: Pet;
}

export default function StatusSpecificCard({ pet }: StatusSpecificCardProps) {
  if (pet.status === 'looking_for_home' || !pet.status || pet.status === 'default') {
    return null; // Нет специфичного блока для "Ищет дом" или дефолтных
  }

  // 1. Сбор средств
  if (pet.status === 'needs_help') {
    const data = pet.catalog_data || {};
    const goal = data.fundraising_goal || 45000;
    const current = 28500; // Пока оставляем заглушку для собранного
    const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
    const left = goal - current > 0 ? goal - current : 0;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 m-0">Прогресс сбора</h3>
        </div>

        <div className="text-center mb-4">
          <div className="text-3xl font-black text-purple-600 mb-1">{current.toLocaleString('ru-RU')} ₽</div>
          <div className="text-sm text-gray-500">из {goal.toLocaleString('ru-RU')} ₽</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>

        <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900">{percentage}% собрано</span>
          <span className="text-gray-500">Осталось {left.toLocaleString('ru-RU')} ₽</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <UserGroupIcon className="w-4 h-4" />
            47 доноров
          </div>
          <div className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-4 h-4" />
            Расходы: 3 830 ₽
          </div>
        </div>
      </div>
    );
  }

  // 2. Потерян
  if (pet.status === 'lost') {
    const data = pet.catalog_data || {};
    
    return (
      <>
        {/* Детали пропажи */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Детали пропажи</h3>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-1">
                <ClockIcon className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Последний раз видели</div>
                <div className="font-semibold text-gray-900">{data.lost_date || 'Не указано'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPinIcon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Место пропажи</div>
                <div className="font-semibold text-gray-900">{data.lost_location || 'Не указано'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                <IdentificationIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 pb-1">
                <div className="text-xs text-gray-500 mb-0.5">Ошейник</div>
                <div className="font-semibold text-gray-900">{data.collar_details || 'Нет информации'}</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Вознаграждение */}
        {data.reward_amount && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Вознаграждение</h3>
            <div className="text-3xl font-black text-[#00c853] mb-1">{Number(data.reward_amount).toLocaleString('ru-RU')} ₽</div>
            <div className="text-sm text-gray-500">Вознаграждение за возврат</div>
          </div>
        )}
      </>
    );
  }

  // 3. Найден
  if (pet.status === 'found') {
    const data = pet.catalog_data || {};
    
    return (
      <>
        {/* Детали находки */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Детали находки</h3>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-1">
                <ClockIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Дата и время находки</div>
                <div className="font-semibold text-gray-900">{data.found_date || 'Не указано'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPinIcon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Место находки</div>
                <div className="font-semibold text-gray-900">{data.found_location || 'Не указано'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-1">
                <ShieldCheckIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Состояние</div>
                <div className="font-semibold text-gray-900">{data.found_condition || 'Не указано'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-1">
                <IdentificationIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Внешние приметы (ошейник)</div>
                <div className="font-semibold text-gray-900">{data.found_collar || 'Нет информации'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-1">
                <FireIcon className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1 border-b border-gray-100 pb-3">
                <div className="text-xs text-gray-500 mb-0.5">Особые приметы</div>
                <div className="font-semibold text-gray-900">{data.special_marks || 'Нет информации'}</div>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPinIcon className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex-1 pb-1">
                <div className="text-xs text-gray-500 mb-0.5">Текущее местоположение</div>
                <div className="font-semibold text-gray-900">{data.found_current_place || 'Не указано'}</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Поиск хозяев */}
        <div className="bg-[#f8faff] rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 mb-2.5">
          <div className="flex items-center gap-2 mb-4">
            <MagnifyingGlassCircleIcon className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900 m-0">Поиск хозяев</h3>
          </div>
          
          <div className="bg-blue-50 text-blue-800 text-center py-3 rounded-lg font-semibold mb-6">
            <span className="text-xl">3 дня</span> <span className="text-sm font-normal">идет поиск</span>
          </div>

          <div className="text-sm font-bold text-gray-900 mb-4">Попытки поиска</div>
          
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
            {/* Timeline item 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-100 text-orange-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <DocumentTextIcon className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="font-semibold text-gray-900 text-sm">Проверка на чип/бирку</div>
                <div className="text-xs text-gray-500">Чип не найден</div>
              </div>
            </div>

            {/* Timeline item 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-pink-100 text-pink-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="font-semibold text-gray-900 text-sm">Обращение в ветклиники</div>
                <div className="text-xs text-gray-500">Без результата</div>
              </div>
            </div>

            {/* Timeline item 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-pink-100 text-pink-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="font-semibold text-gray-900 text-sm">Проверка в приютах</div>
                <div className="text-xs text-gray-500">Без результата</div>
              </div>
            </div>

            {/* Timeline item 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-yellow-100 text-yellow-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="font-semibold text-gray-900 text-sm">Поиск в соцсетях</div>
                <div className="text-xs text-gray-500">В процессе</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
}
