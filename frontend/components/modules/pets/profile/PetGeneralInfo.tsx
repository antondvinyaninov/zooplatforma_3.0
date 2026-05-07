import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { InlineEdit } from '@/components/ui/InlineEdit';
import { Button } from '@/components/ui/Button';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Calendar } from '@/components/ui/calendar';
import { ru } from 'date-fns/locale';

export interface PetGeneralInfoProps {
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
  apiUrl: string;
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
    if (months < 0 || months === 0 && today.getDate() < birthDate.getDate()) {
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

export default function PetGeneralInfo({
  pet,
  orgId,
  apiUrl,
  onUpdate
}: PetGeneralInfoProps) {
  const ageString = calculateAge(pet);
  const [saving, setSaving] = useState(false);
  const [breeds, setBreeds] = useState<{ id: number; name: string; species_id: number; }[]>([]);

  useEffect(() => {
    fetch('/api/petid/breeds').then(r => r.json()).then(d => {
      if (d.success && d.breeds) setBreeds(d.breeds);
    }).catch(() => {});
  }, []);

  const saveField = async (payload: Record<string, any>) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
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

  const breedOptions = breeds
    .filter(b => !pet.species_id || b.species_id === Number(pet.species_id))
    .map(b => ({ value: b.id.toString(), label: b.name }));

  const renderRow = (
    label: string, 
    field: string, 
    value: string | undefined, 
    placeholder?: string, 
    type: 'text'|'select'|'combobox'|'date'|'textarea'|'number'|'custom' = 'text', 
    options?: {label: string, value: string}[]
  ) => {
    return (
      <div className="flex flex-col justify-center py-2 border-b border-gray-100 last:border-0 relative min-h-[72px]">
        <div className="text-[13px] text-gray-500 mb-1 leading-none">{label}</div>
        <InlineEdit
          value={value || ''}
          type={type}
          options={options}
          placeholder={placeholder}
          onSave={(val) => {
            const payload: any = { [field]: val };
            if (field === 'breed_id') {
              payload.breed_id = Number(val);
              payload.breed_name = breedOptions.find(o => o.value === val)?.label;
            } else if (field === 'species_id') {
              payload.species_id = Number(val);
            }
            saveField(payload);
          }}
          disabled={saving}
          className="w-full"
        />
      </div>
    );
  };

  const AgeSection = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [ageType, setAgeType] = useState(pet.age_type || 'exact');
    
    // Храним Date для календаря
    const [birthDate, setBirthDate] = useState<Date | undefined>(
      pet.birth_date ? new Date(pet.birth_date) : undefined
    );
    const [years, setYears] = useState(pet.approximate_years || 0);
    const [months, setMonths] = useState(pet.approximate_months || 0);

    const saveAge = async () => {
      let finalBirthDate = '';
      if (ageType === 'approximate') {
        const today = new Date();
        const autoDate = new Date(today.getFullYear() - years, today.getMonth() - months, today.getDate());
        finalBirthDate = autoDate.toISOString().split('T')[0];
      } else if (birthDate) {
        // Учитываем часовой пояс при извлечении YYYY-MM-DD
        const year = birthDate.getFullYear();
        const month = String(birthDate.getMonth() + 1).padStart(2, '0');
        const day = String(birthDate.getDate()).padStart(2, '0');
        finalBirthDate = `${year}-${month}-${day}`;
      }
      
      const payload = {
        age_type: ageType,
        birth_date: finalBirthDate,
        approximate_years: ageType === 'approximate' ? years : 0,
        approximate_months: ageType === 'approximate' ? months : 0
      };
      
      if (saving) return;
      setSaving(true);
      try {
        const res = await fetch(apiUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          onUpdate(payload);
          setIsOpen(false);
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
      <div className="flex flex-col py-2 min-h-[72px]">
        <div className="text-[13px] text-gray-500 mb-1 leading-none w-fit">Возраст</div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger 
            className="group relative flex items-center w-full min-h-10 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 px-3 py-2 -mx-3 text-[14px] text-gray-900 transition-colors cursor-pointer data-[state=open]:border-blue-600 data-[state=open]:bg-white data-[state=open]:shadow-sm outline-none"
          >
            <span className="truncate w-full pr-8 text-left flex items-center">
              <span className="mr-2">🎂</span>
              {ageString}
              <span className="text-gray-400 text-xs ml-2">
                ({pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('ru-RU') : 'Не указана'})
              </span>
            </span>
            <span className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-gray-50/80 rounded pl-2">
              <PencilIcon className="w-4 h-4 text-gray-400" />
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start" sideOffset={4}>
            <div className="text-sm font-semibold text-gray-700 mb-4">Редактирование возраста</div>
            
            <Tabs value={ageType} onValueChange={setAgeType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="exact">Точная дата</TabsTrigger>
                <TabsTrigger value="approximate">Примерно</TabsTrigger>
              </TabsList>
              
              <TabsContent value="exact" className="mt-0 flex flex-col items-center justify-center border border-gray-100 rounded-md">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  locale={ru}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={1990}
                  toYear={new Date().getFullYear()}
                />
              </TabsContent>
              
              <TabsContent value="approximate" className="mt-0">
                <div className="flex gap-4 p-4 border border-gray-100 rounded-md bg-stone-50/50">
                  <div className="flex flex-col space-y-1.5 flex-1">
                    <label className="text-[13px] text-gray-500 font-medium">Лет</label>
                    <input 
                      type="number" min="0" max="30" 
                      value={years} 
                      onChange={e=>setYears(Number(e.target.value))} 
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-0" 
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5 flex-1">
                    <label className="text-[13px] text-gray-500 font-medium">Месяцев</label>
                    <input 
                      type="number" min="0" max="11" 
                      value={months} 
                      onChange={e=>setMonths(Number(e.target.value))} 
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-0" 
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={saving}>Отмена</Button>
              <Button size="sm" onClick={saveAge} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Секция: Основные данные */}
      <Card>
        <CardHeader>
          <CardTitle>Основные данные</CardTitle>
          <CardDescription>Базовая информация о питомце. Кликните на любое поле, чтобы отредактировать.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {renderRow('Имя питомца', 'name', pet.name, 'Введите имя')}
            {renderRow('Вид животного', 'species_id', pet.species_id?.toString(), 'Выберите вид', 'select', [{value: '1', label: 'Собака'}, {value: '2', label: 'Кошка'}])}
            {renderRow('Порода', 'breed_id', pet.breed_id?.toString(), 'Поиск породы...', 'combobox', breedOptions)}
            {renderRow('Пол', 'gender', pet.gender, 'Выберите пол', 'select', [{value: 'male', label: 'Самец'}, {value: 'female', label: 'Самка'}])}
          </div>
          
          <div className="mt-2">
            <AgeSection />
          </div>

          <div className="mt-6">
            {renderRow('Описание питомца (для каталога)', 'description', pet.description, 'Подробный рассказ о питомце, характере, привычках...', 'textarea')}
          </div>
        </CardContent>
      </Card>

      {/* Секция: Внешность */}
      <Card>
        <CardHeader>
          <CardTitle>Внешний вид и приметы</CardTitle>
          <CardDescription>Физические характеристики и особенности экстерьера.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {renderRow('Размер', 'size', pet.size, 'Выберите размер', 'select', [{value: 'small', label: 'Маленький'}, {value: 'medium', label: 'Средний'}, {value: 'large', label: 'Крупный'}])}
            {renderRow('Окрас', 'color', pet.color, 'Например: черный с белым')}
            {renderRow('Шерсть', 'fur', pet.fur, 'Например: короткая')}
            {renderRow('Уши', 'ears', pet.ears, 'Например: висячие')}
            {renderRow('Хвост', 'tail', pet.tail, 'Например: купирован')}
            {renderRow('Особые приметы', 'special_marks', pet.special_marks, 'Например: шрам на носу')}
          </div>
        </CardContent>
      </Card>

      {/* Секция: Репродуктивный статус */}
      <Card>
        <CardHeader>
          <CardTitle>Репродуктивный статус</CardTitle>
          <CardDescription>Данные о стерилизации или кастрации питомца.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {renderRow('Дата стерилизации', 'sterilization_date', pet.sterilization_date?.split('T')[0], 'Укажите дату', 'date')}
            {renderRow('Тип операции', 'sterilization_type', pet.sterilization_type, 'Например: Кастрация')}
            {renderRow('Специалист', 'sterilization_specialist', pet.sterilization_specialist, 'ФИО хирурга')}
            {renderRow('Организация (клиника)', 'sterilization_org', pet.sterilization_org, 'Название клиники')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}