'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InlineEdit } from '@/components/ui/InlineEdit';

interface PetHealthProps {
  pet: {
    id: number;
    weight?: number | null;
    health_notes: string;
  };
  orgId: string;
  apiUrl: string;
  onUpdate: (updates: Record<string, any>) => void;
}

interface Vaccination {
  id?: number;
  date: string;
  vaccine_name: string;
  vaccine_type: string;
  next_date?: string;
  veterinarian?: string;
  clinic?: string;
  notes?: string;
}

interface Treatment {
  id?: number;
  date: string;
  treatment_type: string;
  product_name: string;
  next_date?: string;
  dosage?: string;
  notes?: string;
}

interface MedicalRecord {
  id?: number;
  date: string;
  record_type: string;
  title: string;
  description?: string;
  veterinarian?: string;
  clinic?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  cost?: number;
}

function DateField({ label, value, onChange, required = false }: { label: string, value: string, onChange: (val: string) => void, required?: boolean }) {
  const [manual, setManual] = useState(false);
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) setRawText(`${parts[2]}.${parts[1]}.${parts[0]}`);
      else setRawText(value);
    } else {
      setRawText(value || '');
    }
  }, [value, manual]);

  const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let t = e.target.value;
    if (e.nativeEvent && (e.nativeEvent as any).inputType !== 'deleteContentBackward') {
      if (t.length === 2 && !t.includes('.')) t += '.';
      else if (t.length === 5 && (t.match(/\./g) || []).length === 1) t += '.';
    }
    setRawText(t);
    const match = t.match(/^(\d{2})[.,/](\d{2})[.,/](\d{4})$/);
    if (match) {
      onChange(`${match[3]}-${match[2]}-${match[1]}`);
    } else {
      onChange(t);
    }
  };

  const inputClass = "w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[13px] font-medium text-gray-700 leading-none">{label}{required ? <span className="text-red-500">*</span> : ''}</label>
        <button type="button" onClick={() => setManual(!manual)} className="text-[11px] text-blue-600 hover:text-blue-700 focus:outline-none">
          {manual ? 'Календарь' : 'Ввести вручную'}
        </button>
      </div>
      {manual ? (
        <input type="text" className={inputClass} placeholder="ДД.ММ.ГГГГ" value={rawText} onChange={handleRawChange} />
      ) : (
        <input type="date" className={inputClass} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

export default function PetHealth({ pet, orgId, apiUrl, onUpdate }: PetHealthProps) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [showAddVaccination, setShowAddVaccination] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);
  const [newVaccination, setNewVaccination] = useState<Vaccination>({
    date: '', vaccine_name: '', vaccine_type: 'rabies', next_date: '',
    veterinarian: '', clinic: '', notes: '',
  });

  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [newTreatment, setNewTreatment] = useState<Treatment>({
    date: '', treatment_type: 'deworming', product_name: '', next_date: '',
    dosage: '', notes: '',
  });

  const [showAddMedicalRecord, setShowAddMedicalRecord] = useState(false);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<MedicalRecord | null>(null);
  const [newMedicalRecord, setNewMedicalRecord] = useState<MedicalRecord>({
    date: '', record_type: 'examination', title: '', description: '',
    veterinarian: '', clinic: '', diagnosis: '', treatment: '',
    medications: '', cost: undefined,
  });

  const [loading, setLoading] = useState(true);
  
  const fetchVaccinations = async () => {
    try {
      const response = await fetch(`${apiUrl}/vaccinations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setVaccinations(data.vaccinations || []);
      }
    } catch (e) { console.error('Ошибка загрузки вакцин', e); }
  };

  const fetchTreatments = async () => {
    try {
      const response = await fetch(`${apiUrl}/treatments`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTreatments(data.treatments || []);
      }
    } catch (e) { console.error('Ошибка загрузки обработок', e); }
  };

  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch(`${apiUrl}/medical-records`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMedicalRecords(data.medical_records || []);
      }
    } catch (e) { console.error('Ошибка загрузки мед. записей', e); }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVaccinations(), fetchTreatments(), fetchMedicalRecords()]);
      setLoading(false);
    };
    loadData();
  }, [pet.id, orgId]);

  const saveBaseField = async (payload: Record<string, any>) => {
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onUpdate(payload);
      } else alert('Ошибка сохранения');
    } catch (e) { alert('Ошибка соединения'); }
  };

  const getVaccineTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      rabies: 'Бешенство', distemper: 'Чума', parvovirus: 'Парвовирус',
      hepatitis: 'Гепатит', leptospirosis: 'Лептоспироз', complex: 'Комплексная', other: 'Другое',
    };
    return types[type] || type;
  };

  const getTreatmentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      deworming: 'Дегельминтизация', flea_tick: 'От блох и клещей', ear_cleaning: 'Чистка ушей',
      teeth_cleaning: 'Чистка зубов', grooming: 'Груминг', other: 'Другое',
    };
    return types[type] || type;
  };

  const getMedicalRecordTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      examination: 'Осмотр', surgery: 'Операция', analysis: 'Анализы',
      treatment: 'Лечение', injury: 'Травма', other: 'Другое',
    };
    return types[type] || 'Осмотр';
  };

  const handleSaveVaccination = async () => {
    if (!newVaccination.date || !newVaccination.vaccine_name) return alert('Заполните дату и название');
    
    const apiBase = apiUrl.split('/pets/')[0];
    const url = editingVaccination 
      ? `${apiBase}/vaccinations/${editingVaccination.id}`
      : `${apiUrl}/vaccinations`;
    const method = editingVaccination ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(newVaccination),
      });
      if (res.ok) {
        await fetchVaccinations();
        setShowAddVaccination(false);
        setEditingVaccination(null);
      } else {
        const data = await res.json();
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить'));
      }
    } catch (e) { alert('Ошибка соединения'); }
  };

  const handleDeleteVaccination = async (id: number) => {
    if (!confirm('Удалить эту прививку?')) return;
    try {
      const apiBase = apiUrl.split('/pets/')[0];
      const res = await fetch(`${apiBase}/vaccinations/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchVaccinations();
    } catch (e) { alert('Ошибка соединения'); }
  };

  const handleSaveTreatment = async () => {
    if (!newTreatment.date || !newTreatment.product_name) return alert('Заполните дату и название препарата');
    
    const apiBase = apiUrl.split('/pets/')[0];
    const url = editingTreatment 
      ? `${apiBase}/treatments/${editingTreatment.id}`
      : `${apiUrl}/treatments`;
    const method = editingTreatment ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(newTreatment),
      });
      if (res.ok) {
        await fetchTreatments();
        setShowAddTreatment(false);
        setEditingTreatment(null);
      } else {
        const data = await res.json();
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить'));
      }
    } catch (e) { alert('Ошибка соединения'); }
  };

  const handleDeleteTreatment = async (id: number) => {
    if (!confirm('Удалить эту обработку?')) return;
    try {
      const apiBase = apiUrl.split('/pets/')[0];
      const res = await fetch(`${apiBase}/treatments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchTreatments();
    } catch (e) { alert('Ошибка соединения'); }
  };

  const handleSaveMedicalRecord = async () => {
    if (!newMedicalRecord.date || !newMedicalRecord.title) return alert('Заполните дату и название');
    
    const apiBase = apiUrl.split('/pets/')[0];
    const url = editingMedicalRecord 
      ? `${apiBase}/medical-records/${editingMedicalRecord.id}`
      : `${apiUrl}/medical-records`;
    const method = editingMedicalRecord ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(newMedicalRecord),
      });
      if (res.ok) {
        await fetchMedicalRecords();
        setShowAddMedicalRecord(false);
        setEditingMedicalRecord(null);
      } else {
        const data = await res.json();
        alert('Ошибка: ' + (data.error || 'Не удалось сохранить'));
      }
    } catch (e) { alert('Ошибка соединения'); }
  };

  const handleDeleteMedicalRecord = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return;
    try {
      const apiBase = apiUrl.split('/pets/')[0];
      const res = await fetch(`${apiBase}/medical-records/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchMedicalRecords();
    } catch (e) { alert('Ошибка соединения'); }
  };

  const inputClass = "w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Базовые показатели здоровья */}
      <Card>
        <CardHeader>
          <CardTitle>Общие параметры</CardTitle>
          <CardDescription>Базовые показатели здоровья питомца</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col border-b border-gray-100 pb-2">
              <div className="text-[13px] text-gray-500 mb-1 leading-none">Вес (кг)</div>
              <InlineEdit
                type="number"
                value={pet.weight ? String(pet.weight) : ''}
                placeholder="Введите вес"
                onSave={(val) => {
                  const num = parseFloat(val);
                  saveBaseField({ weight: isNaN(num) ? null : num });
                }}
              />
            </div>
            <div className="flex flex-col border-b border-gray-100 pb-2">
              <div className="text-[13px] text-gray-500 mb-1 leading-none">Особенности здоровья</div>
              <InlineEdit
                type="textarea"
                value={pet.health_notes || ''}
                placeholder="Аллергии, хронические заболевания..."
                onSave={(val) => saveBaseField({ health_notes: val })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Прививки */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Вакцинации</CardTitle>
            <CardDescription>История прививок питомца</CardDescription>
          </div>
          <Button 
            variant={showAddVaccination ? "outline" : "default"}
            onClick={() => {
              setEditingVaccination(null);
              setNewVaccination({ date: '', vaccine_name: '', vaccine_type: 'rabies', next_date: '', veterinarian: '', clinic: '', notes: '' });
              setShowAddVaccination(!showAddVaccination);
            }}
          >
            {showAddVaccination ? '✕ Отмена' : '+ Добавить прививку'}
          </Button>
        </CardHeader>
        <CardContent>
          {showAddVaccination && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-6 animate-in fade-in zoom-in-95 duration-200">
              <h4 className="font-semibold text-gray-900 mb-4">{editingVaccination ? 'Редактировать прививку' : 'Новая прививка'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateField label="Дата" required value={newVaccination.date} onChange={v => setNewVaccination({...newVaccination, date: v})} />
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Тип вакцины</label>
                  <select className={inputClass} value={newVaccination.vaccine_type} onChange={e => setNewVaccination({...newVaccination, vaccine_type: e.target.value})}>
                    <option value="rabies">Бешенство</option><option value="distemper">Чума</option>
                    <option value="parvovirus">Парвовирус</option><option value="hepatitis">Гепатит</option>
                    <option value="leptospirosis">Лептоспироз</option><option value="complex">Комплексная</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Название вакцины*</label>
                  <input type="text" className={inputClass} placeholder="Нобивак Rabies" value={newVaccination.vaccine_name} onChange={e => setNewVaccination({...newVaccination, vaccine_name: e.target.value})} />
                </div>
                <DateField label="Следующая (дата)" value={newVaccination.next_date || ''} onChange={v => setNewVaccination({...newVaccination, next_date: v})} />
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Ветеринар</label>
                  <input type="text" className={inputClass} value={newVaccination.veterinarian || ''} onChange={e => setNewVaccination({...newVaccination, veterinarian: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Клиника</label>
                  <input type="text" className={inputClass} value={newVaccination.clinic || ''} onChange={e => setNewVaccination({...newVaccination, clinic: e.target.value})} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Примечания</label>
                  <input type="text" className={inputClass} value={newVaccination.notes || ''} onChange={e => setNewVaccination({...newVaccination, notes: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleSaveVaccination}>Сохранить</Button>
                <Button variant="outline" onClick={() => setShowAddVaccination(false)}>Отмена</Button>
              </div>
            </div>
          )}

          {vaccinations.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed rounded-xl">Нет записей о вакцинациях</div>
          ) : (
            <div className="rounded-xl border shadow-sm overflow-hidden">
              <table className="hidden sm:table w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-left">Дата</th>
                    <th className="px-4 py-3 font-medium text-left">Тип</th>
                    <th className="px-4 py-3 font-medium text-left">Вакцина</th>
                    <th className="px-4 py-3 font-medium text-left">Следующая</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vaccinations.map((vac) => (
                    <tr key={vac.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{new Date(vac.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="font-normal">{getVaccineTypeLabel(vac.vaccine_type)}</Badge></td>
                      <td className="px-4 py-3 font-medium text-gray-900">{vac.vaccine_name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{vac.next_date ? new Date(vac.next_date).toLocaleDateString('ru-RU') : '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => { setEditingVaccination(vac); setNewVaccination(vac); setShowAddVaccination(true); }} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Ред.</button>
                        <button onClick={() => handleDeleteVaccination(vac.id!)} className="text-red-500 hover:text-red-700 font-medium">Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:hidden divide-y">
                {vaccinations.map((vac) => (
                  <div key={vac.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 text-base">{vac.vaccine_name}</div>
                        <Badge variant="secondary" className="mt-1 font-normal text-xs">{getVaccineTypeLabel(vac.vaccine_type)}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(vac.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                    {vac.next_date && (
                      <div className="text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                        Следующая: <strong>{new Date(vac.next_date).toLocaleDateString('ru-RU')}</strong>
                      </div>
                    )}
                    <div className="flex gap-4 pt-2 border-t text-sm">
                      <button onClick={() => { setEditingVaccination(vac); setNewVaccination(vac); setShowAddVaccination(true); }} className="text-blue-600 font-medium">Редактировать</button>
                      <button onClick={() => handleDeleteVaccination(vac.id!)} className="text-red-500 font-medium">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Обработки */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Обработки от паразитов</CardTitle>
            <CardDescription>Дегельминтизация, от блох/клещей и прочее</CardDescription>
          </div>
          <Button 
            variant={showAddTreatment ? "outline" : "default"}
            onClick={() => {
              setEditingTreatment(null);
              setNewTreatment({ date: '', treatment_type: 'deworming', product_name: '', next_date: '', dosage: '', notes: '' });
              setShowAddTreatment(!showAddTreatment);
            }}
          >
            {showAddTreatment ? '✕ Отмена' : '+ Добавить обработку'}
          </Button>
        </CardHeader>
        <CardContent>
          {showAddTreatment && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-6 animate-in fade-in zoom-in-95 duration-200">
              <h4 className="font-semibold text-gray-900 mb-4">{editingTreatment ? 'Редактировать обработку' : 'Новая обработка'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateField label="Дата" required value={newTreatment.date} onChange={v => setNewTreatment({...newTreatment, date: v})} />
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Тип обработки</label>
                  <select className={inputClass} value={newTreatment.treatment_type} onChange={e => setNewTreatment({...newTreatment, treatment_type: e.target.value})}>
                    <option value="deworming">Дегельминтизация</option><option value="flea_tick">От блох и клещей</option>
                    <option value="ear_cleaning">Чистка ушей</option><option value="teeth_cleaning">Чистка зубов</option>
                    <option value="grooming">Груминг</option><option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Препарат*</label>
                  <input type="text" className={inputClass} placeholder="Симпарика, Мильбемакс" value={newTreatment.product_name} onChange={e => setNewTreatment({...newTreatment, product_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Дозировка</label>
                  <input type="text" className={inputClass} value={newTreatment.dosage || ''} onChange={e => setNewTreatment({...newTreatment, dosage: e.target.value})} />
                </div>
                <DateField label="Следующая обработка" value={newTreatment.next_date || ''} onChange={v => setNewTreatment({...newTreatment, next_date: v})} />
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Примечания</label>
                  <input type="text" className={inputClass} value={newTreatment.notes || ''} onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleSaveTreatment}>Сохранить</Button>
                <Button variant="outline" onClick={() => setShowAddTreatment(false)}>Отмена</Button>
              </div>
            </div>
          )}

          {treatments.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed rounded-xl">Нет записей об обработках</div>
          ) : (
            <div className="rounded-xl border shadow-sm overflow-hidden">
              <table className="hidden sm:table w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-left">Дата</th>
                    <th className="px-4 py-3 font-medium text-left">Тип</th>
                    <th className="px-4 py-3 font-medium text-left">Препарат</th>
                    <th className="px-4 py-3 font-medium text-left">Доза</th>
                    <th className="px-4 py-3 font-medium text-left">Следующая</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {treatments.map((tr) => (
                    <tr key={tr.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{new Date(tr.date).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{getTreatmentTypeLabel(tr.treatment_type)}</Badge></td>
                      <td className="px-4 py-3 font-medium text-gray-900">{tr.product_name}</td>
                      <td className="px-4 py-3 text-gray-600">{tr.dosage || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{tr.next_date ? new Date(tr.next_date).toLocaleDateString('ru-RU') : '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => { setEditingTreatment(tr); setNewTreatment(tr); setShowAddTreatment(true); }} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Ред.</button>
                        <button onClick={() => handleDeleteTreatment(tr.id!)} className="text-red-500 hover:text-red-700 font-medium">Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:hidden divide-y">
                {treatments.map((tr) => (
                  <div key={tr.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 text-base">{tr.product_name}</div>
                        <Badge variant="outline" className="mt-1 font-normal text-xs">{getTreatmentTypeLabel(tr.treatment_type)}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">{new Date(tr.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                    {tr.dosage && <div className="text-sm text-gray-600">Дозировка: {tr.dosage}</div>}
                    {tr.next_date && (
                      <div className="text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                        Следующая: <strong>{new Date(tr.next_date).toLocaleDateString('ru-RU')}</strong>
                      </div>
                    )}
                    <div className="flex gap-4 pt-2 border-t text-sm">
                      <button onClick={() => { setEditingTreatment(tr); setNewTreatment(tr); setShowAddTreatment(true); }} className="text-blue-600 font-medium">Редактировать</button>
                      <button onClick={() => handleDeleteTreatment(tr.id!)} className="text-red-500 font-medium">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Медицинские записи */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Медицинская карта</CardTitle>
            <CardDescription>Осмотры, диагнозы, операции и анализы</CardDescription>
          </div>
          <Button 
            variant={showAddMedicalRecord ? "outline" : "default"}
            onClick={() => {
              setEditingMedicalRecord(null);
              setNewMedicalRecord({ date: '', record_type: 'examination', title: '', description: '', veterinarian: '', clinic: '', diagnosis: '', treatment: '', medications: '', cost: undefined });
              setShowAddMedicalRecord(!showAddMedicalRecord);
            }}
          >
            {showAddMedicalRecord ? '✕ Отмена' : '+ Добавить запись'}
          </Button>
        </CardHeader>
        <CardContent>
          {showAddMedicalRecord && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-6 animate-in fade-in zoom-in-95 duration-200">
              <h4 className="font-semibold text-gray-900 mb-4">{editingMedicalRecord ? 'Редактировать запись' : 'Новая мед. запись'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateField label="Дата" required value={newMedicalRecord.date} onChange={v => setNewMedicalRecord({...newMedicalRecord, date: v})} />
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Категория</label>
                  <select className={inputClass} value={newMedicalRecord.record_type} onChange={e => setNewMedicalRecord({...newMedicalRecord, record_type: e.target.value})}>
                    <option value="examination">Осмотр</option><option value="surgery">Операция</option>
                    <option value="analysis">Анализы</option><option value="treatment">Лечение</option>
                    <option value="injury">Травма</option><option value="other">Другое</option>
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Название (повод обращения)*</label>
                  <input type="text" className={inputClass} placeholder="Первичный прием, хромота" value={newMedicalRecord.title} onChange={e => setNewMedicalRecord({...newMedicalRecord, title: e.target.value})} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Диагноз (если есть)</label>
                  <input type="text" className={inputClass} value={newMedicalRecord.diagnosis || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, diagnosis: e.target.value})} />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Назначения и лечение</label>
                  <textarea rows={3} className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y" placeholder="Прописаны препараты, диета" value={newMedicalRecord.treatment || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, treatment: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Ветеринар</label>
                  <input type="text" className={inputClass} value={newMedicalRecord.veterinarian || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, veterinarian: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Клиника</label>
                  <input type="text" className={inputClass} value={newMedicalRecord.clinic || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, clinic: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleSaveMedicalRecord}>Сохранить</Button>
                <Button variant="outline" onClick={() => setShowAddMedicalRecord(false)}>Отмена</Button>
              </div>
            </div>
          )}

          {medicalRecords.length === 0 ? (
            <div className="py-8 text-center text-gray-500 border border-dashed rounded-xl">Медицинская карта пуста</div>
          ) : (
            <div className="flex flex-col rounded-xl overflow-hidden border shadow-sm divide-y">
              {medicalRecords.map((mr) => (
                <div key={mr.id} className="p-4 md:p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500 font-medium">{new Date(mr.date).toLocaleDateString('ru-RU')}</span>
                        <Badge variant="secondary" className="font-normal text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100">{getMedicalRecordTypeLabel(mr.record_type)}</Badge>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 m-0">{mr.title}</h4>
                      {mr.diagnosis && <p className="text-sm text-gray-700 m-0"><strong>Диагноз:</strong> {mr.diagnosis}</p>}
                      {mr.treatment && <p className="text-sm text-gray-600 m-0 leading-relaxed"><strong>Лечение:</strong> {mr.treatment}</p>}
                      {(mr.veterinarian || mr.clinic) && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 opacity-80">
                          ⚕️ {mr.veterinarian || 'Врач не указан'} {mr.clinic && `🏥 ${mr.clinic}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 ml-4">
                      <button onClick={() => { setEditingMedicalRecord(mr); setNewMedicalRecord(mr); setShowAddMedicalRecord(true); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ред.</button>
                      <button onClick={() => handleDeleteMedicalRecord(mr.id!)} className="text-red-500 hover:text-red-700 text-sm font-medium">Удал.</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
