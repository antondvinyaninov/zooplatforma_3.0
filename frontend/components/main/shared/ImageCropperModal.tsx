'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspect?: number;
  title?: string;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspect = 1,
  title = 'Обрезать изображение',
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Сохраняем пиксели выделенной области при любых изменениях зума или сдвига
  const onCropCompleteHandler = useCallback(
    (_croppedArea: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error('Ошибка при обрезке:', e);
      alert('Произошла ошибка при сохранении изображения.');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[999]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" aria-hidden="true" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl flex flex-col">
            {/* Заголовок модалки */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 relative z-10 bg-white shadow-sm">
              <Dialog.Title as="h3" className="text-lg font-extrabold text-gray-900 leading-none">
                {title}
              </Dialog.Title>
              <button
                type="button"
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors focus:outline-none"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Сам холст для Кроппера (Темный фон для контраста) */}
            <div className="relative w-full h-[60vh] sm:h-[450px] bg-gray-900 touch-none">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropCompleteHandler}
                onZoomChange={setZoom}
                showGrid={false} // Apple-way = минимализм без лишних линий
              />
            </div>

            {/* Подвал с элементами управления зумом и кнопками */}
            <div className="px-6 py-5 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-5 border-t border-gray-200 relative z-10">
              {/* Ползунок масштаба */}
              <div className="flex flex-col w-full sm:max-wxs flex-grow">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Масштаб
                </label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => {
                    setZoom(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
              </div>

              {/* Кнопки */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all focus:outline-none"
                  onClick={onClose}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto justify-center rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 transition-all focus:outline-none"
                  onClick={handleSave}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Обработка...' : 'Применить'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
