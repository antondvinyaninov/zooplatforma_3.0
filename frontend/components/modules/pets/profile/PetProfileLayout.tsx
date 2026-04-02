'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMediaUpload } from '@/app/main/hooks/useMediaUpload';
import PetNavMenu, { Tab } from '@/components/modules/pets/shared/PetNavMenu';
import PetTimeline from '@/components/modules/pets/profile/PetTimeline';
import PetGeneralInfo from '@/components/modules/pets/profile/PetGeneralInfo';

import PetIdentification from '@/components/modules/pets/profile/PetIdentification';
import PetHealth from '@/components/modules/pets/profile/PetHealth';
import PetGallery from '@/components/modules/pets/profile/PetGallery';
import { useBreadcrumb } from '@/components/BreadcrumbContext';

export interface PetDetail {
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
  org_pet_number?: string | null;
  city?: string | null;
  actual_city?: any;
  weight?: number | null;
  sterilization_date?: string;
  sterilization_specialist?: string;
  sterilization_org?: string;
  sterilization_type?: string;
  health_notes: string;
  created_at: string;
  user_id?: number;
  owner_name?: string;
  catalog_status?: string;
  catalog_data?: any;
}

const SIZE_LABELS: Record<string, string> = { small: 'Маленький', medium: 'Средний', large: 'Крупный' };
const DOG_GRADIENT = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
const CAT_GRADIENT = 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)';

interface PetProfileLayoutProps {
  petId: string;
  apiUrl: string; // Endpoint to GET, PUT and DELETE the pet e.g. /api/owner/pets/{petId}
  orgId: string;  // Context e.g. 'owner', 'pethelper', 'petid', or actual org ID
  backUrl: string; // e.g. /owner/pets
  backUrlLabel: string; // e.g. "Мои питомцы"
  showFundraising?: boolean;
  catalogToggle?: boolean; // Whether to show catalog toggle (for org/pethelper)
  extraRightActions?: React.ReactNode; 
  identificationExtraActions?: (pet: PetDetail) => React.ReactNode;
  showRegistrationButton?: boolean;
}

import RegisterPetButton from '@/components/modules/pet-registration/shared/RegisterPetButton';

export default function PetProfileLayout({
  petId,
  apiUrl,
  orgId,
  backUrl,
  backUrlLabel,
  showFundraising = false,
  catalogToggle = false,
  extraRightActions,
  identificationExtraActions,
  showRegistrationButton = false
}: PetProfileLayoutProps) {
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
    fetch(apiUrl, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success || data.data || data.pet) {
          const petData = data.data || data.pet || data; 
          setPet(petData);
          setPhotoUrl(petData.photo_url || petData.photo || petData.media_urls?.[0] || '');
          setItems([
            { label: backUrlLabel, href: backUrl },
            { label: petData.name ? `${petData.name} (№${petData.org_pet_number || petData.id})` : `Питомец №${petData.org_pet_number || petData.id}` },
          ]);
        } else {
          setError(data.error || 'Ошибка');
        }
      })
      .catch(() => setError('Ошибка'))
      .finally(() => setLoading(false));
  }, [apiUrl, setItems, backUrl, backUrlLabel]);

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
      await fetch(apiUrl, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setPet({ ...pet, media_urls: newUrls });
      if (!photoUrl) setPhotoUrl(uploaded.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } finally {
      setUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleCatalogStatusChange = async (newStatus: string) => {
    if (!pet) return;

    if (newStatus !== 'draft') {
      const hasPhoto = !!photoUrl || (pet.media_urls && pet.media_urls.length > 0);
      if (!hasPhoto) {
        alert('Для размещения в каталоге необходимо добавить хотя бы одно фото питомца.');
        return;
      }
    }

    setPet({ ...pet, catalog_status: newStatus });
    if (newStatus === 'draft' && activeTab === 'fundraising') {
      setActiveTab('timeline');
    }
    await fetch(apiUrl, {
      method: 'PUT', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ catalog_status: newStatus })
    });
  };

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить карточку питомца? Это действие необратимо.')) {
      try {
        const res = await fetch(apiUrl, { method: 'DELETE' });
        if (res.ok) {
          router.push(backUrl);
        } else {
          const data = await res.json();
          alert(data.error || 'Ошибка при удалении');
        }
      } catch (e) {
        alert('Ошибка сети при удалении');
      }
    }
  };

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mobile = window.innerWidth < 1024;
    setIsMobile(mobile);
    if (mobile) setActiveTab('info');

    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af', fontSize: 13 }}>
      Загрузка...
    </div>
  );
  if (error || !pet) return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😿</div>
      <div style={{ color: '#6b7280', fontSize: 14 }}>{error || 'Питомец не найден'}</div>
      <button onClick={() => router.push(backUrl)} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
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
  const isRegistered = !!pet.marking_date || !!pet.chip_number || !!pet.brand_number || !!pet.tag_number;

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string | null }) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 32, fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, fontSize: 13, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: value ? '#111827' : '#d1d5db' }}>{value || '—'}</div>
    </div>
  );

  const renderCenter = () => {
    switch (activeTab) {
      case 'timeline':       return <PetTimeline pet={pet as any} orgId={orgId} apiUrl={apiUrl} />;
      case 'general':        return <PetGeneralInfo pet={pet as any} orgId={orgId} apiUrl={apiUrl} onUpdate={(u: any) => setPet({ ...pet, ...u })} />;
      case 'identification': return <PetIdentification pet={pet as any} orgId={orgId} apiUrl={apiUrl} onUpdate={(u: any) => setPet({ ...pet, ...u })} extraActions={showRegistrationButton ? <RegisterPetButton petId={pet.id} orgId={orgId} isRegistered={isRegistered} /> : identificationExtraActions?.(pet)} />;

      case 'health':         return <PetHealth pet={pet as any} orgId={orgId} apiUrl={apiUrl} onUpdate={(u: any) => setPet({ ...pet, ...u })} />;
      case 'gallery':        return <PetGallery pet={pet as any} orgId={orgId} apiUrl={apiUrl} onPhotoUrlChange={setPhotoUrl} />;
      case 'fundraising':    return (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: '0 1px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Сбор средств</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            {!showFundraising 
               ? 'Данный функционал пока недоступен для частных лиц.'
               : 'Данный функционал пока находится в разработке и скоро будет доступен. Спасибо за ожидание!'
            }
          </p>
        </div>
      );
    }
  };

  if (isMobile) {
    // Dynamically require to avoid circular dependencies if necessary, but direct import is fine
    const MobilePetProfileLayout = require('../mobile/MobilePetProfileLayout').default;
    return (
      <div className="px-4 pb-8 w-full max-w-full overflow-hidden">
        <MobilePetProfileLayout 
          pet={pet} orgId={orgId} apiUrl={apiUrl} activeTab={activeTab} setActiveTab={setActiveTab} 
          photoUrl={photoUrl} gradient={gradient} isdog={isdog} ageStr={ageStr} 
          uploading={uploading} uploadSuccess={uploadSuccess} handleQuickUpload={handleQuickUpload} 
          uploadInputRef={uploadInputRef} catalogToggle={catalogToggle} 
          handleCatalogStatusChange={handleCatalogStatusChange} handleDelete={handleDelete} 
          extraRightActions={extraRightActions} showFundraising={showFundraising} 
          renderCenter={renderCenter} InfoRow={InfoRow}
        />
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 32 }}>
      {/* Основной грид */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* Левая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Фото */}
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', overflow: 'hidden' }}>
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
                №{pet.org_pet_number || pet.id}
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

          <PetNavMenu activeTab={activeTab} onChange={setActiveTab} showFundraising={showFundraising && pet.catalog_status === 'needs_help'} />
        </div>

        {/* Центральная колонка */}
        <div>{renderCenter()}</div>

        {/* Правая колонка */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Действия */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Действия</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {catalogToggle && (
                  <div style={{ paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: pet.catalog_status && pet.catalog_status !== 'draft' ? '#2563eb' : '#374151' }}>
                        {pet.catalog_status && pet.catalog_status !== 'draft' ? 'В каталоге' : 'Не в каталоге'}
                      </div>
                      <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
                          checked={pet.catalog_status !== 'draft'}
                          onChange={(e) => handleCatalogStatusChange(e.target.checked ? 'looking_for_home' : 'draft')}
                        />
                        <div style={{ 
                          width: 40, height: 24, borderRadius: 24, 
                          background: pet.catalog_status !== 'draft' ? '#3b82f6' : '#d1d5db',
                          position: 'relative', transition: 'background 0.2s' 
                        }}>
                          <div style={{
                            width: 20, height: 20, background: '#fff', borderRadius: '50%',
                            position: 'absolute', top: 2, left: pet.catalog_status !== 'draft' ? 18 : 2,
                            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                          }} />
                        </div>
                      </label>
                    </div>
                    
                    {pet.catalog_status && pet.catalog_status !== 'draft' && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Тип объявления:</div>
                        <select 
                          value={pet.catalog_status}
                          onChange={(e) => handleCatalogStatusChange(e.target.value)}
                          style={{ 
                            width: '100%', padding: '8px 10px', fontSize: 13, 
                            borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
                            color: '#111827', outline: 'none', cursor: 'pointer',
                            appearance: 'none', 
                            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '10px'
                          }}
                        >
                          <option value="looking_for_home">Ищет дом</option>
                          <option value="needs_help">Сбор средств</option>
                          <option value="lost">Потерян</option>
                          <option value="found">Найден</option>
                        </select>
                        
                        <a 
                          href={`/main/pets/${pet.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            display: 'block', marginTop: 16, fontSize: 13, color: '#2563eb', 
                            textDecoration: 'none', fontWeight: 600, textAlign: 'center' 
                          }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          ↗ Открыть карточку в каталоге
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {extraRightActions}

                <button 
                  onClick={handleDelete}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                >
                  🗑 Удалить карточку
                </button>
              </div>
            </div>

            {/* Инфо и Основное */}
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '16px 16px 8px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Инфо</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>Системный ID</div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>#{pet.id}</div>
                </div>
                {pet.org_pet_number && (
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>Учетный номер</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 700 }}>#{pet.org_pet_number}</div>
                  </div>
                )}
                {(pet.city || pet.location_address) && (
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 1 }}>Город</div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{pet.city || pet.location_address}</div>
                  </div>
                )}
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
