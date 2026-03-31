/**
 * Утилита для обрезки изображений через Canvas.
 * Возвращает готовый Blob для загрузки на сервер в форматах JPEG.
 */

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Поддержка картинок с других доменов (S3/CDN), если они уже загружены
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Размер холста равен размеру выделенной пользователем области
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Рисуем на холсте только нужный кусок
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Возвращаем результат как Blob файл (JPEG высокого качества)
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}
