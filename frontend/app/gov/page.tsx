'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GovEntity {
  id: number;
  name: string;
  short_name: string;
  type: string;
  logo: string;
  address_city: string;
  is_verified: boolean;
  role: string;
}

const GOV_TYPE_LABELS: Record<string, string> = {
  municipality: 'Муниципалитет',
  vet_department: 'Управление ветеринарии',
  animal_control: 'Служба контроля животных',
  inspectorate: 'Инспекция',
  ministry: 'Министерство',
  other: 'Прочее',
};

export default function GovPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<GovEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuthAndEntities = async () => {
      try {
        // Сначала проверяем авторизацию
        const meRes = await fetch('/api/owner/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          setIsAuth(true);
          // Если авторизован — грузим список ведомств
          const govRes = await fetch('/api/gov/my', { credentials: 'include' });
          if (govRes.ok) {
            const data = await govRes.json();
            setEntities(data.data || []);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndEntities();
  }, []);

  const handleMainAction = () => {
    if (!isAuth) return router.push('/gov/auth');
    if (entities.length === 1) return router.push(`/gov/${entities[0].id}/dashboard`);
    if (entities.length > 1) document.getElementById('gov-selector')?.scrollIntoView({ behavior: 'smooth' });
    // нет организаций — остаёмся, показываем сообщение
  };

  const btnLabel = () => {
    if (!isAuth) return 'Войти в кабинет';
    if (entities.length === 1) return 'Перейти в кабинет';
    if (entities.length > 1) return 'Выбрать ведомство';
    return 'Запросить доступ';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favicon.svg" alt="ЗооПлатформа" style={{ height: 32, width: 32 }} />
            <span style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(90deg, #1d4ed8, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ЗооПлатформа
            </span>
          </div>
          {!loading && (
            isAuth && entities.length > 0 ? (
              <button
                onClick={() => document.getElementById('gov-selector')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ padding: '8px 20px', background: 'linear-gradient(90deg, #1d4ed8, #4f46e5)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Мои ведомства ({entities.length})
              </button>
            ) : (
              <button
                onClick={() => router.push('/gov/auth')}
                style={{ padding: '8px 20px', background: 'linear-gradient(90deg, #1d4ed8, #4f46e5)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Войти
              </button>
            )
          )}
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏛️</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', marginBottom: 16, lineHeight: 1.2 }}>
            Кабинет{' '}
            <span style={{ background: 'linear-gradient(90deg, #1d4ed8, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              государственного органа
            </span>
          </h1>
          <p style={{ fontSize: 20, color: '#4b5563', maxWidth: 640, margin: '0 auto 40px' }}>
            Инструменты надзора и контроля в сфере обращения с животными для муниципалитетов, ветеринарных служб и инспекций
          </p>
          <button
            onClick={handleMainAction}
            disabled={loading}
            style={{
              padding: '16px 40px', fontSize: 18, fontWeight: 700,
              background: 'linear-gradient(90deg, #1d4ed8, #4f46e5)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 8px 24px rgba(29,78,216,0.3)', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Загрузка...' : btnLabel()}
          </button>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 64 }}>
          {[
            { icon: '📋', title: 'Реестр организаций', desc: 'Актуальный список поднадзорных организаций по работе с животными.' },
            { icon: '🔍', title: 'Надзор и проверки', desc: 'Планирование и ведение инспекционных проверок организаций.' },
            { icon: '📊', title: 'Сводные отчёты', desc: 'Статистика по животным, приютам и исполнению предписаний.' },
            { icon: '🐾', title: 'ОСВВ', desc: 'Контроль программ отлов — стерилизация — вакцинация — возврат.' },
            { icon: '📄', title: 'Тендеры', desc: 'Управление государственными закупками и тендерными процедурами.' },
            { icon: '🔔', title: 'Уведомления', desc: 'Оповещения о нарушениях, сроках и важных событиях.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#111827' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Gov selector */}
        {isAuth && entities.length > 0 && (
          <div id="gov-selector" style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>Ваши ведомства</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => router.push(`/gov/${entity.id}/dashboard`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {entity.logo ? <img src={entity.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : <span style={{ fontSize: 20 }}>🏛️</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{entity.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>
                      {GOV_TYPE_LABELS[entity.type] || entity.type}{entity.address_city ? ` · ${entity.address_city}` : ''}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 500 }}>
                    {entity.role === 'owner' ? 'Руководитель' : entity.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                  </span>
                  <span style={{ color: '#9ca3af' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No entities but auth */}
        {isAuth && entities.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏛️</div>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>У вас пока нет доступа ни к одному ведомству</p>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Для получения доступа обратитесь к администратору платформы</p>
          </div>
        )}

        {/* CTA не авторизован */}
        {!loading && !isAuth && (
          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', borderRadius: 20, padding: '48px 40px', textAlign: 'center', color: '#fff', boxShadow: '0 8px 32px rgba(29,78,216,0.25)' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Вход для должностных лиц</h2>
            <p style={{ fontSize: 17, opacity: 0.9, marginBottom: 28 }}>Войдите в кабинет государственного органа ЗооПлатформы</p>
            <button
              onClick={() => router.push('/gov/auth')}
              style={{ padding: '14px 36px', background: '#fff', color: '#1d4ed8', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              Войти в кабинет
            </button>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.6)', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        © 2026 ЗооПлатформа — Кабинет государственного органа
      </footer>
    </div>
  );
}
