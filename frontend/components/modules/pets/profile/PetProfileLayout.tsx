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

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
    try {
      const res = await fetch(apiUrl, { method: 'DELETE' });
      if (res.ok) {
        setDeleteDialogOpen(false);
        router.push(backUrl);
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при удалении');
      }
    } catch (e) {
      alert('Ошибка сети при удалении');
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
    <div className="flex items-center py-3 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="w-8 text-base shrink-0">{icon}</div>
      <div className="flex-1 text-[13px] text-gray-500">{label}</div>
      <div className={`text-[13px] font-semibold ${value ? 'text-gray-900' : 'text-gray-300'}`}>
        {value || '—'}
      </div>
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
    <div className="max-w-7xl mx-auto px-4 pb-12 pt-4">
      {/* Основной грид */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 items-start">

        {/* Левая колонка */}
        <div className="flex flex-col gap-4">
          {/* Фото */}
          <Card className="overflow-hidden">
            <div className="relative h-[260px] flex items-center justify-center text-[100px]" style={{ background: photoUrl ? '#000' : gradient }}>
              {photoUrl
                ? <img src={photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                : (isdog ? '🐕' : '🐈')}
              <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90 text-gray-800 hover:bg-white backdrop-blur shadow-sm">
                №{pet.org_pet_number || pet.id}
              </Badge>
            </div>
            <div className="p-4 pb-3">
              <div className="font-bold text-lg text-gray-900 mb-1">{pet.name}</div>
              <div className="text-[13px] text-gray-500">
                {pet.species_name || (isdog ? 'Собака' : 'Кошка')}{pet.breed_name ? ` · ${pet.breed_name}` : ''}
              </div>
            </div>
            <div className="px-3 pb-3">
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => uploadInputRef.current?.click()}
                className={`w-full text-xs font-medium transition-all ${uploadSuccess ? 'border-green-300 bg-green-50 text-green-600' : uploading ? 'bg-gray-50 text-gray-400' : ''}`}
              >
                {uploadSuccess ? '✓ Фото загружено' : uploading ? 'Загрузка...' : '+ Загрузить фото'}
              </Button>
              <input
                ref={uploadInputRef}
                type="file" accept="image/*" className="hidden"
                onChange={handleQuickUpload}
              />
            </div>
          </Card>

          <PetNavMenu activeTab={activeTab} onChange={setActiveTab} showFundraising={showFundraising && pet.catalog_status === 'needs_help'} />
        </div>

        {/* Центральная колонка */}
        <div>{renderCenter()}</div>

        {/* Правая колонка */}
        <div className="flex flex-col gap-4">
          <div className="sticky top-4 flex flex-col gap-4">

            {/* Действия */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-gray-500">Действия</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {catalogToggle && (
                  <div className="pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-[13px] font-semibold ${pet.catalog_status && pet.catalog_status !== 'draft' ? 'text-blue-600' : 'text-gray-700'}`}>
                        {pet.catalog_status && pet.catalog_status !== 'draft' ? 'В каталоге' : 'Не в каталоге'}
                      </div>
                      <Switch
                        checked={pet.catalog_status !== 'draft'}
                        onCheckedChange={(val: boolean) => handleCatalogStatusChange(val ? 'looking_for_home' : 'draft')}
                      />
                    </div>
                    
                    {pet.catalog_status && pet.catalog_status !== 'draft' && (
                      <div className="mt-2">
                        <div className="text-[11px] text-gray-500 mb-1">Тип объявления:</div>
                        <select 
                          value={pet.catalog_status}
                          onChange={(e) => handleCatalogStatusChange(e.target.value)}
                          className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
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
                          className="block mt-4 text-[13px] text-blue-600 font-semibold text-center hover:underline"
                        >
                          ↗ Открыть карточку в каталоге
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {extraRightActions}

                <Button 
                  variant="danger" 
                  className="w-full justify-start mt-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  🗑 Удалить карточку
                </Button>
              </CardContent>
            </Card>

            {/* Инфо и Основное */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-gray-500">Инфо</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                <div className="flex flex-col gap-2 pb-3 mb-1 border-b border-gray-100">
                  <div>
                    <div className="text-[11px] text-gray-400 mb-[2px]">Системный ID</div>
                    <div className="text-[13px] text-gray-700 font-semibold">#{pet.id}</div>
                  </div>
                  {pet.org_pet_number && (
                    <div>
                      <div className="text-[11px] text-gray-400 mb-[2px]">Учетный номер</div>
                      <div className="text-[13px] text-gray-800 font-bold">#{pet.org_pet_number}</div>
                    </div>
                  )}
                  {(pet.city || pet.location_address) && (
                    <div>
                      <div className="text-[11px] text-gray-400 mb-[2px]">Город</div>
                      <div className="text-[13px] text-gray-700 font-semibold">{pet.city || pet.location_address}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] text-gray-400 mb-[2px]">Добавлен</div>
                    <div className="text-[13px] text-gray-700">
                      {new Date(pet.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-[2px]">Ответственный</div>
                    <div className="text-[13px] text-gray-700 font-semibold">
                      {pet.org_id ? (
                        <span>Организация (<a href={`/orgs/${pet.org_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{pet.owner_name || pet.org_name || 'Профиль'}</a>)</span>
                      ) : pet.user_id ? (
                        <span>{pet.relationship === 'curator' ? 'Куратор' : pet.relationship === 'guardian' ? 'Опекун' : 'Владелец'} (<a href={`/main/${pet.user_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{pet.owner_name || 'Профиль'}</a>)</span>
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
              </CardContent>
            </Card>

          </div>
        </div>

      </div>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle onClose={() => setDeleteDialogOpen(false)}>
          Удалить карточку питомца?
        </DialogTitle>
        <p className="text-sm text-gray-500 mb-6">
          Вы уверены, что хотите удалить карточку питомца? Это действие необратимо.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
