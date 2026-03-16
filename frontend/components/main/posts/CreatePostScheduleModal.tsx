'use client';

import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface CreatePostScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export default function CreatePostScheduleModal({
  isOpen,
  onClose,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  currentMonth,
  setCurrentMonth,
}: CreatePostScheduleModalProps) {
  if (!isOpen) return null;

  const monthNames = [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
  ];

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelectedDate = (day: number, month: number, year: number) => {
    if (!scheduledDate) return false;
    return (
      day === scheduledDate.getDate() &&
      month === scheduledDate.getMonth() &&
      year === scheduledDate.getFullYear()
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" strokeWidth={2} />
          </button>
          <h3 className="font-bold text-[16px]">Запланировать публикацию</h3>
          <div className="w-8"></div>
        </div>

        <div className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[18px] font-bold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()} г.
            </h4>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[13px] text-gray-400 font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
              const days = [];

              // Empty cells before first day
              for (let i = 0; i < startingDayOfWeek; i++) {
                days.push(<div key={`empty-${i}`} className="aspect-square" />);
              }

              // Days of month
              for (let day = 1; day <= daysInMonth; day++) {
                const today = isToday(day, month, year);
                const selected = isSelectedDate(day, month, year);

                days.push(
                  <button
                    key={day}
                    onClick={() => setScheduledDate(new Date(year, month, day))}
                    className={`aspect-square rounded-full flex items-center justify-center text-[15px] transition-colors
                      ${
                        selected
                          ? 'bg-black text-white font-bold'
                          : today
                            ? 'bg-gray-200 font-semibold'
                            : 'hover:bg-gray-100'
                      }`}
                  >
                    {day}
                  </button>,
                );
              }

              return days;
            })()}
          </div>

          {/* Time Picker */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1 px-4 py-2 text-[15px] bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (scheduledDate) {
                onClose();
              }
            }}
            disabled={!scheduledDate}
            className="w-full mt-6 py-3 bg-black text-white rounded-full text-[15px] font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
