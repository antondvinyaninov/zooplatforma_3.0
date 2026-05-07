'use client';

import { useState, useEffect } from 'react';

interface AddPetModalProps {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm = {
  name: '',
  species_id: 1,
  breed_id: null as number | null,
  gender: 'male',
  color: '',
  size: '',
};

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

const selectStyle = "flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors";

export default function AddPetModal({ orgId, onClose, onSuccess }: AddPetModalProps) {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  let roleLabel = 'Организация-опекун';
  let relationshipValue = 'org';
  let roleIcon = '🏢';

  if (orgId === 'owner') {
    roleLabel = 'Владелец питомца';
    relationshipValue = 'owner';
    roleIcon = '👤';
  } else if (orgId === 'pethelper') {
    roleLabel = 'Официальный куратор';
    relationshipValue = 'curator';
    roleIcon = '🤝';
  } else if (orgId === 'petid') {
    roleLabel = 'Платформа PetID';
    relationshipValue = 'petid';
    roleIcon = '⚕️';
  }
  const [breeds, setBreeds] = useState<any[]>([]);
  const [breedSearch, setBreedSearch] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  useEffect(() => {
    let breedsEndpoint = `/api/org/${orgId}/breeds`;
    if (orgId === 'petid') breedsEndpoint = '/api/petid/breeds';
    if (orgId === 'owner') breedsEndpoint = '/api/owner/breeds';
    if (orgId === 'pethelper') breedsEndpoint = '/api/pethelper/breeds';

    fetch(breedsEndpoint, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setBreeds(data.breeds || data.data || []))
      .catch(() => {});
  }, []);

  const reset = () => {
    setForm({ ...emptyForm });
    setBreedSearch('');
    setShowBreedDropdown(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        name: form.name || null,
        color: form.color || null,
        size: form.size || null,
        age_type: 'exact',
        approximate_years: 0,
        approximate_months: 0,
        birth_date: '',
        description: null,
        fur: null,
        ears: null,
        tail: null,
        special_marks: null,
        relationship: relationshipValue,
      };

      let endpoint = `/api/org/${orgId}/pets`;
      if (orgId === 'petid') endpoint = '/api/petid/pets';
      if (orgId === 'owner') endpoint = '/api/owner/pets';
      if (orgId === 'pethelper') endpoint = '/api/pethelper/pets';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        reset();
        onSuccess();
      } else {
        const data = await res.json();
        alert('Ошибка: ' + (data.error || 'Не удалось добавить питомца'));
      }
    } catch {
      alert('Ошибка подключения');
    } finally {
      setSaving(false);
    }
  };

  const filteredBreeds = breeds.filter(
    (b) =>
      b.species_id === form.species_id &&
      b.name.toLowerCase().includes(breedSearch.toLowerCase()),
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 8, padding: 24,
          width: 420, maxWidth: '95vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
          Добавить питомца
        </h2>

        {/* Информационный блок о роли */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#dcfce7', borderRadius: '50%' }}>
            {roleIcon}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ваша роль при добавлении</div>
            <div style={{ fontSize: 15, color: '#15803d', fontWeight: 700 }}>{roleLabel}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Кличка */}
          <div>
            <Label className="mb-1 block text-xs">
              Кличка{' '}
              <span className="font-normal text-gray-300">(необязательно)</span>
            </Label>
            <Input
              placeholder="Барсик, Рекс..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Вид + Пол */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">Вид *</Label>
              <select
                className={selectStyle}
                value={form.species_id}
                onChange={(e) => {
                  setForm({ ...form, species_id: Number(e.target.value), breed_id: null });
                  setBreedSearch('');
                }}
              >
                <option value={1}>Собака</option>
                <option value={2}>Кошка</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Пол *</Label>
              <select
                className={selectStyle}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Самец ♂</option>
                <option value="female">Самка ♀</option>
              </select>
            </div>
          </div>

          {/* Порода с автодополнением */}
          <div className="relative">
            <Label className="mb-1 block text-xs">Порода</Label>
            <Input
              placeholder="Начните вводить породу..."
              value={breedSearch}
              onChange={(e) => {
                setBreedSearch(e.target.value);
                setShowBreedDropdown(true);
                if (!e.target.value) setForm({ ...form, breed_id: null });
              }}
              onFocus={() => setShowBreedDropdown(true)}
              onBlur={() => setTimeout(() => setShowBreedDropdown(false), 150)}
            />
            {showBreedDropdown && breedSearch && (
              <div
                style={{
                  position: 'absolute', zIndex: 10, width: '100%', marginTop: 4,
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
                }}
              >
                {filteredBreeds.length === 0 ? (
                  <div style={{ padding: '8px 12px', color: '#9ca3af', fontSize: 13 }}>
                    Породы не найдены
                  </div>
                ) : (
                  filteredBreeds.map((b) => (
                    <div
                      key={b.id}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}
                      onMouseDown={() => {
                        setForm({ ...form, breed_id: b.id });
                        setBreedSearch(b.name);
                        setShowBreedDropdown(false);
                      }}
                    >
                      {b.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Окрас + Размер */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">Окрас</Label>
              <Input
                placeholder="Рыжий, чёрный..."
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Размер</Label>
              <select
                className={selectStyle}
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              >
                <option value="">Не указан</option>
                <option value="small">Маленький</option>
                <option value="medium">Средний</option>
                <option value="large">Крупный</option>
              </select>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Добавить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
