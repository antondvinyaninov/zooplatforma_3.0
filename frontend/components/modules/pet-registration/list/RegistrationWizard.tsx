'use client';

import { useState, useEffect } from 'react';

interface RegistrationWizardProps {
  petId: number;
  orgId: string;
  pet?: any;
  onClose: () => void;
  onBack?: () => void;
  onSuccess: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 13,
  outline: 'none',
  background: '#f9fafb',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  marginBottom: 4,
};

export default function RegistrationWizard({ petId, orgId, pet, onClose, onBack, onSuccess }: RegistrationWizardProps) {
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    registered_at: localISO,
    specialist_name: '',
    specialist_position: '',
    notes: '',
    chip_number: pet?.chip_number || '',
    tag_number: pet?.tag_number || '',
    brand_number: pet?.brand_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Загружаем список специалистов
  useEffect(() => {
    fetch(`/api/org/${orgId}/staff`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStaff(data.data);
          // Автовыбор, если есть сотрудники
          if (data.data.length > 0) {
            setForm(prev => ({
              ...prev,
              specialist_name: data.data[0].name,
              specialist_position: data.data[0].position || ''
            }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, [orgId]);

  const handleSpecialistChange = (index: number) => {
    if (index >= 0 && index < staff.length) {
      setForm({ ...form, specialist_name: staff[index].name, specialist_position: staff[index].position || '' });
    } else {
      setForm({ ...form, specialist_name: '', specialist_position: '' });
    }
  };

  const handleSubmit = async () => {
    if (!form.registered_at) {
      setError('Укажите дату регистрации');
      return;
    }
    if (!form.specialist_name) {
      setError('Выберите специалиста');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/org/${orgId}/pets/${petId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch {
      setError('Ошибка подключения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20, padding: 28,
          width: 460, maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Регистрация питомца</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              Дата регистрации: {new Date(now).toLocaleDateString('ru-RU')} {new Date(now).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>

        {/* Форма */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Данные питомца (если не заполнены) */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Идентификаторы питомца</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Чип</label>
                <input style={inputStyle} value={form.chip_number} onChange={e => setForm({...form, chip_number: e.target.value})} placeholder="Номер чипа" />
              </div>
              <div>
                <label style={labelStyle}>Клеймо</label>
                <input style={inputStyle} value={form.brand_number} onChange={e => setForm({...form, brand_number: e.target.value})} placeholder="Клеймо" />
              </div>
              <div>
                <label style={labelStyle}>Бирка</label>
                <input style={inputStyle} value={form.tag_number} onChange={e => setForm({...form, tag_number: e.target.value})} placeholder="Номер бирки" />
              </div>
            </div>
          </div>

          {/* Специалист */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Специалист *</label>
              {loadingStaff ? (
                <div style={{ ...inputStyle, color: '#9ca3af' }}>Загрузка...</div>
              ) : staff.length === 0 ? (
                <div style={{ ...inputStyle, color: '#ef4444', fontSize: 12 }}>Нет сотрудников в организации</div>
              ) : (
                <select
                  style={inputStyle}
                  value={staff.findIndex(s => s.name === form.specialist_name)}
                  onChange={e => handleSpecialistChange(Number(e.target.value))}
                >
                  {staff.map((s, idx) => (
                    <option key={s.user_id || idx} value={idx}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label style={labelStyle}>Должность</label>
              <input
                style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                placeholder="Должность"
                value={form.specialist_position}
                readOnly
              />
            </div>
          </div>

          {/* Примечания */}
          <div>
            <label style={labelStyle}>Примечания</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              placeholder="Дополнительная информация о регистрации..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div style={{ fontSize: 13, color: '#ef4444', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          {onBack ? (
            <button
              onClick={onBack}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#fff',
                fontWeight: 500, fontSize: 13, cursor: 'pointer', color: '#374151',
              }}
            >
              ← Назад
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1px solid #e5e7eb', background: '#fff',
                fontWeight: 500, fontSize: 13, cursor: 'pointer', color: '#374151',
              }}
            >
              Отмена
            </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: saving ? '#93c5fd' : '#2563eb',
              color: '#fff', fontWeight: 600, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Сохранение...' : 'Зарегистрировать'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
