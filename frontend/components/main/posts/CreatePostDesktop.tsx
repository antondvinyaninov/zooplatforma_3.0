'use client';

import { useCreatePost } from '../../../app/main/hooks/useCreatePost';
import CreatePostTrigger from './CreatePostTrigger';
import CreatePostModal from './CreatePostModal';
import CreatePostDraftsModal from './CreatePostDraftsModal';
import CreatePostScheduleModal from './CreatePostScheduleModal';
import CreatePostPetsModal from './CreatePostPetsModal';
import LocationMap from '../shared/LocationMap';

interface CreatePostDesktopProps {
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

export default function CreatePostDesktop(props: CreatePostDesktopProps) {
  const hookData = useCreatePost(props);
  const { user } = hookData;

  if (!user) return null;

  return (
    <>
      {/* Trigger Button */}
      <CreatePostTrigger
        userAvatar={user.avatar}
        userName={user?.first_name || user?.name || ''}
        onOpenModal={() => hookData.setShowModal(true)}
      />

      {/* Main Modal */}
      <CreatePostModal
        isOpen={hookData.showModal}
        user={hookData.user}
        content={hookData.content}
        setContent={hookData.setContent}
        isSubmitting={hookData.isSubmitting}
        handleSubmit={hookData.handleSubmit}
        onClose={() => {
          if (hookData.content.trim() || hookData.uploadedMedia.length > 0) {
            hookData.setShowSaveDraftDialog(true);
          } else {
            hookData.setShowModal(false);
          }
        }}
        onOpenDrafts={() => {
          if (hookData.content.trim() || hookData.uploadedMedia.length > 0) {
            hookData.setShowSaveDraftDialog(true);
          } else {
            hookData.setShowDrafts(true);
          }
        }}
        onOpenSchedule={() => hookData.setShowScheduleModal(true)}
        showPollCreator={hookData.showPollCreator}
        setShowPollCreator={hookData.setShowPollCreator}
        pollData={hookData.pollData}
        setPollData={hookData.setPollData}
        uploadedMedia={hookData.uploadedMedia}
        uploadingFiles={hookData.uploadingFiles}
        removePhoto={hookData.removePhoto}
        handlePhotoUpload={hookData.handlePhotoUpload}
        handleVideoUpload={hookData.handleVideoUpload}
        selectedPets={hookData.selectedPets}
        pets={hookData.pets}
        onOpenPetsModal={() => hookData.setShowPetsModal(true)}
        togglePetSelection={hookData.togglePetSelection}
        organizations={hookData.organizations}
        selectedAuthor={hookData.selectedAuthor}
        setSelectedAuthor={hookData.setSelectedAuthor}
        selectedOrganizationId={hookData.selectedOrganizationId}
        setSelectedOrganizationId={hookData.setSelectedOrganizationId}
        showAuthorDropdown={hookData.showAuthorDropdown}
        setShowAuthorDropdown={hookData.setShowAuthorDropdown}
        location={hookData.location}
        setLocation={hookData.setLocation}
        onOpenLocationPicker={() => hookData.setShowLocationPicker(true)}
        scheduledDate={hookData.scheduledDate}
        scheduledTime={hookData.scheduledTime}
        setScheduledDate={hookData.setScheduledDate}
        setScheduledTime={hookData.setScheduledTime}
        showReplySettings={hookData.showReplySettings}
        setShowReplySettings={hookData.setShowReplySettings}
        replySetting={hookData.replySetting}
        setReplySetting={hookData.setReplySetting}
        verifyReplies={hookData.verifyReplies}
        setVerifyReplies={hookData.setVerifyReplies}
        handleBackdropClick={hookData.handleBackdropClick}
      />

      {/* Drafts Modal */}
      <CreatePostDraftsModal
        isOpen={hookData.showDrafts}
        onClose={() => hookData.setShowDrafts(false)}
        drafts={hookData.drafts}
        userName={hookData.user?.name}
        onLoadDraft={hookData.loadDraft}
        onDeleteDraft={hookData.deleteDraft}
        draftMenuOpen={hookData.draftMenuOpen}
        setDraftMenuOpen={hookData.setDraftMenuOpen}
      />

      {/* Schedule Modal */}
      <CreatePostScheduleModal
        isOpen={hookData.showScheduleModal}
        onClose={() => hookData.setShowScheduleModal(false)}
        scheduledDate={hookData.scheduledDate}
        setScheduledDate={hookData.setScheduledDate}
        scheduledTime={hookData.scheduledTime}
        setScheduledTime={hookData.setScheduledTime}
        currentMonth={hookData.currentMonth}
        setCurrentMonth={hookData.setCurrentMonth}
      />

      {/* Pets Modal */}
      <CreatePostPetsModal
        isOpen={hookData.showPetsModal}
        onClose={() => hookData.setShowPetsModal(false)}
        pets={hookData.pets}
        selectedPets={hookData.selectedPets}
        onTogglePet={hookData.togglePetSelection}
      />

      {/* Location Map Modal */}
      {hookData.showLocationPicker && (
        <LocationMap
          onLocationSelect={(loc) => {
            hookData.setLocation(loc);
            hookData.setShowLocationPicker(false);
          }}
          onClose={() => hookData.setShowLocationPicker(false)}
        />
      )}

      {/* Save Draft Dialog */}
      {hookData.showSaveDraftDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <h3 className="font-bold text-[18px] mb-2">Сохранить как черновик?</h3>
              <p className="text-[14px] text-gray-500">
                Сохранить как черновик, чтобы отредактировать и отправить позже.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={hookData.saveDraft}
                className="w-full py-3 text-[15px] font-semibold hover:bg-gray-50 transition-colors"
              >
                Сохранить
              </button>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={() => {
                  hookData.setShowSaveDraftDialog(false);
                  hookData.setShowModal(false);
                  hookData.setContent('');
                  hookData.setLocation(null);
                }}
                className="w-full py-3 text-[15px] text-red-500 font-semibold hover:bg-gray-50 transition-colors"
              >
                Не сохранять
              </button>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={() => hookData.setShowSaveDraftDialog(false)}
                className="w-full py-3 text-[15px] hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
