'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Organization {
  id: number;
  name: string;
  short_name: string;
  type: string;
  logo: string;
  bio: string;
  address_city: string;
  is_verified: boolean;
  role: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  shelter: 'Приют',
  clinic: 'Ветклиника',
  shop: 'Зоомагазин',
  breeder: 'Заводчик',
  hotel: 'Зоогостиница',
  foundation: 'Фонд / НКО',
  other: 'Другое',
};

export default function OrgPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuthAndOrgs = async () => {
      try {
        // Сначала проверяем авторизацию (как в /owner)
        const meRes = await fetch('/api/owner/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          setIsAuth(true);
          // Если авторизован — грузим список организаций
          const orgsRes = await fetch('/api/org/my', { credentials: 'include' });
          if (orgsRes.ok) {
            const data = await orgsRes.json();
            setOrgs(data.data || []);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndOrgs();
  }, []);

  const handleMainAction = () => {
    if (!isAuth) {
      router.push('/org/auth');
    } else if (orgs.length === 1) {
      router.push(`/org/${orgs[0].id}/dashboard`);
    } else if (orgs.length > 1) {
      // scroll to selector
      document.getElementById('org-selector')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/orgs/create');
    }
  };

  const btnLabel = () => {
    if (!isAuth) return 'Войти в кабинет';
    if (orgs.length === 1) return 'Перейти в кабинет';
    if (orgs.length > 1) return 'Выбрать организацию';
    return 'Создать организацию';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/favicon.svg" alt="ЗооПлатформа" style={{ height: 32, width: 32 }} />
            <span style={{ fontSize: 20, fontWeight: 700, background: 'linear-gradient(90deg, #16a34a, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ЗооПлатформа
            </span>
          </div>
          {loading ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
          ) : isAuth && orgs.length > 0 ? (
            <button
              onClick={() => document.getElementById('org-selector')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '8px 20px', background: 'linear-gradient(90deg, #16a34a, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Мои организации ({orgs.length})
            </button>
          ) : (
            <button
              onClick={() => router.push('/org/auth')}
              style={{ padding: '8px 20px', background: 'linear-gradient(90deg, #16a34a, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Войти
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏢</div>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#111827', marginBottom: 16, lineHeight: 1.2 }}>
            Кабинет{' '}
            <span style={{ background: 'linear-gradient(90deg, #16a34a, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              организации
            </span>
          </h1>
          <p style={{ fontSize: 20, color: '#4b5563', maxWidth: 600, margin: '0 auto 40px' }}>
            Единое рабочее пространство для приютов, клиник, зоомагазинов и других организаций по работе с животными
          </p>
          <button
            onClick={handleMainAction}
            disabled={loading}
            style={{
              padding: '16px 40px', fontSize: 18, fontWeight: 700,
              background: 'linear-gradient(90deg, #16a34a, #059669)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 8px 24px rgba(22,163,74,0.3)', transition: 'transform 0.15s',
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
            { icon: '🐾', title: 'Управление животными', desc: 'Карточки, история, статусы. Полная база подопечных организации.' },
            { icon: '👥', title: 'Команда', desc: 'Сотрудники и волонтёры с ролями и правами доступа.' },
            { icon: '📋', title: 'Документы и отчёты', desc: 'Акты, договоры, статистика — всё в одном месте.' },
            { icon: '🏛️', title: 'Связь с ЗооБазой', desc: 'Интеграция с единым реестром животных платформы.' },
            { icon: '🔔', title: 'Уведомления', desc: 'Важные события по вашим животным и организации.' },
            { icon: '⚙️', title: 'Настройки и модули', desc: 'Активируйте только нужные функции для вашего типа организации.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: '#111827' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Org selector (если залогинен и есть орги) */}
        {isAuth && orgs.length > 0 && (
          <div id="org-selector" style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#111827' }}>
              Ваши организации
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => router.push(`/org/${org.id}/dashboard`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {org.logo ? <img src={org.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : <span style={{ fontSize: 20 }}>🏢</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{org.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>
                      {ORG_TYPE_LABELS[org.type] || org.type}{org.address_city ? ` · ${org.address_city}` : ''}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: org.role === 'owner' ? '#dbeafe' : '#f1f5f9', color: org.role === 'owner' ? '#1d4ed8' : '#475569', fontSize: 12, fontWeight: 500 }}>
                    {org.role === 'owner' ? 'Владелец' : org.role === 'admin' ? 'Администратор' : 'Участник'}
                  </span>
                  <span style={{ color: '#9ca3af' }}>›</span>
                </button>
              ))}
              <a href="/orgs/create" style={{ display: 'block', padding: '12px 18px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: 12, color: '#6b7280', textDecoration: 'none', fontWeight: 500, marginTop: 4 }}>
                + Добавить организацию
              </a>
            </div>
          </div>
        )}

        {/* CTA если не авторизован */}
        {!loading && !isAuth && (
          <div style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', borderRadius: 20, padding: '48px 40px', textAlign: 'center', color: '#fff', boxShadow: '0 8px 32px rgba(22,163,74,0.25)' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Готовы начать?</h2>
            <p style={{ fontSize: 17, opacity: 0.9, marginBottom: 28 }}>Войдите и зарегистрируйте свою организацию на ЗооПлатформе</p>
            <button
              onClick={() => router.push('/org/auth')}
              style={{ padding: '14px 36px', background: '#fff', color: '#16a34a', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              Войти в кабинет
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.6)', padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        © 2026 ЗооПлатформа — Кабинет организации
      </footer>
    </div>
  );
}
