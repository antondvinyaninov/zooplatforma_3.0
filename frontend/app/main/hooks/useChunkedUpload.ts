import { useState } from 'react';

const API_BASE = '';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export interface ChunkedUploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  percentage: number;
  status: 'uploading' | 'optimizing' | 'complete' | 'error';
}

export interface UploadedMedia {
  id: number;
  url: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  media_type: string;
  optimizing?: boolean; // Indicates background optimization
}

export function useChunkedUpload() {
  const [progress, setProgress] = useState<ChunkedUploadProgress>({
    uploadedChunks: 0,
    totalChunks: 0,
    percentage: 0,
    status: 'uploading',
  });

  const uploadFile = async (
    file: File,
    mediaType: string = 'video',
    onProgress?: (progress: ChunkedUploadProgress) => void,
  ): Promise<UploadedMedia | null> => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Step 1: Initiate upload
      const initiateFormData = new FormData();
      initiateFormData.append('file_name', file.name);
      initiateFormData.append('file_size', file.size.toString());
      initiateFormData.append('media_type', mediaType);
      initiateFormData.append('mime_type', file.type);

      const initiateResponse = await fetch(`${API_BASE}/api/media/chunked/initiate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: initiateFormData,
      });

      if (!initiateResponse.ok) {
        throw new Error('Failed to initiate upload');
      }

      const { data: initiateData } = await initiateResponse.json();
      const { upload_id, total_chunks } = initiateData;

      setProgress({
        uploadedChunks: 0,
        totalChunks: total_chunks,
        percentage: 0,
        status: 'uploading',
      });

      // Step 2: Upload chunks
      for (let chunkIndex = 0; chunkIndex < total_chunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Читаем chunk как ArrayBuffer и создаем File объект
        const arrayBuffer = await chunk.arrayBuffer();
        const chunkFile = new File([arrayBuffer], `chunk_${chunkIndex}.bin`, {
          type: 'application/octet-stream',
        });

        // Проверяем первые байты для отладки
        const uint8Array = new Uint8Array(arrayBuffer);

        const chunkFormData = new FormData();
        chunkFormData.append('upload_id', upload_id);
        chunkFormData.append('chunk_index', chunkIndex.toString());
        chunkFormData.append('chunk', chunkFile);

        const chunkResponse = await fetch(`${API_BASE}/api/media/chunked/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: chunkFormData,
        });

        if (!chunkResponse.ok) {
          throw new Error(`Failed to upload chunk ${chunkIndex}`);
        }

        const uploadedChunks = chunkIndex + 1;
        const percentage = Math.round((uploadedChunks / total_chunks) * 100);

        const newProgress = {
          uploadedChunks,
          totalChunks: total_chunks,
          percentage,
          status: 'uploading' as const,
        };

        setProgress(newProgress);
        onProgress?.(newProgress);
      }

      // Step 3: Complete upload (assembly + optimization)
      const optimizingProgress = {
        uploadedChunks: total_chunks,
        totalChunks: total_chunks,
        percentage: 100,
        status: 'optimizing' as const,
      };

      setProgress(optimizingProgress);
      onProgress?.(optimizingProgress);

      const completeFormData = new FormData();
      completeFormData.append('upload_id', upload_id);
      completeFormData.append('file_name', file.name);
      completeFormData.append('media_type', mediaType);
      completeFormData.append('mime_type', file.type);
      completeFormData.append('total_chunks', total_chunks.toString());

      const completeResponse = await fetch(`${API_BASE}/api/media/chunked/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: completeFormData,
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const { data: mediaData } = await completeResponse.json();

      const completeProgress = {
        uploadedChunks: total_chunks,
        totalChunks: total_chunks,
        percentage: 100,
        status: 'complete' as const,
      };

      setProgress(completeProgress);
      onProgress?.(completeProgress);

      return mediaData;
    } catch (error) {
      setProgress((prev) => ({
        ...prev,
        status: 'error',
      }));

      throw error;
    }
  };

  return {
    uploadFile,
    progress,
  };
}
