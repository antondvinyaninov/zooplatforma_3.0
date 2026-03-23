import React, { useRef, useState, useEffect } from 'react';
import { useMediaUpload } from '../../../../../main/hooks/useMediaUpload';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface GalleryTabProps {
  isEditing: boolean;
  pet: any;
  editData: any;
  setEditData: (data: any) => void;
}

export default function GalleryTab({ isEditing, pet, editData, setEditData }: GalleryTabProps) {
  const { uploadFile, progress } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localUrls, setLocalUrls] = useState<string[]>(pet.media_urls || []);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with pet changes
  useEffect(() => {
    if (isEditing) {
      setLocalUrls(editData.media_urls || []);
    } else {
      setLocalUrls(pet.media_urls || []);
    }
  }, [pet.media_urls, editData.media_urls, isEditing]);

  const saveToBackend = async (newUrls: string[]) => {
    setIsSaving(true);
    setUploadError(null);
    try {
      const response = await fetch(`/api/pethelper/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ media_urls: newUrls }),
      });
      if (!response.ok) throw new Error('Ошибка сохранения в базу');
      
      setLocalUrls(newUrls);
      
      if (isEditing) {
        setEditData({ ...editData, media_urls: newUrls });
      } else {
        pet.media_urls = newUrls; // Mutate to preserve consistency if edit mode is toggled later
      }
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const newUrls = [...localUrls];

    for (let i = 0; i < files.length; i++) {
       try {
         const uploaded = await uploadFile(files[i], 'photo');
         if (uploaded?.url) {
           newUrls.push(uploaded.url);
         }
       } catch (err: any) {
         setUploadError(err.message || 'Ошибка загрузки файла');
       }
    }

    await saveToBackend(newUrls);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = async (indexToRemove: number) => {
    const newUrls = localUrls.filter((_: any, idx: number) => idx !== indexToRemove);
    await saveToBackend(newUrls);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Галерея питомца</h3>
        <p className="text-sm text-gray-500">
          Здесь вы можете загрузить фотографии и видео питомца. Сохранённые медиафайлы автоматически появляются в публичной карточке.
        </p>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
          {uploadError}
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {localUrls.map((url: string, index: number) => {
          const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_MEDIA_URL}/${url.replace(/^\//, '')}`;
          return (
            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group border border-black/5 bg-gray-100">
              <img src={fullUrl} alt={`Фото ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <button
                onClick={() => removePhoto(index)}
                disabled={isSaving}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-500 shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50"
                title="Удалить фото"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          );
        })}

        {/* Beautiful Add Button */}
        <div 
           onClick={() => !isSaving && fileInputRef.current?.click()}
           className={`group relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
             isSaving || (progress.status === 'uploading' && progress.percentage > 0) 
               ? 'border-blue-400 bg-blue-50 cursor-not-allowed' 
               : 'border-purple-300 bg-purple-50/60 cursor-pointer hover:bg-purple-100 hover:border-purple-400 hover:shadow-sm'
           }`}
        >
           <div className="flex flex-col items-center justify-center space-y-3 p-4 text-center z-10">
             <div className={`p-4 rounded-full transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-90 ${
               isSaving || progress.status === 'uploading'
                 ? 'bg-blue-100 text-blue-600'
                 : 'bg-white shadow-sm text-purple-600 border border-purple-100'
             }`}>
               {isSaving || progress.status === 'uploading' ? (
                 <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
               ) : (
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                 </svg>
               )}
             </div>
             
             <span className={`text-sm font-bold transition-colors duration-200 ${
               isSaving || progress.status === 'uploading'
                 ? 'text-blue-600'
                 : 'text-purple-700'
             }`}>
               {isSaving 
                 ? 'Сохранение...' 
                 : progress.status === 'uploading' && progress.percentage > 0 && progress.percentage < 100 
                 ? `${progress.percentage}%` 
                 : 'Добавить'}
             </span>
           </div>
           
           {/* Progress bar background indicator */}
           {progress.status === 'uploading' && progress.percentage > 0 && (
             <div 
               className="absolute bottom-0 left-0 h-1.5 bg-blue-500 transition-all duration-300 ease-out" 
               style={{ width: `${progress.percentage}%` }}
             />
           )}
           
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileSelect} 
             className="hidden" 
             multiple 
             disabled={isSaving}
             accept="image/*,video/*"
           />
        </div>
      </div>
    </div>
  );
}
