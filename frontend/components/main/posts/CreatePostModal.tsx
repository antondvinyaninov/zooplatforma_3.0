'use client';

import {
  PhotoIcon,
  MapPinIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  UserIcon,
  ListBulletIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { MdPets } from 'react-icons/md';
import { getMediaUrl, getFullName } from '@/lib/utils';
import PollCreator from '../polls/PollCreator';
import MiniMap from '../shared/MiniMap';

interface CreatePostModalProps {
  isOpen: boolean;
  user: any;
  content: string;
  setContent: (content: string) => void;
  isSubmitting: boolean;
  handleSubmit: () => void;
  onClose: () => void;
  onOpenDrafts: () => void;
  onOpenSchedule: () => void;
  showPollCreator: boolean;
  setShowPollCreator: (show: boolean) => void;
  pollData: any;
  setPollData: (data: any) => void;
  uploadedMedia: any[];
  uploadingFiles: any[];
  removePhoto: (index: number) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedPets: number[];
  pets: any[];
  onOpenPetsModal: () => void;
  togglePetSelection: (petId: number) => void;
  organizations: any[];
  selectedAuthor: 'user' | 'organization';
  setSelectedAuthor: (author: 'user' | 'organization') => void;
  selectedOrganizationId: number | null;
  setSelectedOrganizationId: (id: number | null) => void;
  showAuthorDropdown: boolean;
  setShowAuthorDropdown: (show: boolean) => void;
  location: { lat: number; lon: number; name: string } | null;
  setLocation: (location: any) => void;
  onOpenLocationPicker: () => void;
  scheduledDate: Date | null;
  scheduledTime: string;
  setScheduledDate: (date: Date | null) => void;
  setScheduledTime: (time: string) => void;
  showReplySettings: boolean;
  setShowReplySettings: (show: boolean) => void;
  replySetting: 'anyone' | 'followers' | 'following' | 'mentions';
  setReplySetting: (setting: 'anyone' | 'followers' | 'following' | 'mentions') => void;
  verifyReplies: boolean;
  setVerifyReplies: (verify: boolean) => void;
  handleBackdropClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function CreatePostModal(props: CreatePostModalProps) {
  const {
    isOpen,
    user,
    content,
    setContent,
    isSubmitting,
    handleSubmit,
    onClose,
    onOpenDrafts,
    onOpenSchedule,
    showPollCreator,
    setShowPollCreator,
    pollData,
    setPollData,
    uploadedMedia,
    uploadingFiles,
    removePhoto,
    handlePhotoUpload,
    handleVideoUpload,
    selectedPets,
    pets,
    onOpenPetsModal,
    togglePetSelection,
    organizations,
    selectedAuthor,
    setSelectedAuthor,
    selectedOrganizationId,
    setSelectedOrganizationId,
    showAuthorDropdown,
    setShowAuthorDropdown,
    location,
    setLocation,
    onOpenLocationPicker,
    scheduledDate,
    scheduledTime,
    setScheduledDate,
    setScheduledTime,
    showReplySettings,
    setShowReplySettings,
    replySetting,
    setReplySetting,
    verifyReplies,
    setVerifyReplies,
    handleBackdropClick,
  } = props;

  if (!isOpen) return null;

  const replySettingLabels: Record<'anyone' | 'followers' | 'following' | 'mentions', string> = {
    anyone: 'Кто угодно',
    followers: 'Ваши подписчики',
    following: 'Профили, на которые вы подписаны',
    mentions: 'Упомянутые профили',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-4 overflow-y-auto backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-[600px] shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-[15px] text-gray-700 hover:text-gray-900 font-medium"
          >
            Отмена
          </button>
          <h3 className="font-bold text-[16px]">Новая метка</h3>
          <div className="flex items-center gap-1">
            {/* Drafts Button */}
            <button
              onClick={onOpenDrafts}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors relative"
              title="Черновики"
            >
              <DocumentDuplicateIcon className="w-6 h-6 text-gray-600" strokeWidth={2} />
            </button>

            {/* Schedule Button */}
            <button
              onClick={onOpenSchedule}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Запланировать публикацию"
            >
              <ClockIcon className="w-6 h-6 text-gray-600" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-4 py-3">
          {/* User Info & Text Input */}
          <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2">
            
            {/* 1. Блок с аватаром и выбором автора (В мобильной версии - горизонтально, на десктопе - слева от текста) */}
            <div className="flex items-center md:items-start gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold flex-shrink-0 text-[14px] overflow-hidden">
                {selectedAuthor === 'user' ? (
                  user?.avatar ? (
                    <img
                      src={getMediaUrl(user.avatar) || ''}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  )
                ) : organizations.find((org) => org.id === selectedOrganizationId)?.logo ? (
                  <img
                    src={
                      getMediaUrl(
                        organizations.find((org) => org.id === selectedOrganizationId)?.logo,
                      ) || ''
                    }
                    alt="Organization"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              {/* Author Selector Dropdown (Только для мобильных он стоит в один ряд с аватаром, на десктопе он над текстом) */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                  className="flex items-center gap-1 font-semibold text-[15px] hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                >
                  {selectedAuthor === 'user'
                    ? getFullName(user?.name || 'Пользователь', user?.last_name)
                    : organizations.find((org) => org.id === selectedOrganizationId)?.short_name ||
                      organizations.find((org) => org.id === selectedOrganizationId)?.name ||
                      'Организация'}
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Mobile */}
                {showAuthorDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                    <button
                      onClick={() => {
                        setSelectedAuthor('user');
                        setSelectedOrganizationId(null);
                        setShowAuthorDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="font-medium text-sm">
                        {getFullName(user?.name || 'Пользователь', user?.last_name)}
                      </div>
                    </button>
                    {organizations.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => {
                              setSelectedAuthor('organization');
                              setSelectedOrganizationId(org.id);
                              setShowAuthorDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <div className="font-medium text-sm">{org.short_name || org.name}</div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Правая часть на десктопе, нижняя часть на мобилке (Имя автора для десктопа + Текстовое поле) */}
            <div className="flex-1 w-full">
              {/* Author Selector Dropdown (Только для десктопа) */}
              <div className="relative hidden md:block mb-1">
                <button
                  onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                  className="flex items-center gap-1 font-semibold text-[15px] hover:bg-gray-100 px-2 py-1 -ml-2 rounded-md transition-colors"
                >
                  {selectedAuthor === 'user'
                    ? getFullName(user?.name || 'Пользователь', user?.last_name)
                    : organizations.find((org) => org.id === selectedOrganizationId)?.short_name ||
                      organizations.find((org) => org.id === selectedOrganizationId)?.name ||
                      'Организация'}
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Desktop */}
                {showAuthorDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                    <button
                      onClick={() => {
                        setSelectedAuthor('user');
                        setSelectedOrganizationId(null);
                        setShowAuthorDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="font-medium text-sm">
                        {getFullName(user?.name || 'Пользователь', user?.last_name)}
                      </div>
                    </button>
                    {organizations.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => {
                              setSelectedAuthor('organization');
                              setSelectedOrganizationId(org.id);
                              setShowAuthorDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <div className="font-medium text-sm">{org.short_name || org.name}</div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Text Input */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Что нового у вашего питомца?"
                rows={1}
                className="w-full text-[15px] border-none focus:outline-none resize-none text-gray-900 placeholder-gray-400 overflow-y-auto"
                autoFocus
                style={{
                  minHeight: '24px',
                  maxHeight: '30vh',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>
          </div>

          {/* Attachment Icons */}
          <div className="flex items-center gap-0.5 mb-2 md:ml-12">
            <label
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Добавить фото"
            >
              <PhotoIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <label
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Добавить видео"
            >
              <VideoCameraIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
            <button
              onClick={onOpenPetsModal}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${selectedPets.length > 0 ? 'bg-blue-50' : ''}`}
              title="Прикрепить карточку питомца"
            >
              <MdPets
                className={`w-5 h-5 ${selectedPets.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}
              />
            </button>
            <button
              onClick={() => setShowPollCreator(!showPollCreator)}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${showPollCreator || pollData ? 'bg-blue-50' : ''}`}
              title="Голосование"
            >
              <ListBulletIcon
                className={`w-5 h-5 ${showPollCreator || pollData ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={2}
              />
            </button>
            <button
              onClick={onOpenLocationPicker}
              className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${location ? 'bg-blue-50' : ''}`}
              title={location ? location.name : 'Добавить местоположение'}
            >
              <MapPinIcon
                className={`w-5 h-5 ${location ? 'text-blue-600' : 'text-gray-400'}`}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Photos/Videos Preview */}
          {(uploadedMedia.length > 0 || uploadingFiles.length > 0) && (
            <div className="mb-3 md:ml-12 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {/* Uploading files with preview */}
                {uploadingFiles.map((item, index) => (
                  <div
                    key={`uploading-${index}`}
                    className="relative group rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={item.preview}
                      alt="Загрузка..."
                      className="w-full h-48 object-cover opacity-60"
                    />
                    {/* Status indicator */}
                    <div className="absolute top-2 right-2">
                      {item.status === 'uploading' ? (
                        <div className="relative">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="3"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="white"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - item.progress / 100)}`}
                              className="transition-all duration-300"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xs font-bold drop-shadow-lg">
                              {item.progress}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 bg-black/80 rounded-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-400 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 text-white text-xs rounded font-medium">
                      {item.status === 'uploading'
                        ? item.totalChunks && item.totalChunks > 1
                          ? `📤 Загрузка ${item.uploadedChunks}/${item.totalChunks} частей`
                          : '📤 Загрузка...'
                        : '🎬 Оптимизация...'}
                    </div>
                  </div>
                ))}

                {/* Uploaded media */}
                {uploadedMedia.map((media, index) => {
                  const mediaUrl = media.url.startsWith('http')
                    ? `${media.url}?t=${Date.now()}`
                    : `${process.env.NEXT_PUBLIC_MEDIA_URL || ''}${media.url}?t=${Date.now()}`;

                  return (
                    <div
                      key={media.id}
                      className="relative group rounded-lg overflow-hidden bg-gray-100"
                    >
                      {media.media_type === 'video' ? (
                        <video src={mediaUrl} className="w-full h-48 object-cover" controls />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={media.original_name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4 text-white" strokeWidth={2} />
                      </button>
                      {media.media_type === 'video' && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {media.optimizing ? '🎬 Оптимизация в фоне...' : 'Видео'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {uploadedMedia.length + uploadingFiles.length >= 10 && (
                <p className="text-xs text-gray-500 mt-2">Максимум 10 медиа файлов</p>
              )}
            </div>
          )}

          {/* Poll Creator */}
          {showPollCreator && !pollData && (
            <PollCreator
              onPollChange={(poll) => {
                setPollData(poll);
                if (poll) {
                  setShowPollCreator(false);
                }
              }}
              onClose={() => setShowPollCreator(false)}
            />
          )}

          {/* Poll Preview */}
          {pollData && !showPollCreator && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-[14px] text-gray-900 mb-2">
                    {pollData.question}
                  </div>
                  <div className="space-y-1">
                    {pollData.options.map((option: string, index: number) => (
                      <div
                        key={index}
                        className="text-[13px] text-gray-700 px-2 py-1 bg-white rounded"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  <div className="text-[12px] text-gray-500 mt-2">
                    {pollData.multiple_choice ? 'Множественный выбор' : 'Один вариант'} •
                    {pollData.allow_vote_changes ? ' Можно изменить' : ' Нельзя изменить'}
                    {pollData.anonymous_voting && ' • Анонимно'}
                    {pollData.expires_at && ' • Ограничен по времени'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPollData(null);
                    setShowPollCreator(false);
                  }}
                  className="ml-2 p-1 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-blue-700" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* Location Preview */}
          {location && (
            <div className="mb-3 md:ml-12 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{location.name}</div>
                    <div className="text-xs text-gray-500">
                      {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenLocationPicker}
                    className="px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                    title="Изменить местоположение"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => setLocation(null)}
                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                    title="Удалить местоположение"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <MiniMap
                lat={location.lat}
                lon={location.lon}
                locationName={location.name}
                height="120px"
              />
            </div>
          )}

          {/* Selected Pets Preview */}
          {selectedPets.length > 0 && (
            <div className="mb-3 md:ml-12">
              <div className="flex flex-wrap gap-2">
                {pets
                  .filter((pet) => selectedPets.includes(pet.id))
                  .map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-full"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-[10px] font-semibold overflow-hidden">
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
                      <span className="text-[13px] font-medium text-gray-900">{pet.name}</span>
                      <button
                        onClick={() => togglePetSelection(pet.id)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <XMarkIcon className="w-3.5 h-3.5 text-blue-700" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Bottom Section */}
          <div className="pt-3 border-t border-gray-200">
            {/* Scheduled Info */}
            {scheduledDate && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-blue-700">
                  <ClockIcon className="w-4 h-4" strokeWidth={2} />
                  <span>
                    Запланировано: {scheduledDate.toLocaleDateString('ru-RU')} в {scheduledTime}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setScheduledDate(null);
                    setScheduledTime('19:00');
                  }}
                  className="text-blue-700 hover:text-blue-900"
                >
                  <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Reply Settings Dropdown */}
            {showReplySettings && (
              <div className="mb-4 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4">
                  <h4 className="text-[13px] text-gray-500 mb-3">
                    Кто может отвечать и цитировать
                  </h4>

                  <div className="space-y-0">
                    {(['anyone', 'followers', 'following', 'mentions'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setReplySetting(option)}
                        className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span className="text-[15px] text-gray-900">
                          {replySettingLabels[option]}
                        </span>
                        {replySetting === option && (
                          <svg
                            className="w-5 h-5 text-black"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={() => setVerifyReplies(!verifyReplies)}
                    className="w-full flex items-center justify-between"
                  >
                    <span className="text-[15px] text-gray-900">Проверять и одобрять ответы</span>
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${verifyReplies ? 'bg-black' : 'bg-gray-300'}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${verifyReplies ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowReplySettings(!showReplySettings)}
                className="text-[13px] text-gray-500 hover:text-gray-900 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Настройки ответов
              </button>

              <button
                onClick={handleSubmit}
                disabled={(!content.trim() && !pollData) || isSubmitting}
                className="px-5 py-1.5 bg-black text-white rounded-full text-[14px] font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? 'Публикация...'
                  : scheduledDate
                    ? 'Запланировать'
                    : 'Поставить метку'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
