import React, { useState } from 'react';
import s from '../shared/pet-card.module.css';

interface PetLocationProps {
  pet: any;
  orgId: string;
  onUpdate: (updates: Record<string, any>) => void;
}

export default function PetLocation({ pet, orgId, onUpdate }: PetLocationProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const startEdit = (field: string, val: string) => {
    setEditingField(field);
    setEditValue(val || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (field: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const body = { [field]: editValue };
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onUpdate(body);
        setEditingField(null);
      } else {
        alert('Ошибка сохранения');
      }
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setSaving(false);
    }
  };

  const EditableRow = ({ label, field, value, displayValue, as = 'input', options = [] }: any) => {
    const isEditing = editingField === field;

    return (
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12, position: 'relative' }}
        onMouseLeave={() => { if (!isEditing) cancelEdit(); }}
      >
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{label}</div>
        
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {as === 'select' ? (
              <select
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                autoFocus
              >
                <option value="">Не указано</option>
                {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(field);
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
            )}
            
            <button onClick={() => saveEdit(field)} disabled={saving}
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#e0e7ff', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {saving ? '⏳' : '✅'}
            </button>
            <button onClick={cancelEdit} disabled={saving}
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 }}>
            <button
              onClick={() => startEdit(field, value)}
              title="Редактировать"
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#9ca3af',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.6, transition: 'all 0.2s', flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
            >
              ✏️
            </button>
            <div style={{ fontSize: 15, color: '#111827', flex: 1 }}>{displayValue || '—'}</div>
          </div>
        )}
      </div>
    );
  };

  const locOptions = [
    { value: 'home', label: 'Дом' },
    { value: 'shelter', label: 'Приют' },
    { value: 'cage', label: 'Клетка/Вольер' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={s.card}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          👤 Владелец / Опекун
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 32px' }}>
          <EditableRow 
            field="location_contact" label="ФИО / Контактное лицо" 
            value={pet.location_contact} displayValue={pet.location_contact} 
          />
          <EditableRow 
            field="location_phone" label="Телефон" 
            value={pet.location_phone} displayValue={pet.location_phone} 
          />
        </div>
      </div>

      <div className={s.card}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          🏠 Место содержания
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 32px' }}>
          <EditableRow 
            field="location_type" label="Тип" 
            value={pet.location_type} 
            displayValue={locOptions.find(o => o.value === pet.location_type)?.label || pet.location_type} 
            as="select" options={locOptions}
          />
          <EditableRow 
            field="location_cage" label="Клетка / Вольер" 
            value={pet.location_cage} displayValue={pet.location_cage} 
          />
          <EditableRow 
            field="location_address" label="Адрес" 
            value={pet.location_address} displayValue={pet.location_address} 
          />
          <EditableRow 
            field="location_notes" label="Заметки" 
            value={pet.location_notes} displayValue={pet.location_notes} 
          />
        </div>
      </div>
    </div>
  );
}
