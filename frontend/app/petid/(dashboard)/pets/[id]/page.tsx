'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaUpload } from '@/app/main/hooks/useMediaUpload';
import PetNavMenu, { Tab } from '@/components/modules/pets/shared/PetNavMenu';
import PetTimeline from '@/components/modules/pets/profile/PetTimeline';
import PetGeneralInfo from '@/components/modules/pets/profile/PetGeneralInfo';
import PetLocation from '@/components/modules/pets/profile/PetLocation';
import PetIdentification from '@/components/modules/pets/profile/PetIdentification';
import PetHealth from '@/components/modules/pets/profile/PetHealth';
import PetGallery from '@/components/modules/pets/profile/PetGallery';
import { useBreadcrumb } from '@/components/BreadcrumbContext';

// Тип PetDetail (упрощенный, без специфики приюта)
interface PetDetail {
  id: number;
  name: string;
  species_name: string;
  breed_name: string;
  birth_date: string;
  age_type: string;
  approximate_years: number;
  approximate_months: number;
  gender: string;
  description: string;
  photo_url: string;
  media_urls?: string[];
  color: string;
  relationship?: string;
  fur: string;
  ears: string;
  tail: string;
  size: string;
  special_marks: string;
  marking_date: string;
  tag_number: string;
  brand_number: string;
  chip_number: string;
  marking_specialist: string;
  marking_org: string;
  location_type: string;
  location_address: string;
  location_cage: string;
  location_contact: string;
  location_phone: string;
  location_notes: string;
  org_id?: number | null;
  org_name?: string | null;
  weight?: number | null;
  sterilization_date?: string;
  sterilization_specialist?: string;
  sterilization_org?: string;
  sterilization_type?: string;
  health_notes: string;
  created_at: string;
  user_id?: number;
  owner_name?: string;
}

const SIZE_LABELS: Record<string, string> = { small: 'Маленький', medium: 'Средний', large: 'Крупный' };
const DOG_GRADIENT = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
const CAT_GRADIENT = 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)';

export default function PetIDPetCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);
  const orgId = 'petid'; // Фиксируем orgId для PetID, общие компоненты поймут, что это PetID
  
  const router = useRouter();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useMediaUpload();
  const { setItems } = useBreadcrumb();

  useEffect(() => {
    fetch(`/api/petid/pets/${petId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success || data.data || data.pet) {
          const petData = data.data || data.pet || data; 
          setPet(petData);
          setPhotoUrl(petData.photo_url || petData.photo || petData.media_urls?.[0] || '');
          setItems([
            { label: 'Мои питомцы', href: `/petid/pets` },
            { label: petData.name ? `${petData.name} (№${petData.id})` : `Питомец №${petData.id}` },
          ]);
        } else {
          setError(data.error || 'Ошибка');
        }
      })
      .catch(() => setError('Ошибка'))
      .finally(() => setLoading(false));
  }, [petId, setItems]);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pet) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, 'photo');
      if (!uploaded?.url) return;
      const newUrls = [...(pet.media_urls || []), uploaded.url];
      const body: Record<string, unknown> = { media_urls: newUrls };
      if (!photoUrl) body.photo_url = uploaded.url;
      await fetch(`/api/petid/pets/${pet.id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      pet.media_urls = newUrls;
      if (!photoUrl) setPhotoUrl(uploaded.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } finally {
      setUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontSize: 13 }}>
      Загрузка...
    </div>
  );
  if (error || !pet) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😿</div>
      <div style={{ color: '#6b7280', fontSize: 14 }}>{error || 'Питомец не найден'}</div>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
        ← Назад к списку
      </button>
    </div>
  );

  const isdog = pet.species_name === 'Собака' || pet.species_name?.toLowerCase() === 'собака';
  const gradient = isdog ? DOG_GRADIENT : CAT_GRADIENT;

  const formatAge = () => {
    if (pet.age_type === 'approximate') {
      const parts = [];
      if (pet.approximate_years > 0) parts.push(`${pet.approximate_years} лет`);
      if (pet.approximate_months > 0) parts.push(`${pet.approximate_months} мес.`);
      return parts.length ? `~${parts.join(' ')}` : null;
    }
    if (pet.birth_date) {
      const diff = Date.now() - new Date(pet.birth_date).getTime();
      const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
      const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
      if (years > 0) return `${years} л. ${months} мес.`;
      if (months > 0) return `${months} мес.`;
    }
    return null;
  };

  const ageStr = formatAge();

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string | null }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 32, fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, fontSize: 13, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: value ? '#111827' : '#d1d5db' }}>{value || '—'}</div>
    </div>
  );

  const renderCenter = () => {
    switch (activeTab) {
      case 'timeline':       return <PetTimeline pet={pet} orgId={orgId} />;
      case 'general':        return <PetGeneralInfo pet={pet} orgId={orgId} onUpdate={(u) => setPet({ ...pet, ...u })} />;
      case 'identification': return <PetIdentification pet={pet} orgId={orgId} onUpdate={(u: any) => setPet({ ...pet, ...u })} />;
      case 'health':         return <PetHealth pet={pet} orgId={orgId} onUpdate={(u) => setPet({ ...pet, ...u })} />;
      case 'gallery':        return <PetGallery pet={pet} orgId={orgId} onPhotoUrlChange={setPhotoUrl} />;
      case 'fundraising':    return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 1px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Сбор средств</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Данный функционал пока недоступен для частных лиц.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 32 }}>
      {/* Основной грид */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* Левая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Фото */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: 260, background: (photoUrl) ? '#000' : gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100,
              position: 'relative',
            }}>
              {photoUrl
                ? <img src={photoUrl} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (isdog ? '🐕' : '🐈')}
              <span style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#374151',
              }}>
                №{pet.id}
              </span>
            </div>
            <div style={{ padding: '16px 16px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 4 }}>{pet.name}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {pet.species_name || (isdog ? 'Собака' : 'Кошка')}{pet.breed_name ? ` · ${pet.breed_name}` : ''}
              </div>
            </div>
            <div style={{ padding: '0 12px 12px' }}>
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                onMouseEnter={e => {
                  if (!uploading) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f0f9ff';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd';
                    (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                }}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8,
                  border: uploadSuccess ? '1px solid #86efac' : '1px dashed #d1d5db',
                  background: uploadSuccess ? '#f0fdf4' : uploading ? '#f9fafb' : 'transparent',
                  fontSize: 12,
                  color: uploadSuccess ? '#16a34a' : uploading ? '#9ca3af' : '#6b7280',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {uploadSuccess ? '✓ Фото загружено' : uploading ? 'Загрузка...' : '+ Загрузить фото'}
              </button>
              <input
                ref={uploadInputRef}
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={handleQuickUpload}
              />
            </div>
          </div>

          {/* Навигационное меню: прячем "Сбор средств", так как он для НКО */}
          <PetNavMenu activeTab={activeTab} onChange={setActiveTab} showFundraising={false} />
        </div>

        {/* Центральная колонка */}
        <div>{renderCenter()}</div>

        {/* Правая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Действия */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 12px rgba(0,0,0,0.08)', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Действия</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                <button 
                  onClick={async () => {
                    if (confirm('Вы уверены, что хотите удалить карточку питомца? Это действие необратимо.')) {
                      try {
                        const res = await fetch(`/api/petid/pets/${petId}`, { method: 'DELETE' });
                        if (res.ok) {
                          router.push(`/petid/pets`);
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Ошибка при удалении');
                        }
                      } catch (e) {
                        alert('Ошибка сети при удалении');
                      }
                    }
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                >
                  🗑 Удалить карточку
                </button>
              </div>
            </div>

            {/* Инфо */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 12px rgba(0,0,0,0.08)', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Инфо</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>ID записи</div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>#{pet.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>Добавлен</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {new Date(pet.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>Ответственный</div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    {pet.org_id ? (
                      <span>Организация (<a href={`/orgs/${pet.org_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{pet.org_name || 'Профиль'}</a>)</span>
                    ) : pet.user_id ? (
                      <span>{pet.relationship === 'curator' ? 'Куратор' : pet.relationship === 'guardian' ? 'Опекун' : 'Владелец'} (<a href={`/main/${pet.user_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>{pet.owner_name || 'Профиль'}</a>)</span>
                    ) : (
                      pet.relationship === 'curator' ? 'Куратор' : pet.relationship === 'guardian' ? 'Опекун' : 'Владелец'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Основное */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 12px rgba(0,0,0,0.08)', padding: '16px 16px 8px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Основное</div>
              <InfoRow icon="⚧" label="Пол" value={pet.gender === 'male' ? 'Самец ♂' : 'Самка ♀'} />
              {ageStr && <InfoRow icon="🎂" label="Возраст" value={ageStr} />}
              <InfoRow icon="📏" label="Размер" value={pet.size ? SIZE_LABELS[pet.size] : null} />
              <InfoRow icon="🎨" label="Окрас" value={pet.color} />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
