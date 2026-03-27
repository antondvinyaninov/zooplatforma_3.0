'use client';
import React, { useState, useEffect } from 'react';
import s from '../shared/pet-card.module.css';

interface PetHealthProps {
  pet: {
    id: number;
    weight?: number | null;
    health_notes: string;
  };
  orgId: string;
  onUpdate: (updates: Record<string, any>) => void;
}

// Interfaces for Health entities
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

interface Treatment {
  id?: number;
  date: string;
  treatment_type: string;
  product_name: string;
  next_date?: string;
  dosage?: string;
  notes?: string;
}

export default function PetHealth({ pet, orgId, onUpdate }: PetHealthProps) {
  // State for Weight editing
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightValue, setWeightValue] = useState(pet.weight ? String(pet.weight) : '');

  // State for Health Notes editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(pet.health_notes || '');

  // Main Entities State
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  // Modals & Forms State
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

  // Fetch logic
  const [loading, setLoading] = useState(true);
  
  const fetchVaccinations = async () => {
    try {
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const response = await fetch(`${apiBase}/pets/${pet.id}/vaccinations`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setVaccinations(data.vaccinations || []);
      }
    } catch (e) { console.error('Ошибка загрузки вакцин', e); }
  };

  const fetchTreatments = async () => {
    try {
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const response = await fetch(`${apiBase}/pets/${pet.id}/treatments`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTreatments(data.treatments || []);
      }
    } catch (e) { console.error('Ошибка загрузки обработок', e); }
  };

  const fetchMedicalRecords = async () => {
    try {
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const response = await fetch(`${apiBase}/pets/${pet.id}/medical-records`, { credentials: 'include' });
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

  // --- Handlers for Base Info ---
  const saveWeight = async () => {
    const val = parseFloat(weightValue.replace(',', '.'));
    const finalVal = isNaN(val) ? null : val;
    
    try {
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/pets/${pet.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: finalVal })
      });
      if (res.ok) {
        onUpdate({ weight: finalVal });
        setIsEditingWeight(false);
      } else alert('Ошибка сохранения веса');
    } catch (e) { alert('Ошибка соединения'); }
  };
  
  const saveNotes = async () => {
    try {
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/pets/${pet.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ health_notes: notesValue })
      });
      if (res.ok) {
        onUpdate({ health_notes: notesValue });
        setIsEditingNotes(false);
      } else alert('Ошибка сохранения заметок');
    } catch (e) { alert('Ошибка соединения'); }
  };

  // --- Helpers for Dictionaries ---
  const getVaccineTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      rabies: '🦠 Бешенство', distemper: '🦠 Чума', parvovirus: '🦠 Парвовирус',
      hepatitis: '🦠 Гепатит', leptospirosis: '🦠 Лептоспироз', complex: '💉 Комплексная', other: '💊 Другое',
    };
    return types[type] || type;
  };

  const getTreatmentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      deworming: '🪱 Дегельминтизация', flea_tick: '🦟 От блох и клещей', ear_cleaning: '👂 Чистка ушей',
      teeth_cleaning: '🦷 Чистка зубов', grooming: '✂️ Груминг', other: '🧴 Другое',
    };
    return types[type] || type;
  };

  const getMedicalRecordTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      examination: '🔍 Осмотр', surgery: '🏥 Операция', analysis: '🧪 Анализы',
      treatment: '💊 Лечение', injury: '🩹 Травма', other: '📋 Другое',
    };
    return types[type] || '📋';
  };

  // --- CRUD Vaccinations ---
  const handleSaveVaccination = async () => {
    if (!newVaccination.date || !newVaccination.vaccine_name) return alert('Заполните дату и название');
    
    const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
    const url = editingVaccination 
      ? `${apiBase}/vaccinations/${editingVaccination.id}`
      : `${apiBase}/pets/${pet.id}/vaccinations`;
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
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/vaccinations/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchVaccinations();
    } catch (e) { alert('Ошибка соединения'); }
  };

  // --- CRUD Treatments ---
  const handleSaveTreatment = async () => {
    if (!newTreatment.date || !newTreatment.product_name) return alert('Заполните дату и название препарата');
    
    const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
    const url = editingTreatment 
      ? `${apiBase}/treatments/${editingTreatment.id}`
      : `${apiBase}/pets/${pet.id}/treatments`;
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
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/treatments/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchTreatments();
    } catch (e) { alert('Ошибка соединения'); }
  };

  // --- CRUD Medical Records ---
  const handleSaveMedicalRecord = async () => {
    if (!newMedicalRecord.date || !newMedicalRecord.title) return alert('Заполните дату и название');
    
    const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
    const url = editingMedicalRecord 
      ? `${apiBase}/medical-records/${editingMedicalRecord.id}`
      : `${apiBase}/pets/${pet.id}/medical-records`;
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
      const apiBase = orgId === 'petid' ? '/api/petid' : `/api/org/${orgId}`;
      const res = await fetch(`${apiBase}/medical-records/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) fetchMedicalRecords();
    } catch (e) { alert('Ошибка соединения'); }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. Базовые показатели здоровья */}
      <div>
        <div className={s.headerCard}>
          <div className={s.sectionTitle}>Общие параметры</div>
          <div className={s.sectionDesc}>Базовые показатели здоровья питомца</div>
        </div>
        <div className={s.card}>
          <div className={s.grid2}>
            {/* Вес */}
            <div className={s.fieldWrapper} style={{ cursor: 'pointer' }} onClick={() => setIsEditingWeight(true)}>
              <div className={s.fieldLabel}>⚖️ Вес (кг)</div>
              {isEditingWeight ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="number"
                    step="0.1"
                    className={s.inputNode}
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    autoFocus
                    onBlur={saveWeight}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveWeight();
                      if (e.key === 'Escape') setIsEditingWeight(false);
                    }}
                  />
                </div>
              ) : (
                <div className={s.fieldValue}>{pet.weight != null ? `${pet.weight} кг` : <span style={{ color: '#9ca3af' }}>Не указан</span>}</div>
              )}
            </div>
            
            {/* Особенности здоровья */}
            <div className={s.fieldWrapper} style={{ cursor: 'pointer' }} onClick={() => setIsEditingNotes(true)}>
              <div className={s.fieldLabel}>🩺 Особенности здоровья</div>
              {isEditingNotes ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    className={s.inputNode}
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    autoFocus
                    onBlur={saveNotes}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveNotes();
                      if (e.key === 'Escape') setIsEditingNotes(false);
                    }}
                  />
                </div>
              ) : (
                <div className={s.fieldValue}>
                  {pet.health_notes || <span style={{ color: '#9ca3af' }}>Нет особенностей</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Прививки */}
      <div style={{ marginTop: 24 }}>
        <div className={`${s.headerCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <div>
            <div className={s.sectionTitle}>Вакцинации</div>
            <div className={s.sectionDesc}>История прививок питомца</div>
          </div>
          <button
            className={s.primaryBtn}
            onClick={() => {
              setEditingVaccination(null);
              setNewVaccination({ date: '', vaccine_name: '', vaccine_type: 'rabies', next_date: '', veterinarian: '', clinic: '', notes: '' });
              setShowAddVaccination(!showAddVaccination);
            }}
          >
            {showAddVaccination ? '✕ Отмена' : '+ Добавить прививку'}
          </button>
        </div>

        {showAddVaccination && (
          <div className={s.card} style={{ marginBottom: 16, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: '15px' }}>{editingVaccination ? 'Редактировать прививку' : 'Новая прививка'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className={s.fieldLabel}>Дата*</label><input type="date" className={s.inputNode} value={newVaccination.date} onChange={e => setNewVaccination({...newVaccination, date: e.target.value})} /></div>
              <div>
                <label className={s.fieldLabel}>Тип вакцины</label>
                <select className={s.inputNode} value={newVaccination.vaccine_type} onChange={e => setNewVaccination({...newVaccination, vaccine_type: e.target.value})}>
                  <option value="rabies">Бешенство</option><option value="distemper">Чума</option>
                  <option value="parvovirus">Парвовирус</option><option value="hepatitis">Гепатит</option>
                  <option value="leptospirosis">Лептоспироз</option><option value="complex">Комплексная</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <div><label className={s.fieldLabel}>Название вакцины*</label><input type="text" className={s.inputNode} placeholder="Нобивак Rabies" value={newVaccination.vaccine_name} onChange={e => setNewVaccination({...newVaccination, vaccine_name: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Следующая (дата)</label><input type="date" className={s.inputNode} value={newVaccination.next_date || ''} onChange={e => setNewVaccination({...newVaccination, next_date: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Ветеринар</label><input type="text" className={s.inputNode} value={newVaccination.veterinarian || ''} onChange={e => setNewVaccination({...newVaccination, veterinarian: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Клиника</label><input type="text" className={s.inputNode} value={newVaccination.clinic || ''} onChange={e => setNewVaccination({...newVaccination, clinic: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className={s.fieldLabel}>Примечания</label>
                <input type="text" className={s.inputNode} value={newVaccination.notes || ''} onChange={e => setNewVaccination({...newVaccination, notes: e.target.value})} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className={s.primaryBtn} onClick={handleSaveVaccination}>Сохранить</button>
              <button className={s.closeEditorBtn} onClick={() => setShowAddVaccination(false)}>Отмена</button>
            </div>
          </div>
        )}

        <div className={s.card} style={{ padding: 0, overflowX: 'auto' }}>
          {vaccinations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Нет записей о вакцинациях</div>
          ) : (
            <>
              <table className="hidden sm:table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Дата</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Тип</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Вакцина</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Следующая</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((vac) => (
                    <tr key={vac.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', color: '#111827' }}>{new Date(vac.date).toLocaleDateString('ru-RU')}</td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{getVaccineTypeLabel(vac.vaccine_type)}</td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{vac.vaccine_name}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{vac.next_date ? new Date(vac.next_date).toLocaleDateString('ru-RU') : '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => { setEditingVaccination(vac); setNewVaccination(vac); setShowAddVaccination(true); }} style={{ color: '#2563eb', marginRight: 12, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Ред.</button>
                        <button onClick={() => handleDeleteVaccination(vac.id!)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:hidden">
                {vaccinations.map((vac) => (
                  <div key={vac.id} style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{vac.vaccine_name}</span>
                      <span style={{ color: '#6b7280', fontSize: 13 }}>{new Date(vac.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: 14, marginBottom: 4 }}>
                      {getVaccineTypeLabel(vac.vaccine_type)}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                      Следующая: {vac.next_date ? new Date(vac.next_date).toLocaleDateString('ru-RU') : '-'}
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button onClick={() => { setEditingVaccination(vac); setNewVaccination(vac); setShowAddVaccination(true); }} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Ред.</button>
                      <button onClick={() => handleDeleteVaccination(vac.id!)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Обработки */}
      <div style={{ marginTop: 24 }}>
        <div className={`${s.headerCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <div>
            <div className={s.sectionTitle}>Обработки от паразитов</div>
            <div className={s.sectionDesc}>Дегельминтизация, бравекто и т.д.</div>
          </div>
          <button
            className={s.primaryBtn}
            onClick={() => {
              setEditingTreatment(null);
              setNewTreatment({ date: '', treatment_type: 'deworming', product_name: '', next_date: '', dosage: '', notes: '' });
              setShowAddTreatment(!showAddTreatment);
            }}
          >
            {showAddTreatment ? '✕ Отмена' : '+ Добавить обработку'}
          </button>
        </div>

        {showAddTreatment && (
          <div className={s.card} style={{ marginBottom: 16, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: '15px' }}>{editingTreatment ? 'Редактировать обработку' : 'Новая обработка'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className={s.fieldLabel}>Дата*</label><input type="date" className={s.inputNode} value={newTreatment.date} onChange={e => setNewTreatment({...newTreatment, date: e.target.value})} /></div>
              <div>
                <label className={s.fieldLabel}>Тип обработки</label>
                <select className={s.inputNode} value={newTreatment.treatment_type} onChange={e => setNewTreatment({...newTreatment, treatment_type: e.target.value})}>
                  <option value="deworming">Дегельминтизация</option><option value="flea_tick">От блох и клещей</option>
                  <option value="ear_cleaning">Чистка ушей</option><option value="teeth_cleaning">Чистка зубов</option>
                  <option value="grooming">Груминг</option><option value="other">Другое</option>
                </select>
              </div>
              <div><label className={s.fieldLabel}>Препарат*</label><input type="text" className={s.inputNode} placeholder="Симпарика, Мильбемакс" value={newTreatment.product_name} onChange={e => setNewTreatment({...newTreatment, product_name: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Дозировка</label><input type="text" className={s.inputNode} value={newTreatment.dosage || ''} onChange={e => setNewTreatment({...newTreatment, dosage: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Следующая обработка</label><input type="date" className={s.inputNode} value={newTreatment.next_date || ''} onChange={e => setNewTreatment({...newTreatment, next_date: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className={s.fieldLabel}>Примечания</label><input type="text" className={s.inputNode} value={newTreatment.notes || ''} onChange={e => setNewTreatment({...newTreatment, notes: e.target.value})} /></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className={s.primaryBtn} onClick={handleSaveTreatment}>Сохранить</button>
              <button className={s.closeEditorBtn} onClick={() => setShowAddTreatment(false)}>Отмена</button>
            </div>
          </div>
        )}

        <div className={s.card} style={{ padding: 0, overflowX: 'auto' }}>
          {treatments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Нет записей об обработках</div>
          ) : (
            <>
              <table className="hidden sm:table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Дата</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Тип</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Препарат</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Доза</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Следующая</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((tr) => (
                    <tr key={tr.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', color: '#111827' }}>{new Date(tr.date).toLocaleDateString('ru-RU')}</td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{getTreatmentTypeLabel(tr.treatment_type)}</td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{tr.product_name}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{tr.dosage || '-'}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280' }}>{tr.next_date ? new Date(tr.next_date).toLocaleDateString('ru-RU') : '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => { setEditingTreatment(tr); setNewTreatment(tr); setShowAddTreatment(true); }} style={{ color: '#2563eb', marginRight: 12, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Ред.</button>
                        <button onClick={() => handleDeleteTreatment(tr.id!)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Удалить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:hidden">
                {treatments.map((tr) => (
                  <div key={tr.id} style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{tr.product_name}</span>
                      <span style={{ color: '#6b7280', fontSize: 13 }}>{new Date(tr.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: 14, marginBottom: 4 }}>
                      {getTreatmentTypeLabel(tr.treatment_type)} {tr.dosage ? `(Доза: ${tr.dosage})` : ''}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                      Следующая: {tr.next_date ? new Date(tr.next_date).toLocaleDateString('ru-RU') : '-'}
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <button onClick={() => { setEditingTreatment(tr); setNewTreatment(tr); setShowAddTreatment(true); }} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Ред.</button>
                      <button onClick={() => handleDeleteTreatment(tr.id!)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Медицинские записи */}
      <div style={{ marginTop: 24 }}>
        <div className={`${s.headerCard} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <div>
            <div className={s.sectionTitle}>Медицинская карта</div>
            <div className={s.sectionDesc}>Осмотры, диагнозы, операции</div>
          </div>
          <button
            className={s.primaryBtn}
            onClick={() => {
              setEditingMedicalRecord(null);
              setNewMedicalRecord({ date: '', record_type: 'examination', title: '', description: '', veterinarian: '', clinic: '', diagnosis: '', treatment: '', medications: '', cost: undefined });
              setShowAddMedicalRecord(!showAddMedicalRecord);
            }}
          >
            {showAddMedicalRecord ? '✕ Отмена' : '+ Добавить запись'}
          </button>
        </div>

        {showAddMedicalRecord && (
          <div className={s.card} style={{ marginBottom: 16, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 16, fontSize: '15px' }}>{editingMedicalRecord ? 'Редактировать запись' : 'Новая мед. запись'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div><label className={s.fieldLabel}>Дата*</label><input type="date" className={s.inputNode} value={newMedicalRecord.date} onChange={e => setNewMedicalRecord({...newMedicalRecord, date: e.target.value})} /></div>
              <div>
                <label className={s.fieldLabel}>Категория</label>
                <select className={s.inputNode} value={newMedicalRecord.record_type} onChange={e => setNewMedicalRecord({...newMedicalRecord, record_type: e.target.value})}>
                  <option value="examination">Осмотр</option><option value="surgery">Операция</option>
                  <option value="analysis">Анализы</option><option value="treatment">Лечение</option>
                  <option value="injury">Травма</option><option value="other">Другое</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className={s.fieldLabel}>Название (повод обращения)*</label><input type="text" className={s.inputNode} placeholder="Первичный прием, хромота" value={newMedicalRecord.title} onChange={e => setNewMedicalRecord({...newMedicalRecord, title: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className={s.fieldLabel}>Диагноз</label><input type="text" className={s.inputNode} value={newMedicalRecord.diagnosis || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, diagnosis: e.target.value})} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className={s.fieldLabel}>Назначения и лечение</label><input type="text" className={s.inputNode} placeholder="Прописаны препараты, диета" value={newMedicalRecord.treatment || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, treatment: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Ветеринар</label><input type="text" className={s.inputNode} value={newMedicalRecord.veterinarian || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, veterinarian: e.target.value})} /></div>
              <div><label className={s.fieldLabel}>Клиника</label><input type="text" className={s.inputNode} value={newMedicalRecord.clinic || ''} onChange={e => setNewMedicalRecord({...newMedicalRecord, clinic: e.target.value})} /></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className={s.primaryBtn} onClick={handleSaveMedicalRecord}>Сохранить</button>
              <button className={s.closeEditorBtn} onClick={() => setShowAddMedicalRecord(false)}>Отмена</button>
            </div>
          </div>
        )}

        <div className={s.card} style={{ padding: 0, overflowX: 'auto' }}>
          {medicalRecords.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Медицинская карта пуста</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {medicalRecords.map((mr, index) => (
                <div key={mr.id} style={{ padding: '16px 20px', borderBottom: index < medicalRecords.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{new Date(mr.date).toLocaleDateString('ru-RU')}</span>
                        <span style={{ fontSize: 12, padding: '2px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: 12, fontWeight: 500 }}>{getMedicalRecordTypeLabel(mr.record_type)}</span>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#111827' }}>{mr.title}</h4>
                      {mr.diagnosis && <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#374151' }}><strong>Диагноз:</strong> {mr.diagnosis}</p>}
                      {mr.treatment && <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#4b5563' }}><strong>Лечение:</strong> {mr.treatment}</p>}
                      {(mr.veterinarian || mr.clinic) && (
                        <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#6b7280' }}>
                          👨‍⚕️ {mr.veterinarian || 'Врач не указан'} {mr.clinic && `🏥 ${mr.clinic}`}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => { setEditingMedicalRecord(mr); setNewMedicalRecord(mr); setShowAddMedicalRecord(true); }} style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Ред.</button>
                      <button onClick={() => handleDeleteMedicalRecord(mr.id!)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Удал.</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
