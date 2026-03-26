'use client';
import { useEffect, useState } from 'react';
import s from '../shared/pet-card.module.css';

interface TimelineEvent {
  id: string | number;
  type: 'registration' | 'medical' | 'event' | 'document' | 'transfer' | 'status';
  title: string;
  description?: string;
  date: string;
  icon: string;
  color: string;
  metadata?: Record<string, unknown>;
}

interface PetTimelineProps {
  pet: { id: number; name: string; created_at?: string; org_pet_number?: number };
  orgId: string;
}

const TYPE_COLORS: Record<string, string> = {
  registration: '#3b82f6',
  medical:      '#ef4444',
  event:        '#a855f7',
  document:     '#eab308',
  transfer:     '#f97316',
  status:       '#22c55e',
};

const TYPE_LABELS: Record<string, string> = {
  registration: 'Регистрация',
  medical:      'Медицина',
  event:        'Событие',
  document:     'Документ',
  transfer:     'Передача',
  status:       'Статус',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function PetTimeline({ pet, orgId }: PetTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
        const res = await fetch(`${apiBase}/pets/${pet.id}/timeline`, { credentials: 'include' });
        const data = await res.json();
        console.log('[PETID DEBUG] Timeline API response:', data);
        const apiEvents = data.events || [];
        apiEvents.sort((a: TimelineEvent, b: TimelineEvent) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(apiEvents);
        console.log('[PETID DEBUG] Timeline parsed events:', apiEvents);
      } catch (err) {
        console.error('[PETID DEBUG] Timeline fetch error:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pet.id, orgId]);

  return (
    <div>
      <div className={s.headerCard}>
        <div className={s.sectionTitle}>Хронология</div>
        <div className={s.sectionDesc}>Все события питомца — регистрация, медицина, смена статуса и другое.</div>
      </div>

      <div className={s.card}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>
            Загрузка...
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>Пока нет событий</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>
              Здесь будет история питомца: визиты к врачу, события, документы
            </div>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div>
            {/* Заголовок с количеством */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Всего событий: {events.length}
              </span>
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative' }}>
              {/* Вертикальная линия */}
              <div style={{
                position: 'absolute', left: 27, top: 16, bottom: 16,
                width: 2, background: '#e5e7eb', borderRadius: 1,
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {events.map((event) => {
                  const color = TYPE_COLORS[event.type] || '#6b7280';
                  return (
                    <div key={event.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                      {/* Иконка */}
                      <div style={{
                        flexShrink: 0, width: 56, height: 56, borderRadius: '50%',
                        background: color, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 22, zIndex: 1,
                        boxShadow: `0 0 0 4px #fff, 0 0 0 5px ${color}33`,
                      }}>
                        {event.icon}
                      </div>

                      {/* Карточка события */}
                      <div style={{
                        flex: 1, background: '#f9fafb', borderRadius: 12, padding: '14px 16px',
                        border: '1px solid #f3f4f6', transition: 'box-shadow 0.2s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{event.title}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0, marginLeft: 12 }}>
                            {formatDate(event.date)}
                          </div>
                        </div>

                        {event.description && (
                          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                            {event.description}
                          </div>
                        )}

                        {/* Метаданные */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {!!event.metadata.species && (
                              <span style={{ fontSize: 12, color: '#6b7280' }}>
                                <b>Вид:</b> {String(event.metadata.species)}
                              </span>
                            )}
                            {!!event.metadata.org_pet_number && (
                              <span style={{ fontSize: 12, color: '#6b7280' }}>
                                <b>№ в организации:</b> {String(event.metadata.org_pet_number)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Бейдж типа */}
                        <div>
                          <span style={{
                            display: 'inline-block', fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 20, color: '#fff',
                            background: color,
                          }}>
                            {TYPE_LABELS[event.type] || event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Инфо-блок */}
            <div style={{
              marginTop: 20, padding: '14px 16px', background: '#eff6ff',
              border: '1px solid #bfdbfe', borderRadius: 10, display: 'flex', gap: 12,
            }}>
              <div style={{ fontSize: 20 }}>ℹ️</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 2 }}>Хронология питомца</div>
                <div style={{ fontSize: 12, color: '#3b82f6' }}>
                  Регистрация, визиты к ветеринару, смена статуса и другие события. Сортировка от новых к старым.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
