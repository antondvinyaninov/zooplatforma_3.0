import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { InlineEdit } from '@/components/ui/InlineEdit';
import PetGuardianCard from './PetGuardianCard';
import CityAutocomplete from '@/components/main/shared/CityAutocomplete';

interface PetIdentificationProps {
  pet: any;
  orgId: string;
  apiUrl: string;
  onUpdate: (updates: Record<string, any>) => void;
  extraActions?: React.ReactNode;
}

export default function PetIdentification({ pet, orgId, apiUrl, onUpdate, extraActions }: PetIdentificationProps) {
  const [saving, setSaving] = useState(false);

  const saveField = async (payload: Record<string, any>) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onUpdate(payload);
      } else {
        alert('Ошибка сохранения');
      }
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setSaving(false);
    }
  };

  const locOptions = [
    { value: 'home', label: 'Дом' },
    { value: 'shelter', label: 'Приют' },
    { value: 'foster', label: 'Передержка' },
    { value: 'clinic', label: 'Ветеринарная клиника' },
    { value: 'hotel', label: 'Гостиница для животных' },
    { value: 'other', label: 'Другое' },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const renderRow = (
    label: string, 
    field: string, 
    value: string | undefined, 
    placeholder?: string, 
    type: 'text'|'select'|'date'|'custom' = 'text', 
    options?: {label: string, value: string}[],
    customRenderInput?: any,
    displayValue?: string
  ) => {
    return (
      <div className="flex flex-col justify-center py-2 border-b border-gray-100 last:border-0 relative min-h-[72px]">
        <div className="text-[13px] text-gray-500 mb-1 leading-none">{label}</div>
        <InlineEdit
          value={value || ''}
          type={type}
          options={options}
          placeholder={placeholder}
          displayValue={displayValue}
          onSave={(val) => {
            if (field === 'city') {
              saveField({ city: val, actual_city: val });
            } else {
              saveField({ [field]: val });
            }
          }}
          disabled={saving}
          className="w-full"
          renderInput={customRenderInput}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Маркирование */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Идентификация и Маркирование</CardTitle>
            <CardDescription>Номера бирок, чипов, клеймо питомца</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {extraActions}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 mb-4">
            {renderRow("№ бирки", "tag_number", pet.tag_number)}
            {renderRow("Клеймо", "brand_number", pet.brand_number)}
            {renderRow("№ чипа", "chip_number", pet.chip_number)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {renderRow("Дата маркирования", "marking_date", pet.marking_date?.split('T')[0], "Укажите дату", "date", undefined, undefined, formatDate(pet.marking_date))}
            {renderRow("Специалист", "marking_specialist", pet.marking_specialist, "ФИО специалиста")}
            {renderRow("Организация", "marking_org", pet.marking_org, "Название клиники/организации")}
          </div>
        </CardContent>
      </Card>

      {/* Владелец / Опекун */}
      <Card>
        <CardHeader>
          <CardTitle>Опекун / Владелец</CardTitle>
          <CardDescription>Информация о текущем владельце или опекуне питомца</CardDescription>
        </CardHeader>
        <CardContent>
          <PetGuardianCard pet={pet} orgId={orgId} />
        </CardContent>
      </Card>

      {/* Место содержания */}
      <Card>
        <CardHeader>
          <CardTitle>Место содержания</CardTitle>
          <CardDescription>Текущее фактическое местонахождение питомца</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {renderRow("Тип места", "location_type", pet.location_type, "Выберите тип", "select", locOptions)}
            {renderRow("Город", "city", pet.actual_city || pet.city, "Начните вводить город...", "custom", undefined, (props: any) => (
              <CityAutocomplete
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                className={props.className + " !py-2"}
              />
            ), pet.actual_city || pet.city)}
            {renderRow("Вольер / Комната", "location_cage", pet.location_cage)}
            {renderRow("Адрес (без города)", "location_address", pet.location_address)}
            {renderRow("Примечания", "location_notes", pet.location_notes)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
