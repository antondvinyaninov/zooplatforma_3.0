'use client';

import { useState, useEffect } from 'react';
import {
  PetEvent,
  petEventsApi,
  eventTypeLabels,
  eventTypeIcons,
  eventTypeColors,
  deathReasonLabels,
  PetEventType,
} from '../../../lib/petid-api';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface PetEventsTimelineProps {
  petId: number;
}

export default function PetEventsTimeline({ petId }: PetEventsTimelineProps) {
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<PetEventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [petId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await petEventsApi.getEvents(petId);
      if (response.success && response.data) {
        setEvents(response.data);
        setServiceAvailable(true);
      } else {
        // Сервис недоступен
        setServiceAvailable(false);
        setEvents([]);
      }
    } catch (error) {
      // Тихо игнорируем - PetID сервис может быть недоступен
      setServiceAvailable(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents =
    selectedTypes.length > 0
      ? events.filter((event) => selectedTypes.includes(event.event_type))
      : events;

  const toggleFilter = (type: PetEventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderEventDetails = (event: PetEvent) => {
    switch (event.event_type) {
      case 'vaccination':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.vaccine_name && (
              <div>
                <span className="font-medium">Вакцина:</span> {event.vaccine_name}
              </div>
            )}
            {event.vaccine_batch && (
              <div>
                <span className="font-medium">Серия:</span> {event.vaccine_batch}
              </div>
            )}
            {event.next_date && (
              <div>
                <span className="font-medium">Следующая вакцинация:</span>{' '}
                {formatDate(event.next_date)}
              </div>
            )}
          </div>
        );

      case 'treatment':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.medication_name && (
              <div>
                <span className="font-medium">Препарат:</span> {event.medication_name}
              </div>
            )}
            {event.dosage && (
              <div>
                <span className="font-medium">Дозировка:</span> {event.dosage}
              </div>
            )}
          </div>
        );

      case 'ownership_change':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.previous_owner_name && (
              <div>
                <span className="font-medium">Предыдущий владелец:</span>{' '}
                {event.previous_owner_name}
              </div>
            )}
            {event.new_owner_name && (
              <div>
                <span className="font-medium">Новый владелец:</span> {event.new_owner_name}
              </div>
            )}
            {event.transfer_reason && (
              <div>
                <span className="font-medium">Причина:</span> {event.transfer_reason}
              </div>
            )}
          </div>
        );

      case 'lost':
      case 'found':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.location && (
              <div>
                <span className="font-medium">Место:</span> {event.location}
              </div>
            )}
            {event.circumstances && (
              <div>
                <span className="font-medium">Обстоятельства:</span> {event.circumstances}
              </div>
            )}
            {event.contact_name && (
              <div>
                <span className="font-medium">Контакт:</span> {event.contact_name}
              </div>
            )}
            {event.contact_phone && (
              <div>
                <span className="font-medium">Телефон:</span> {event.contact_phone}
              </div>
            )}
          </div>
        );

      case 'death':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.death_reason && (
              <div>
                <span className="font-medium">Причина:</span>{' '}
                {deathReasonLabels[event.death_reason]}
              </div>
            )}
            {event.created_by_clinic_name && (
              <div>
                <span className="font-medium">Подтверждено клиникой:</span>{' '}
                {event.created_by_clinic_name}
              </div>
            )}
          </div>
        );

      case 'shelter_intake':
      case 'adoption':
        return (
          <div className="mt-2 space-y-1 text-sm">
            {event.shelter_name && (
              <div>
                <span className="font-medium">Приют:</span> {event.shelter_name}
              </div>
            )}
            {event.adoption_contract && (
              <div>
                <span className="font-medium">Договор:</span> {event.adoption_contract}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-3">🔌</div>
        <p className="text-lg font-medium mb-2">Сервис истории событий временно недоступен</p>
        <p className="text-sm">Попробуйте обновить страницу позже</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">История событий</h2>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
            selectedTypes.length > 0
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          <span className="text-sm font-medium">
            Фильтры {selectedTypes.length > 0 && `(${selectedTypes.length})`}
          </span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(eventTypeLabels) as PetEventType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  selectedTypes.includes(type)
                    ? eventTypeColors[type]
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{eventTypeIcons[type]}</span>
                <span>{eventTypeLabels[type]}</span>
              </button>
            ))}
          </div>

          {selectedTypes.length > 0 && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>
            {selectedTypes.length > 0
              ? 'Нет событий с выбранными фильтрами'
              : 'Пока нет событий в истории питомца'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Events */}
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center text-xl z-10 ${
                    eventTypeColors[event.event_type].split(' ')[0]
                  }`}
                >
                  {eventTypeIcons[event.event_type]}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className={`rounded-lg border-2 p-4 ${eventTypeColors[event.event_type]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {event.title || eventTypeLabels[event.event_type]}
                          </h3>
                          {event.is_verified && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                              ✓ Подтверждено
                            </span>
                          )}
                        </div>

                        <div className="text-sm opacity-75 mb-2">
                          {formatDate(event.event_date)}
                        </div>

                        {event.description && <p className="text-sm mt-2">{event.description}</p>}

                        {renderEventDetails(event)}

                        {/* Creator info */}
                        <div className="mt-3 text-xs opacity-60">
                          {event.created_by_user_name && (
                            <span>Добавил: {event.created_by_user_name}</span>
                          )}
                          {event.created_by_clinic_name && (
                            <span>Клиника: {event.created_by_clinic_name}</span>
                          )}
                          {event.created_by_organization_name && (
                            <span>Организация: {event.created_by_organization_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
