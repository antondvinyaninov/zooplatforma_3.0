'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewRegistrationButton from '../shared/NewRegistrationButton';

interface RegistrationEntry {
  id: number;
  pet_id: number;
  pet_name: string;
  pet_photo_url: string;
  species_name: string;
  registered_at: string;
  specialist_name: string;
  specialist_position: string;
  notes: string;
  created_by_name: string;
}

interface Props {
  orgId: string;
}

export default function RegistrationsList({ orgId }: Props) {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<RegistrationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRegistrations = () => {
    setLoading(true);
    fetch(`/api/org/${orgId}/registrations`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setRegistrations(data.registrations || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, [orgId]);

  const filtered = registrations.filter(r =>
    !search ||
    r.pet_name.toLowerCase().includes(search.toLowerCase()) ||
    r.specialist_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16 }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Реестр регистраций</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Официальные записи о регистрации животных организации
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Кнопка регистрации */}
          <NewRegistrationButton orgId={orgId} onSuccess={fetchRegistrations} />

          {/* Поиск */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text" placeholder="Поиск..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13,
                outline: 'none', background: '#f9fafb', width: 200,
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 16, padding: 48,
          boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
            {search ? 'Ничего не найдено' : 'Записей о регистрации пока нет'}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 340 }}>
            Когда вы зарегистрируете питомца через карточку животного, запись появится здесь
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Животное', 'Дата регистрации', 'Специалист', 'Примечания', 'Добавил'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg, i) => (
                <tr
                  key={reg.id}
                  onClick={() => router.push(`/org/${orgId}/pets/${reg.pet_id}`)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: '#f3f4f6', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        {reg.pet_photo_url
                          ? <img src={reg.pet_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '🐾'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{reg.pet_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{reg.species_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#374151' }}>{formatDate(reg.registered_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{reg.specialist_name || '—'}</div>
                    {reg.specialist_position && <div style={{ fontSize: 11, color: '#9ca3af' }}>{reg.specialist_position}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', maxWidth: 200 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.notes || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{reg.created_by_name || '—'}</span>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Вы действительно хотите удалить эту запись о регистрации?')) {
                            fetch(`/api/org/${orgId}/registrations/${reg.id}`, { method: 'DELETE', credentials: 'include' })
                              .then(r => r.json())
                              .then(data => { if (data.success) fetchRegistrations(); })
                              .catch(console.error);
                          }
                        }}
                        style={{ padding: 4, borderRadius: 6, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        title="Удалить запись"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af' }}>
            Всего записей: {filtered.length}
          </div>
        </div>
      )}
    </div>
  );
}
