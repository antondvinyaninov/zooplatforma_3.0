'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { MdPets } from 'react-icons/md';
import { getMediaUrl } from '@/lib/utils';

interface CreatePostPetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: any[];
  selectedPets: number[];
  onTogglePet: (petId: number) => void;
}

export default function CreatePostPetsModal({
  isOpen,
  onClose,
  pets,
  selectedPets,
  onTogglePet,
}: CreatePostPetsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[600px] shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" strokeWidth={2} />
          </button>
          <h3 className="font-bold text-[16px]">Выбрать питомцев</h3>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black text-white rounded-full text-[14px] font-semibold hover:bg-gray-800 transition-colors"
          >
            Готово
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {pets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MdPets className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-[16px] font-semibold text-gray-900 mb-2">
                У вас пока нет питомцев
              </h4>
              <p className="text-[14px] text-gray-500 mb-4">
                Добавьте своего первого питомца, чтобы прикреплять его к меткам
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-black text-white rounded-full text-[14px] font-semibold hover:bg-gray-800 transition-colors"
              >
                Добавить питомца
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Мои питомцы */}
              {pets.filter((pet) => pet.isOwner).length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    Мои питомцы
                  </h4>
                  <div className="space-y-2">
                    {pets
                      .filter((pet) => pet.isOwner)
                      .map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => onTogglePet(pet.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            selectedPets.includes(pet.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {/* Pet Photo */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                            {pet.photo_url || pet.photo ? (
                              <img
                                src={pet.photo_url || getMediaUrl(pet.photo) || ''}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              pet.name[0]?.toUpperCase()
                            )}
                          </div>

                          {/* Pet Info */}
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-[15px] text-gray-900">
                              {pet.name}
                            </div>
                            <div className="text-[13px] text-gray-600">{pet.species}</div>
                          </div>

                          {/* Checkmark */}
                          {selectedPets.includes(pet.id) && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Кураторские питомцы */}
              {pets.filter((pet) => !pet.isOwner).length > 0 && (
                <div>
                  <h4 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    Кураторские питомцы
                  </h4>
                  <div className="space-y-2">
                    {pets
                      .filter((pet) => !pet.isOwner)
                      .map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => onTogglePet(pet.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            selectedPets.includes(pet.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {/* Pet Photo */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                            {pet.photo_url || pet.photo ? (
                              <img
                                src={pet.photo_url || getMediaUrl(pet.photo) || ''}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              pet.name[0]?.toUpperCase()
                            )}
                          </div>

                          {/* Pet Info */}
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-[15px] text-gray-900">
                              {pet.name}
                            </div>
                            <div className="text-[13px] text-gray-600">{pet.species}</div>
                          </div>

                          {/* Checkmark */}
                          {selectedPets.includes(pet.id) && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Pets Count */}
        {selectedPets.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
            <p className="text-[13px] text-gray-600 text-center">
              Выбрано: {selectedPets.length} {selectedPets.length === 1 ? 'питомец' : 'питомца'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
