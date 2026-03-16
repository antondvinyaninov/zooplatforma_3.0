'use client';

import { XMarkIcon, EllipsisHorizontalIcon, UserIcon } from '@heroicons/react/24/outline';

interface CreatePostDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: any[];
  userName?: string;
  onLoadDraft: (draft: any) => void;
  onDeleteDraft: (draftId: number, e: React.MouseEvent) => void;
  draftMenuOpen: number | null;
  setDraftMenuOpen: (id: number | null) => void;
}

export default function CreatePostDraftsModal({
  isOpen,
  onClose,
  drafts,
  userName,
  onLoadDraft,
  onDeleteDraft,
  draftMenuOpen,
  setDraftMenuOpen,
}: CreatePostDraftsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-4 overflow-y-auto backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setDraftMenuOpen(null);
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[600px] shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => {
              onClose();
              setDraftMenuOpen(null);
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" strokeWidth={2} />
          </button>
          <h3 className="font-bold text-[16px]">Черновики</h3>
          <div className="w-8"></div>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Черновиков пока нет</p>
            </div>
          ) : (
            <div>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="relative border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <button onClick={() => onLoadDraft(draft)} className="w-full p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold flex-shrink-0 text-[14px]">
                        {userName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-gray-900 line-clamp-3">
                          {draft.content}
                        </div>
                        <div className="text-[13px] text-gray-500 mt-1">
                          {new Date(draft.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Three dots menu */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftMenuOpen(draftMenuOpen === draft.id ? null : draft.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600" strokeWidth={2} />
                    </button>

                    {/* Dropdown menu */}
                    {draftMenuOpen === draft.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                        <button
                          onClick={(e) => onDeleteDraft(draft.id, e)}
                          className="w-full px-4 py-3 text-left text-[15px] text-red-600 hover:bg-gray-50 transition-colors"
                        >
                          Удалить черновик
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
