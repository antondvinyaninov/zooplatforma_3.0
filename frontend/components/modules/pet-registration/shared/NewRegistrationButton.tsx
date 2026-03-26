'use client';

import { useState } from 'react';
import Link from 'next/link';
import RegistrationWizard from '../list/RegistrationWizard';

interface Props {
  orgId: string;
  onSuccess?: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 14,
  outline: 'none',
  background: '#f9fafb',
  boxSizing: 'border-box',
};

const calculateAge = (pet: any) => {
  const getPlural = (n: number, forms: [string, string, string]) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  };

  if (pet.age_type === 'approximate' && pet.approximate_years !== undefined && pet.approximate_months !== undefined) {
    const y = pet.approximate_years;
    const m = pet.approximate_months;
    if (y === 0 && m === 0) return 'Меньше месяца';
    const yStr = y > 0 ? `${y} ${getPlural(y, ['год', 'года', 'лет'])}` : '';
    const mStr = m > 0 ? `${m} ${getPlural(m, ['месяц', 'месяца', 'месяцев'])}` : '';
    return [yStr, mStr].filter(Boolean).join(' ');
  }
  if (pet.birth_date && pet.birth_date !== '') {
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (years <= 0 && months <= 0) return 'Меньше месяца';
    const yStr = years > 0 ? `${years} ${getPlural(years, ['год', 'года', 'лет'])}` : '';
    const mStr = months > 0 ? `${months} ${getPlural(months, ['месяц', 'месяца', 'месяцев'])}` : '';
    return [yStr, mStr].filter(Boolean).join(' ');
  }
  return '';
};

export default function NewRegistrationButton({ orgId, onSuccess }: Props) {
  const [step, setStep] = useState<'idle' | 'search' | 'preview' | 'wizard'>('idle');
  const [petIdInput, setPetIdInput] = useState('');
  const [petInfo, setPetInfo] = useState<{ 
    id: number; name: string; photo_url?: string; species_name?: string; 
    breed_name?: string; birth_date?: string; age_type?: string; approximate_years?: number; approximate_months?: number;
    brand_number?: string; tag_number?: string; chip_number?: string;
    owner_id?: number; owner_name?: string; owner_avatar?: string;
    curator_id?: number; curator_name?: string; curator_avatar?: string;
    org_id?: number; org_name?: string; org_logo?: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const searchPet = async () => {
    const id = parseInt(petIdInput);
    if (!id) { setSearchError('Введите корректный ID питомца'); return; }
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/org/${orgId}/registrations/pet-info/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.pet) {
        setPetInfo({
          id: data.pet.id,
          name: data.pet.name,
          photo_url: data.pet.photo_url || data.pet.media_urls?.[0],
          species_name: data.pet.species_name,
          breed_name: data.pet.breed_name,
          birth_date: data.pet.birth_date,
          age_type: data.pet.age_type,
          approximate_years: data.pet.approximate_years,
          approximate_months: data.pet.approximate_months,
          brand_number: data.pet.brand_number,
          tag_number: data.pet.tag_number,
          chip_number: data.pet.chip_number,
          owner_id: data.pet.owner_id,
          owner_name: data.pet.owner_name,
          owner_avatar: data.pet.owner_avatar,
          curator_id: data.pet.curator_id,
          curator_name: data.pet.curator_name,
          curator_avatar: data.pet.curator_avatar,
          org_id: data.pet.org_id,
          org_name: data.pet.org_name,
          org_logo: data.pet.org_logo,
        });
        setStep('preview');
      } else {
        setSearchError(data.error || 'Питомец не найден в базе данных');
      }
    } catch {
      setSearchError('Ошибка подключения');
    } finally {
      setSearching(false);
    }
  };

  const handleClose = () => {
    setStep('idle');
    setPetIdInput('');
    setPetInfo(null);
    setSearchError('');
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  return (
    <>
      <button
        onClick={() => setStep('search')}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        Зарегистрировать питомца
      </button>

      {/* Шаг 1: поиск питомца по ID */}
      {step === 'search' && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={handleClose}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, padding: 28, width: 400, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Найти питомца</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Введите глобальный ID питомца</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
                ID питомца
              </label>
              <input
                style={inputStyle}
                type="number"
                placeholder="Например: 87"
                value={petIdInput}
                onChange={e => { setPetIdInput(e.target.value); setSearchError(''); }}
                onKeyDown={e => e.key === 'Enter' && searchPet()}
                autoFocus
              />
              {searchError && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#ef4444', padding: '6px 10px', background: '#fef2f2', borderRadius: 6 }}>
                  {searchError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handleClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 500, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                Отмена
              </button>
              <button
                onClick={searchPet}
                disabled={searching || !petIdInput}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: searching || !petIdInput ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                {searching ? 'Поиск...' : 'Найти →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 1.5: превью найденного питомца */}
      {step === 'preview' && petInfo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={handleClose}
        >
          <div
            style={{ background: '#fff', borderRadius: 20, padding: 28, width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Питомец найден</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Подтвердите, что это правильное животное</p>
              </div>
            </div>

            <div style={{
              background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16,
              display: 'flex', gap: 16, border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden'
              }}>
                {petInfo.photo_url ? (
                  <img src={petInfo.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '🐾'}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                  <Link
                    href={`/pets/${petInfo.id}`}
                    target="_blank"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {petInfo.name || 'Без клички'}
                  </Link>{' '}
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>#{petInfo.id}</span>
                </div>
                <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{petInfo.species_name || 'Неизвестный вид'}</span>
                  {petInfo.breed_name ? (
                    <>
                      <span style={{ color: '#d1d5db' }}>•</span>
                      <span>{petInfo.breed_name}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#d1d5db' }}>•</span>
                      <span style={{ color: '#9ca3af' }}>Б/П</span>
                    </>
                  )}
                  {calculateAge(petInfo) && (
                    <>
                      <span style={{ color: '#d1d5db' }}>•</span>
                      <span>{calculateAge(petInfo)}</span>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
                  <div style={
                    petInfo.tag_number 
                      ? { background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }
                      : { background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }
                  }>
                    Бирка: {petInfo.tag_number || 'Отсутствует'}
                  </div>

                  <div style={
                    petInfo.brand_number 
                      ? { background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }
                      : { background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }
                  }>
                    Клеймо: {petInfo.brand_number || 'Отсутствует'}
                  </div>

                  <div style={
                    petInfo.chip_number 
                      ? { background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }
                      : { background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }
                  }>
                    Чип: {petInfo.chip_number || 'Отсутствует'}
                  </div>
                </div>
              </div>
            </div>

            {/* Блок ответственного лица */}
            {(petInfo.org_name || petInfo.curator_name || petInfo.owner_name) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                  Ответственное лицо
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: '#fff', 
                  padding: 12, borderRadius: 12, border: '1px solid #e5e7eb'
                }}>
                  {petInfo.curator_name ? (
                    <>
                      {petInfo.curator_avatar ? (
                        <img src={petInfo.curator_avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Куратор</div>
                        <a href={`/main/${petInfo.curator_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                          {petInfo.curator_name}
                        </a>
                      </div>
                    </>
                  ) : petInfo.org_name ? (
                    <>
                      {petInfo.org_logo ? (
                        <img src={petInfo.org_logo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏢</div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Опекун</div>
                        <a href={`/orgs/${petInfo.org_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                          {petInfo.org_name}
                        </a>
                      </div>
                    </>
                  ) : petInfo.owner_name ? (
                    <>
                      {petInfo.owner_avatar ? (
                        <img src={petInfo.owner_avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Владелец</div>
                        <a href={`/main/${petInfo.owner_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                          {petInfo.owner_name}
                        </a>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('search')} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 500, fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                Назад к поиску
              </button>
              <button
                onClick={() => setStep('wizard')}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Регистрация
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 2: форма регистрации */}
      {step === 'wizard' && petInfo && (
        <RegistrationWizard
          petId={petInfo.id}
          pet={petInfo}
          orgId={orgId}
          onClose={handleClose}
          onBack={() => setStep('preview')}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
