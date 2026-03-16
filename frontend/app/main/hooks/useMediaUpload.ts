import { useState } from 'react';

const API_BASE = ''; // Загружаем через Next.js proxy

export interface UploadedMedia {
  id: number;
  url: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  media_type: string;
}

export interface UploadProgress {
  percentage: number;
  status: 'uploading' | 'complete' | 'error';
}

export function useMediaUpload() {
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    status: 'uploading',
  });

  const uploadFile = async (
    file: File,
    mediaType: string = 'photo',
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadedMedia | null> => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Проверяем первые байты файла
      const firstBytes = await file.slice(0, 10).arrayBuffer();
      const byteArray = new Uint8Array(firstBytes);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', mediaType);

      // Создаем XMLHttpRequest для отслеживания прогресса
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Отслеживаем прогресс загрузки
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded / e.total) * 100);
            const progressData = {
              percentage,
              status: 'uploading' as const,
            };
            setProgress(progressData);
            onProgress?.(progressData);
          }
        });

        // Обработка завершения
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data) {
                const completeProgress = {
                  percentage: 100,
                  status: 'complete' as const,
                };
                setProgress(completeProgress);
                onProgress?.(completeProgress);
                resolve(response.data);
              } else {
                throw new Error(response.error || 'Upload failed');
              }
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        // Обработка ошибок
        xhr.addEventListener('error', () => {
          const errorProgress = {
            percentage: 0,
            status: 'error' as const,
          };
          setProgress(errorProgress);
          onProgress?.(errorProgress);
          reject(new Error('Network error'));
        });

        // Отправляем запрос
        xhr.open('POST', `${API_BASE}/api/media/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error) {
      setProgress({
        percentage: 0,
        status: 'error',
      });
      throw error;
    }
  };

  return {
    uploadFile,
    progress,
  };
}
