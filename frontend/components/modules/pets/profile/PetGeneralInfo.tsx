import React, { useState } from 'react';
import s from '../shared/pet-card.module.css';

interface PetGeneralInfoProps {
  pet: {
    id?: number;
    name?: string;
    species_name?: string;
    breed_name?: string;
    breed_id?: number;
    gender?: string;
    birth_date?: string;
    age_type?: string;
    approximate_years?: number;
    approximate_months?: number;
    description?: string;
    color?: string;
    fur?: string;
    ears?: string;
    tail?: string;
    size?: string;
    special_marks?: string;
    species_id?: number; 
    sterilization_date?: string;
    sterilization_specialist?: string;
    sterilization_org?: string;
    sterilization_type?: string;
  };
  orgId: string;
  onUpdate: (updates: Record<string, any>) => void;
}

const calculateAge = (pet: PetGeneralInfoProps['pet']) => {
  if (pet.age_type === 'approximate' && pet.approximate_years !== undefined && pet.approximate_months !== undefined) {
    const y = pet.approximate_years;
    const m = pet.approximate_months;
    if (y === 0 && m === 0) return 'Меньше месяца';
    const yStr = y > 0 ? `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}` : '';
    const mStr = m > 0 ? `${m} ${m === 1 ? 'месяц' : m < 5 ? 'месяца' : 'месяцев'}` : '';
    return [yStr, mStr].filter(Boolean).join(' ');
  }
  if (pet.birth_date) {
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0 && months === 0) return 'Меньше месяца';
    const yStr = years > 0 ? `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}` : '';
    const mStr = months > 0 ? `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}` : '';
    return [yStr, mStr].filter(Boolean).join(' ');
  }
  return 'Неизвестно';
};

export default function PetGeneralInfo({ pet, orgId, onUpdate }: PetGeneralInfoProps) {
  const ageString = calculateAge(pet);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [breeds, setBreeds] = useState<{ id: number; name: string; species_id: number }[]>([]);

  // Загружаем список пород один раз при монтировании
  React.useEffect(() => {
    fetch('/api/pethelper/breeds')
      .then(r => r.json())
      .then(d => { if (d.success && d.breeds) setBreeds(d.breeds); })
      .catch(() => {});
  }, []);

  const startEdit = (field: string, val: string) => {
    setEditingField(field);
    setEditValue(val);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async (field: string, payloadKey: string = field) => {
    if (saving) return;
    setSaving(true);
    try {
      const body = { [payloadKey]: editValue };
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

  // Helper component for rows
  const EditableRow = ({
    label, field, payloadKey, value, displayValue, as = 'input', options = [], placeholder
  }: {
    label: string; field: string; payloadKey?: string; value: string; displayValue: React.ReactNode;
    as?: 'input' | 'select' | 'date'; options?: { label: string; value: string }[]; placeholder?: string
  }) => {
    const isEditing = editingField === field;
    const keyToSave = payloadKey || field;

    return (
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12, position: 'relative' }}
        onMouseLeave={() => { if (!isEditing) cancelEdit(); }} // optional: auto-cancel on leave if not interacted
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
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : as === 'date' ? (
              <input
                type="date"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                autoFocus
                placeholder={placeholder}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(field, keyToSave);
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
            )}
            
            <button onClick={() => saveEdit(field, keyToSave)} disabled={saving}
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
            <div style={{ fontSize: 15, color: '#111827', flex: 1 }}>{displayValue}</div>
          </div>
        )}
      </div>
    );
  };

  // Custom Breed Editor
  const EditableBreedRow = () => {
    const isEditing = editingField === 'breed';
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Filter breeds by species_id (if pet has species_id selected) and by search string
    const filteredBreeds = breeds.filter(b => 
      (!pet.species_id || b.species_id === pet.species_id) && 
      b.name.toLowerCase().includes(search.toLowerCase())
    );

    const onSelectBreed = async (breed_id: number, breed_name: string) => {
      if (saving) return;
      setSaving(true);
      try {
        const body = { breed_id };
        const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
        const res = await fetch(`${apiBase}/pets/${pet.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(body),
        });
        if (res.ok) {
          onUpdate({ breed_id, breed_name });
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

    return (
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Порода</div>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Начните вводить..."
                style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
                autoFocus
              />
              {showDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, maxHeight: 200, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  {filteredBreeds.length > 0 ? filteredBreeds.map(b => (
                    <div key={b.id} onClick={() => onSelectBreed(b.id, b.name)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}
                         onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {b.name}
                    </div>
                  )) : (
                    <div style={{ padding: '8px 12px', fontSize: 14, color: '#6b7280' }}>Ничего не найдено</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={cancelEdit} disabled={saving} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 28 }}>
            <button
              title="Редактировать"
              onClick={() => { setEditingField('breed'); setSearch(pet.breed_name || ''); setShowDropdown(false); }}
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
            <div style={{ fontSize: 15, color: '#111827', flex: 1 }}>{pet.breed_name || 'Не указана'}</div>
          </div>
        )}
      </div>
    );
  };

  // Custom Age Editor
  const isEditingAge = editingField === 'age';
  const startEditAge = () => {
    setEditingField('age');
    // We only need local state for the form during editing
  };

  const AgeEditor = () => {
    const [ageType, setAgeType] = useState(pet.age_type || 'exact');
    const [birthDate, setBirthDate] = useState(pet.birth_date ? pet.birth_date.split('T')[0] : '');
    const [years, setYears] = useState(pet.approximate_years || 0);
    const [months, setMonths] = useState(pet.approximate_months || 0);

    const saveAge = async () => {
      if (saving) return;
      setSaving(true);
      try {
        let finalBirthDate = birthDate;
        if (ageType === 'approximate') {
          const today = new Date();
          const autoDate = new Date(today.getFullYear() - years, today.getMonth() - months, today.getDate());
          finalBirthDate = autoDate.toISOString().split('T')[0];
        }

        const body = {
          age_type: ageType,
          birth_date: finalBirthDate,
          approximate_years: ageType === 'approximate' ? years : 0,
          approximate_months: ageType === 'approximate' ? months : 0,
        };

        const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
        const res = await fetch(`${apiBase}/pets/${pet.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
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

    return (
      <div style={{ gridColumn: '1 / -1', background: '#f9fafb', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" value="exact" checked={ageType === 'exact'} onChange={() => setAgeType('exact')} />
            Точная дата
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="radio" value="approximate" checked={ageType === 'approximate'} onChange={() => setAgeType('approximate')} />
            Примерный
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
          {ageType === 'exact' ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Дата рождения</div>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db' }} />
            </div>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Лет</div>
                <input type="number" min="0" max="30" value={years} onChange={e => setYears(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Месяцев</div>
                <input type="number" min="0" max="11" value={months} onChange={e => setMonths(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db' }} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveAge} disabled={saving} style={{ flex: 1, padding: 8, borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>
            {saving ? 'Сохранение...' : 'Сохранить возраст'}
          </button>
          <button onClick={cancelEdit} disabled={saving} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>
            Отмена
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Секция: Основные данные */}
      <div>
        <div className={s.headerCard}>
          <div className={s.sectionTitle}>Основные данные</div>
          <div className={s.sectionDesc}>Базовая информация о питомце. Наведите на поле, чтобы отредактировать.</div>
        </div>
        <div className={s.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px' }}>
            <EditableRow field="name" label="Имя питомца" value={pet.name || ''} displayValue={pet.name || '—'} />
            
            {/* Вид не так просто редактировать инлайн (нужно менять species_id), пока оставим view-only или селект: */}
            <EditableRow 
              field="species_id" label="Вид животного" 
              value={pet.species_id?.toString() || '1'} 
              displayValue={pet.species_name || '—'} 
              as="select" options={[{ value: '1', label: 'Собака' }, { value: '2', label: 'Кошка' }]}
            />
            
            <EditableBreedRow />

            <EditableRow 
              field="gender" label="Пол" 
              value={pet.gender || ''} 
              displayValue={pet.gender === 'male' ? '♂ Самец' : pet.gender === 'female' ? '♀ Самка' : 'Не указан'} 
              as="select" options={[{ value: 'male', label: 'Самец' }, { value: 'female', label: 'Самка' }]}
            />
            
            {/* Блок возраста */}
            {isEditingAge ? <AgeEditor /> : (
              <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <button
                    onClick={startEditAge}
                    title="Редактировать возраст"
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#9ca3af',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.6, transition: 'all 0.2s', marginTop: 12, flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    ✏️
                  </button>

                  <div style={{ display: 'flex', gap: 40, flex: 1 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Возраст (авто-расчёт)</div>
                      <div style={{ fontSize: 15, color: '#111827', display: 'flex', alignItems: 'center', gap: 6, minHeight: 28 }}>
                        🎂 {ageString}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Дата рождения</div>
                      <div style={{ fontSize: 15, color: '#111827', minHeight: 28, display: 'flex', alignItems: 'center' }}>
                        {pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('ru-RU') : 'Не указана'}
                        {pet.age_type === 'approximate' && <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 6 }}>(примерно)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Секция: Внешность */}
      <div>
        <div className={s.headerCard}>
          <div className={s.sectionTitle}>Внешний вид и приметы</div>
          <div className={s.sectionDesc}>Окрас, шерсть, размер и особые приметы питомца.</div>
        </div>
        <div className={s.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px' }}>
            <EditableRow 
              field="size" label="Размер" 
              value={pet.size || ''} 
              displayValue={pet.size === 'small' ? 'Маленький' : pet.size === 'medium' ? 'Средний' : pet.size === 'large' ? 'Крупный' : 'Не указан'} 
              as="select" options={[{ value: 'small', label: 'Маленький' }, { value: 'medium', label: 'Средний' }, { value: 'large', label: 'Крупный' }]}
            />
            
            <EditableRow field="color" label="Окрас" value={pet.color || ''} displayValue={pet.color || '—'} />
            <EditableRow field="fur" label="Шерсть" value={pet.fur || ''} displayValue={pet.fur || '—'} />
            <EditableRow field="ears" label="Уши" value={pet.ears || ''} displayValue={pet.ears || '—'} />
            <EditableRow field="tail" label="Хвост" value={pet.tail || ''} displayValue={pet.tail || '—'} />
            <EditableRow field="special_marks" label="Особые приметы" value={pet.special_marks || ''} displayValue={pet.special_marks || '—'} />
          </div>
        </div>
      </div>

      {/* Секция: Репродуктивный статус */}
      <div>
        <div className={s.headerCard}>
          <div className={s.sectionTitle}>Репродуктивный статус</div>
          <div className={s.sectionDesc}>Данные о стерилизации или кастрации питомца.</div>
        </div>
        <div className={s.card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 24px' }}>
            <EditableRow 
              field="sterilization_date" label="Дата стерилизации (кастрации)" 
              value={pet.sterilization_date || ''} 
              displayValue={pet.sterilization_date ? `Да, проведена: ${new Date(pet.sterilization_date).toLocaleDateString('ru-RU')}` : 'Нет информации / Не стерилизован(а)'} 
              as="date"
            />
            <EditableRow 
              field="sterilization_type" label="Тип операции" 
              value={pet.sterilization_type || ''} 
              displayValue={pet.sterilization_type || 'Не указан'} 
              placeholder="Например: Кастрация, Овариогистерэктомия"
            />
            <EditableRow 
              field="sterilization_specialist" label="Специалист" 
              value={pet.sterilization_specialist || ''} 
              displayValue={pet.sterilization_specialist || 'Не указан'} 
              placeholder="ФИО хирурга"
            />
            <EditableRow 
              field="sterilization_org" label="Организация (клиника)" 
              value={pet.sterilization_org || ''} 
              displayValue={pet.sterilization_org || 'Не указана'} 
              placeholder="Название клиники"
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
