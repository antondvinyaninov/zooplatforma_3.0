/**
 * Утилиты для сжатия и оптимизации изображений
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, по умолчанию 0.8
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Сжать изображение
 * @param file - исходный файл
 * @param options - опции сжатия
 * @returns сжатый файл
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Вычисляем новые размеры
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Создаем canvas и рисуем сжатое изображение
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Создаем новый файл с сжатым изображением
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          format,
          quality,
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Сжать изображение для аватара (квадратное, маленькое)
 */
export async function compressAvatarImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    format: 'image/jpeg',
  });
}

/**
 * Сжать изображение для обложки (широкое, среднее)
 */
export async function compressCoverImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 0.8,
    format: 'image/jpeg',
  });
}

/**
 * Сжать изображение для галереи (среднее)
 */
export async function compressGalleryImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    format: 'image/jpeg',
  });
}

/**
 * Сжать изображение для thumbnail (маленькое)
 */
export async function compressThumbnailImage(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 256,
    maxHeight: 256,
    quality: 0.75,
    format: 'image/jpeg',
  });
}
