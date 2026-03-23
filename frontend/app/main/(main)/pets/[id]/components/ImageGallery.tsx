'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageGalleryProps {
  photos: string[];
  name: string;
}

export default function ImageGallery({ photos, name }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-2.5">
        <div className="aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-6xl">🐾</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
      {/* Карусель */}
      <div className="relative aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden bg-gray-100 group">
        <img 
          src={photos[currentIndex]} 
          alt={`${name} фото ${currentIndex + 1}`} 
          className="w-full h-full object-cover"
        />
        
        {/* Number Badge */}
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Слайдер стрелки */}
        {photos.length > 1 && (
          <>
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Миниатюры */}
      {photos.length > 1 && (
        <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === idx ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={p} alt={`Миниатюра ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
