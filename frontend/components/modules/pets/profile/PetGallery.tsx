import React, { useRef, useState, useEffect } from 'react';
import { useMediaUpload } from '@/app/main/hooks/useMediaUpload';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import s from '../shared/pet-card.module.css';

interface PetGalleryProps {
  pet: {
    id: number;
    media_urls?: string[];
    photo_url?: string;
    face_photo_url?: string;
    body_photo_url?: string;
  };
  orgId: string;
  apiUrl: string;
  onPhotoUrlChange?: (url: string) => void;
}

// Слот для специализированного фото
function SpecialPhotoSlot({
  label, icon, url, fieldKey, petId, orgId, apiUrl, onSave,
}: {
  label: string; icon: string; url: string; fieldKey: string;
  petId: number; orgId: string; apiUrl: string; onSave: (url: string) => void;
}) {
  const { uploadFile } = useMediaUpload();
  const ref = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(false);

  const fullUrl = url
    ? (url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_MEDIA_URL}/${url.replace(/^\//, '')}`)
    : '';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const uploaded = await uploadFile(file, 'photo');
      if (!uploaded?.url) return;
      await fetch(apiUrl, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldKey]: uploaded.url }),
      });
      onSave(uploaded.url);
    } finally {
      setSaving(false);
      if (ref.current) ref.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span> {label}
      </div>
      <div
        onClick={() => !saving && ref.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'relative', aspectRatio: '1', borderRadius: 12,
          overflow: 'hidden', cursor: saving ? 'not-allowed' : 'pointer',
          background: fullUrl ? '#000' : '#f8fafc',
          borderWidth: 2,
          borderStyle: fullUrl ? 'solid' : 'dashed',
          borderColor: hover && !fullUrl ? '#93c5fd' : (fullUrl ? '#e5e7eb' : '#cbd5e1'),
          transition: 'border-color 0.2s',
        }}
      >
        {fullUrl ? (
          <>
            <img src={fullUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: hover ? 1 : 0, transition: 'opacity 0.2s',
            }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Заменить</span>
            </div>
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>
              {label}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 8,
            color: hover ? '#3b82f6' : '#94a3b8',
          }}>
            {saving
              ? <div style={{ width: 22, height: 22, borderWidth: 2, borderStyle: 'solid', borderColor: 'transparent #3b82f6 #3b82f6 #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{saving ? 'Загрузка...' : '+ Загрузить'}</span>
                </>
            }
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
      </div>
    </div>
  );
}

export default function PetGallery({ pet, orgId, apiUrl, onPhotoUrlChange }: PetGalleryProps) {
  const { uploadFile, progress } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const getInitialUrls = (p: { media_urls?: string[], photo_url?: string }) => {
    const urls = new Set(p.media_urls || []);
    if (p.photo_url && !urls.has(p.photo_url)) {
      urls.add(p.photo_url);
    }
    return Array.from(urls);
  };

  const [localUrls, setLocalUrls] = useState<string[]>(getInitialUrls(pet));
  const [mainPhoto, setMainPhoto] = useState<string>(pet.photo_url || '');
  const [facePhoto, setFacePhoto] = useState<string>(pet.face_photo_url || '');
  const [bodyPhoto, setBodyPhoto] = useState<string>(pet.body_photo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [settingMain, setSettingMain] = useState(false);
  const [mediaTab, setMediaTab] = useState<'photo' | 'video'>('photo');

  const isVideo = (url: string) => /\.(mp4|mov|avi|mkv|webm|m4v|ogg)$/i.test(url.split('?')[0]);

  useEffect(() => {
    setLocalUrls(getInitialUrls(pet));
    setMainPhoto(pet.photo_url || '');
    setFacePhoto(pet.face_photo_url || '');
    setBodyPhoto(pet.body_photo_url || '');
  }, [pet.media_urls, pet.photo_url, pet.face_photo_url, pet.body_photo_url]);

  const saveMediaUrls = async (newUrls: string[]) => {
    setIsSaving(true);
    setUploadError(null);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ media_urls: newUrls }),
      });
      if (!res.ok) throw new Error('Ошибка сохранения');
      setLocalUrls(newUrls);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  const setAsMain = async (url: string) => {
    setSettingMain(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ photo_url: url }),
      });
      if (!res.ok) throw new Error();
      setMainPhoto(url);
      onPhotoUrlChange?.(url);
    } catch { /* ignore */ }
    finally { setSettingMain(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    const newUrls = [...localUrls];
    for (let i = 0; i < files.length; i++) {
      try {
        const uploaded = await uploadFile(files[i], 'photo');
        if (uploaded?.url) newUrls.push(uploaded.url);
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : 'Ошибка');
      }
    }
    await saveMediaUrls(newUrls);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = async (urlToRemove: string) => {
    const newUrls = localUrls.filter((u: string) => u !== urlToRemove);
    await saveMediaUrls(newUrls);
    if (urlToRemove === mainPhoto) await setAsMain(newUrls.find((u: string) => !isVideo(u)) || '');
  };

  const isUploading = isSaving || settingMain || (progress.status === 'uploading' && progress.percentage > 0);
  const filteredUrls = localUrls.filter((u: string) => mediaTab === 'video' ? isVideo(u) : !isVideo(u));

  return (
    <div>
      <div className={s.headerCard}>
        <div className={s.sectionTitle}>Галерея</div>
        <div className={s.sectionDesc}>Фотографии питомца. Нажмите ⭐ чтобы сделать главным.</div>
      </div>

      {/* Основная галерея */}
      <div className={s.card}>
        {/* Подвкладки Фото / Видео */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', borderRadius: 8, padding: 4 }}>
          {(['photo', 'video'] as const).map(tab => (
            <button key={tab} onClick={() => setMediaTab(tab)} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: mediaTab === tab ? '#fff' : 'transparent',
              color: mediaTab === tab ? '#1d4ed8' : '#6b7280',
              boxShadow: mediaTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
              {tab === 'photo' ? `📷 Фото (${localUrls.filter((u: string) => !isVideo(u)).length})` : `🎥 Видео (${localUrls.filter((u: string) => isVideo(u)).length})`}
            </button>
          ))}
        </div>

        {uploadError && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {uploadError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredUrls.map((url: string) => {
            const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_MEDIA_URL}/${url.replace(/^\//, '')}`;
            const isMain = url === mainPhoto;
            const isVid = isVideo(url);
            return (
              <div key={url} style={{
                position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
                background: '#f3f4f6',
                border: isMain ? '2px solid #f59e0b' : '2px solid transparent',
                boxShadow: isMain ? '0 0 0 1px #f59e0b' : 'none',
                transition: 'border 0.2s, box-shadow 0.2s',
              }}>
                {isVid
                  ? <video src={fullUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                  : <img src={fullUrl} alt="Фото" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                }
                {isMain && (
                  <div style={{ position: 'absolute', bottom: 6, left: 6, background: '#f59e0b', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                    Главное
                  </div>
                )}
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  {!isMain && !isVid && (
                    <button onClick={() => setAsMain(url)} disabled={settingMain} title="Сделать главным"
                      style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                      <StarIcon style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                  {isMain && (
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StarSolid style={{ width: 16, height: 16, color: '#fff' }} />
                    </div>
                  )}
                  <button onClick={() => removeMedia(url)} disabled={isSaving} title="Удалить"
                    style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <XMarkIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Добавить */}
          <div onClick={() => !isUploading && fileInputRef.current?.click()} style={{
            aspectRatio: '1', borderRadius: 12, border: `2px dashed ${isUploading ? '#93c5fd' : '#c4b5fd'}`,
            background: isUploading ? '#eff6ff' : '#faf5ff', cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: isUploading ? '#dbeafe' : '#fff', border: `1px solid ${isUploading ? '#93c5fd' : '#ddd6fe'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isUploading ? '#3b82f6' : '#7c3aed', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {isUploading
                ? <div style={{ width: 18, height: 18, borderWidth: 2, borderStyle: 'solid', borderColor: 'transparent #3b82f6 #3b82f6 #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              }
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: isUploading ? '#3b82f6' : '#7c3aed' }}>
              {isSaving ? 'Сохранение...' : settingMain ? 'Обновление...' : progress.status === 'uploading' && progress.percentage > 0 && progress.percentage < 100 ? `${progress.percentage}%` : 'Добавить'}
            </span>
            {progress.status === 'uploading' && progress.percentage > 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: '#3b82f6', width: `${progress.percentage}%`, transition: 'width 0.3s' }} />
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} multiple disabled={isUploading}
              accept={mediaTab === 'video' ? 'video/*' : 'image/*'} />
          </div>
        </div>

        {filteredUrls.length === 0 && (
          <p className={s.emptyState} style={{ marginTop: 16, textAlign: 'center' }}>
            {mediaTab === 'photo' ? 'Нет фотографий.' : 'Нет видео.'} Нажмите «Добавить», чтобы загрузить.
          </p>
        )}
      </div>

      {/* Специализированные фото */}
      <div className={s.card} style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Специализированные фото</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SpecialPhotoSlot
            label="Фото морды" icon="🐾" url={facePhoto} fieldKey="face_photo_url"
            petId={pet.id} orgId={orgId} apiUrl={apiUrl} onSave={setFacePhoto}
          />
          <SpecialPhotoSlot
            label="Фото тела" icon="📏" url={bodyPhoto} fieldKey="body_photo_url"
            petId={pet.id} orgId={orgId} apiUrl={apiUrl} onSave={setBodyPhoto}
          />
        </div>
      </div>
    </div>
  );
}
