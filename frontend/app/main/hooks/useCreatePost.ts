import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, petsApi } from '@/lib/api';
import { useChunkedUpload, UploadedMedia } from './useChunkedUpload';
import { PollData } from '@/components/main/polls/PollCreator';

interface CreatePostProps {
  onPostCreated?: () => void;
  editMode?: boolean;
  editPost?: {
    id: number;
    content: string;
    attached_pets?: number[];
    pets?: any[];
    attachments?: any[];
    tags?: string[];
    poll?: any;
    location_lat?: number;
    location_lon?: number;
    location_name?: string;
    reply_setting?: string;
    verify_replies?: boolean;
  };
  onPostUpdated?: () => void;
}

export type ReplySettingType = 'anyone' | 'followers' | 'following' | 'mentions';

interface UploadingFile {
  file: File;
  preview: string;
  status: 'uploading' | 'optimizing';
  progress: number;
  uploadedChunks?: number;
  totalChunks?: number;
}

export function useCreatePost({
  onPostCreated,
  editMode = false,
  editPost,
  onPostUpdated,
}: CreatePostProps) {
  const { user } = useAuth();
  const { uploadFile: uploadChunked } = useChunkedUpload();

  // Content state
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showReplySettings, setShowReplySettings] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [showPetsModal, setShowPetsModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  // Poll state
  const [pollData, setPollData] = useState<PollData | null>(null);

  // Reply settings
  const [replySetting, setReplySetting] = useState<ReplySettingType>('anyone');
  const [verifyReplies, setVerifyReplies] = useState(false);

  // Schedule state
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('19:00');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [draftMenuOpen, setDraftMenuOpen] = useState<number | null>(null);

  // Media state
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Pets state
  const [selectedPets, setSelectedPets] = useState<number[]>([]);
  const [pets, setPets] = useState<any[]>([]);

  // Organizations state
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<'user' | 'organization'>('user');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);

  // Location state
  const [location, setLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);

  // Load post data when editing
  useEffect(() => {
    if (editMode && editPost) {
      setContent(editPost.content || '');
      setSelectedPets(Array.isArray(editPost.attached_pets) ? editPost.attached_pets : []);
      if (Array.isArray(editPost.pets) && editPost.pets.length > 0) {
        setPets((prev) => {
          const merged = [...prev];
          for (const pet of editPost.pets!) {
            if (!merged.some((p) => p.id === pet.id)) {
              merged.push(pet);
            }
          }
          return merged;
        });
      }

      if (Array.isArray(editPost.attachments) && editPost.attachments.length > 0) {
        setUploadedMedia(
          editPost.attachments.map((att) => ({
            id: att.id || 0,
            url: att.url,
            media_type:
              att.media_type === 'video' || att.type === 'video' ? 'video' : 'image',
            file_name: att.file_name || '',
            original_name: att.file_name || '',
            file_size: att.size || 0,
            mime_type:
              att.media_type === 'video' || att.type === 'video' ? 'video/mp4' : 'image/jpeg',
            size: att.size || 0,
          })),
        );
      } else {
        setUploadedMedia([]);
      }

      if (editPost.location_lat && editPost.location_lon) {
        setLocation({
          lat: editPost.location_lat,
          lon: editPost.location_lon,
          name: editPost.location_name || 'Местоположение',
        });
      } else {
        setLocation(null);
      }

      if (editPost.poll && Array.isArray(editPost.poll.options)) {
        const normalizedOptions = editPost.poll.options
          .map((opt: any) => {
            if (typeof opt === 'string') return opt;
            return opt.text || opt.option_text || '';
          })
          .filter((opt: string) => opt.trim().length > 0);

        setPollData({
          question: editPost.poll.question,
          options: normalizedOptions,
          multiple_choice: editPost.poll.multiple_choice || false,
          allow_vote_changes: editPost.poll.allow_vote_changes || false,
          anonymous_voting: editPost.poll.anonymous_voting || false,
          expires_at: editPost.poll.expires_at,
        });
        setShowPollCreator(false);
      } else {
        setPollData(null);
      }

      setReplySetting((editPost.reply_setting as ReplySettingType) || 'anyone');
      setVerifyReplies(Boolean(editPost.verify_replies));
      setShowModal(true);
    }
  }, [editMode, editPost]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  // Load drafts when drafts modal opens
  useEffect(() => {
    if (showDrafts) {
      loadDrafts();
      setDraftMenuOpen(null);
    }
  }, [showDrafts]);

  // Load pets when pets modal opens
  useEffect(() => {
    if (showPetsModal) {
      loadPets();
    }
  }, [showPetsModal]);

  // В режиме редактирования нужны имена/аватары выбранных питомцев сразу
  useEffect(() => {
    if (!showModal || selectedPets.length === 0) return;
    const hasAllSelectedPets = selectedPets.every((id) => pets.some((pet) => pet.id === id));
    if (!hasAllSelectedPets) {
      loadPets();
    }
  }, [showModal, selectedPets, pets]);

  // Load organizations on mount
  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  // Load organizations when modal opens
  useEffect(() => {
    if (showModal && user) {
      loadOrganizations();
    }
  }, [showModal, user]);

  const handleSubmit = async () => {
    if (!content.trim() && !pollData && uploadedMedia.length === 0) return;

    console.log('📤 Submitting post with media:', uploadedMedia);

    setIsSubmitting(true);
    try {
      const postData: any = {
        content,
        attached_pets: selectedPets,
        attachments: uploadedMedia.map((media) => ({
          url: media.url,
          type: media.media_type === 'video' ? 'video' : 'image',
          media_type: media.media_type,
          file_name: media.file_name,
        })),
        tags: [],
        author_type: selectedAuthor,
        organization_id: selectedAuthor === 'organization' ? selectedOrganizationId : null,
        location_lat: location?.lat,
        location_lon: location?.lon,
        location_name: location?.name,
        reply_setting: replySetting,
        verify_replies: verifyReplies,
      };

      console.log('📦 Post data attachments:', postData.attachments);

      if (pollData) {
        postData.poll = pollData;
      }

      if (scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':');
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        postData.scheduled_at = scheduledDateTime.toISOString();
        postData.status = 'scheduled';
      } else {
        postData.status = 'published';
      }

      if (editMode && editPost) {
        await apiClient.put(`/api/posts/${editPost.id}`, postData);
        onPostUpdated?.();
      } else {
        await apiClient.post('/api/posts', postData);
        onPostCreated?.();
      }

      resetForm();
    } catch (error) {
      console.error(editMode ? 'Ошибка обновления поста:' : 'Ошибка создания поста:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setUploadedMedia([]);
    setPollData(null);
    setShowPollCreator(false);
    setScheduledDate(null);
    setScheduledTime('19:00');
    setSelectedPets([]);
    setSelectedAuthor('user');
    setSelectedOrganizationId(null);
    setLocation(null);
    setShowModal(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log(
      '📸 Selected files:',
      Array.from(files).map((f) => f.name),
    );

    const remainingSlots = 10 - uploadedMedia.length;
    if (remainingSlots <= 0) {
      alert('Максимум 10 медиа файлов');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const validFiles: File[] = [];
    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой. Максимальный размер: 10MB`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        alert(`Файл "${file.name}" не является изображением`);
        continue;
      }

      validFiles.push(file);
    }

    console.log(
      '✅ Valid files:',
      validFiles.map((f) => f.name),
    );

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const uploaded: UploadedMedia[] = [];
    for (const file of validFiles) {
      try {
        const result = await uploadChunked(file, 'photo');
        if (result) {
          uploaded.push(result);
        }
      } catch (error) {
        console.error(`❌ Ошибка загрузки ${file.name}:`, error);
        alert(`Ошибка загрузки ${file.name}`);
      }
    }

    console.log(
      '📤 Uploaded files:',
      uploaded.map((u) => u.original_name),
    );

    if (uploaded.length > 0) {
      setUploadedMedia((prev) => [...prev, ...uploaded]);
    }

    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - uploadedMedia.length - uploadingFiles.length;
    if (remainingSlots <= 0) {
      alert('Максимум 10 медиа файлов');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const validFiles: { file: File; preview: string }[] = [];
    for (const file of filesToProcess) {
      if (file.size > 100 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой. Максимальный размер: 100MB`);
        continue;
      }

      if (!file.type.startsWith('video/')) {
        alert(`Файл "${file.name}" не является видео`);
        continue;
      }

      const preview = await createVideoThumbnail(file);
      validFiles.push({ file, preview });
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    console.log('🚀 Начинаем chunked загрузку видео...', validFiles.length);

    setUploadingFiles((prev) => [
      ...prev,
      ...validFiles.map((vf) => ({
        ...vf,
        status: 'uploading' as const,
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
      })),
    ]);

    for (const { file, preview } of validFiles) {
      try {
        const result = await uploadChunked(file, 'video', (chunkProgress) => {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.preview === preview
                ? {
                    ...uf,
                    status: chunkProgress.status === 'optimizing' ? 'optimizing' : 'uploading',
                    progress: chunkProgress.percentage,
                    uploadedChunks: chunkProgress.uploadedChunks,
                    totalChunks: chunkProgress.totalChunks,
                  }
                : uf,
            ),
          );
        });

        if (result) {
          setUploadedMedia((prev) => [...prev, result]);
          console.log('✅ Видео добавлено в состояние');
        } else {
          console.error('❌ Не удалось загрузить видео');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        alert(
          `Ошибка загрузки видео: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        );
      }

      setUploadingFiles((prev) => prev.filter((uf) => uf.preview !== preview));
    }

    e.target.value = '';
  };

  const createVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPets = async () => {
    if (!user) return;

    try {
      const petsResponse = await petsApi.getUserPets(user.id);

      if (petsResponse.success && petsResponse.data) {
        const allPets = petsResponse.data;

        const ownerPets = allPets
          .filter((p: any) => p.relationship === 'owner' || !p.relationship)
          .map((pet: any) => ({
            ...pet,
            isOwner: true,
          }));

        const curatorPets = allPets
          .filter((p: any) => p.relationship === 'curator')
          .map((pet: any) => ({
            ...pet,
            isOwner: false,
          }));

        setPets([...ownerPets, ...curatorPets]);
      } else {
        setPets([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки питомцев:', error);
      setPets([]);
    }
  };

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      return;
    }

    try {
      const response = await apiClient.get('/api/organizations/my');
      if (response.success && response.data) {
        setOrganizations(Array.isArray(response.data) ? response.data : []);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      setOrganizations([]);
    }
  };

  const togglePetSelection = (petId: number) => {
    setSelectedPets((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId],
    );
  };

  const loadDrafts = async () => {
    try {
      const response = await apiClient.get('/api/posts/drafts');
      setDrafts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Ошибка загрузки черновиков:', error);
    }
  };

  const saveDraft = async () => {
    if (!content.trim() && uploadedMedia.length === 0) return;

    try {
      await apiClient.post('/api/posts', {
        content,
        attached_pets: [],
        attachments: uploadedMedia.map((media) => ({
          url: media.url,
          type: 'image',
          file_name: media.file_name,
        })),
        tags: [],
        status: 'draft',
      });
      setContent('');
      setUploadedMedia([]);
      setShowSaveDraftDialog(false);
      setShowModal(false);
      setShowDrafts(true);
    } catch (error) {
      console.error('Ошибка сохранения черновика:', error);
    }
  };

  const loadDraft = (draft: any) => {
    setContent(draft.content);
    setShowDrafts(false);
  };

  const deleteDraft = async (draftId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/posts/${draftId}`);
      setDrafts(drafts.filter((d) => d.id !== draftId));
      setDraftMenuOpen(null);
    } catch (error) {
      console.error('Ошибка удаления черновика:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  return {
    // User
    user,

    // Content
    content,
    setContent,
    isSubmitting,

    // Modals
    showModal,
    setShowModal,
    showPollCreator,
    setShowPollCreator,
    showReplySettings,
    setShowReplySettings,
    showDrafts,
    setShowDrafts,
    showScheduleModal,
    setShowScheduleModal,
    showSaveDraftDialog,
    setShowSaveDraftDialog,
    showPetsModal,
    setShowPetsModal,
    showLocationPicker,
    setShowLocationPicker,
    showAuthorDropdown,
    setShowAuthorDropdown,

    // Poll
    pollData,
    setPollData,

    // Reply settings
    replySetting,
    setReplySetting,
    verifyReplies,
    setVerifyReplies,

    // Schedule
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    currentMonth,
    setCurrentMonth,

    // Drafts
    drafts,
    draftMenuOpen,
    setDraftMenuOpen,

    // Media
    uploadedMedia,
    uploadingFiles,

    // Pets
    selectedPets,
    pets,

    // Organizations
    organizations,
    selectedAuthor,
    setSelectedAuthor,
    selectedOrganizationId,
    setSelectedOrganizationId,

    // Location
    location,
    setLocation,

    // Handlers
    handleSubmit,
    handlePhotoUpload,
    handleVideoUpload,
    removePhoto,
    togglePetSelection,
    saveDraft,
    loadDraft,
    deleteDraft,
    handleBackdropClick,
  };
}
