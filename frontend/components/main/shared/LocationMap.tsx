'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface LocationMapProps {
  onClose: () => void;
  onLocationSelect?: (location: { lat: number; lon: number; name: string }) => void; // ✅ Добавил callback для выбора местоположения
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function LocationMap({ onClose, onLocationSelect }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем текущее местоположение пользователя
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Устанавливаем координаты
        setCurrentLocation({ lat, lon, name: 'Ваше местоположение' });
        setGettingLocation(false);
      },
      (err) => {
        setError('Не удалось определить ваше местоположение. Проверьте разрешения браузера.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    if (!currentLocation) return;

    // Проверяем загружен ли уже API
    if (window.ymaps) {
      initMap();
      return;
    }

    // Проверяем не загружается ли уже скрипт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      // Скрипт уже загружается, ждём его загрузки
      existingScript.addEventListener('load', initMap);
      return () => {
        existingScript.removeEventListener('load', initMap);
      };
    }

    // Загружаем Яндекс.Карты API
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=8cf445c5-b490-40a5-96c4-dd72c041419f&lang=ru_RU`;
    script.async = true;

    script.onload = () => {
      initMap();
    };

    script.onerror = () => {
      setError('Не удалось загрузить карту');
    };

    document.head.appendChild(script);

    return () => {
      // Очищаем карту при размонтировании
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [currentLocation]);

  const initMap = () => {
    if (!window.ymaps || !mapRef.current || !currentLocation) {
      return;
    }

    window.ymaps.ready(async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Создаём карту с центром на текущем местоположении
        const map = new window.ymaps.Map(mapRef.current, {
          center: [currentLocation.lat, currentLocation.lon],
          zoom: 15,
          controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
        });

        // Получаем адрес по координатам
        try {
          const geocoder = await window.ymaps.geocode([currentLocation.lat, currentLocation.lon]);
          const firstGeoObject = geocoder.geoObjects.get(0);
          const locationName = firstGeoObject.getAddressLine();

          // Обновляем название местоположения
          setCurrentLocation({
            lat: currentLocation.lat,
            lon: currentLocation.lon,
            name: locationName,
          });

          // Добавляем метку с правильным адресом
          const placemark = new window.ymaps.Placemark(
            [currentLocation.lat, currentLocation.lon],
            {
              balloonContent: locationName,
              hintContent: 'Вы здесь',
            },
            {
              preset: 'islands#blueDotIcon',
              draggable: false,
            },
          );

          map.geoObjects.add(placemark);
          placemark.balloon.open();
        } catch (err) {
          // Добавляем метку без адреса
          const placemark = new window.ymaps.Placemark(
            [currentLocation.lat, currentLocation.lon],
            {
              balloonContent: 'Ваше местоположение',
              hintContent: 'Вы здесь',
            },
            {
              preset: 'islands#blueDotIcon',
              draggable: false,
            },
          );

          map.geoObjects.add(placemark);
          placemark.balloon.open();
        }

        mapInstanceRef.current = map;
      } catch (error) {
        setError('Ошибка инициализации карты');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[600px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentLocation?.name || 'Ваше местоположение'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            title="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Карта */}
        <div className="flex-1 w-full relative">
          <div ref={mapRef} className="w-full h-full"></div>

          {/* Индикатор загрузки */}
          {gettingLocation && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Определение вашего местоположения...</p>
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && !gettingLocation && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-gray-700 mb-2">{error}</p>
                <p className="text-sm text-gray-500">
                  Разрешите доступ к геолокации в настройках браузера
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Координаты и кнопка добавления */}
        {currentLocation && !gettingLocation && !error && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Координаты:</span> {currentLocation.lat.toFixed(6)},{' '}
              {currentLocation.lon.toFixed(6)}
            </div>

            {/* Кнопка добавить местоположение */}
            {onLocationSelect && (
              <button
                onClick={() => {
                  onLocationSelect(currentLocation);
                  onClose();
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <MapPinIcon className="w-5 h-5" />
                <span>Добавить это местоположение</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
