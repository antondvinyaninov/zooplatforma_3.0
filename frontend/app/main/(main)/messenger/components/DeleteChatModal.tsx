import { useState } from 'react';

interface DeleteChatModalProps {
  chatName: string;
  onClose: () => void;
  onConfirm: (forAll: boolean) => void;
}

export default function DeleteChatModal({ chatName, onClose, onConfirm }: DeleteChatModalProps) {
  const [forAll, setForAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = () => {
    setIsDeleting(true);
    onConfirm(forAll);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[24px] w-full max-w-[400px] overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-[20px] font-semibold text-center text-gray-900 mb-2">
            Удалить чат?
          </h3>
          
          <p className="text-[15px] leading-relaxed text-center text-gray-500 mb-6">
            Вы уверены, что хотите удалить историю переписки с <span className="font-medium text-gray-900">{chatName}</span>? Это действие нельзя отменить.
          </p>

          <label className="flex items-start gap-3 p-3 mb-6 bg-gray-50 hover:bg-gray-100/80 cursor-pointer rounded-xl transition-colors border border-gray-100">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={forAll}
                onChange={(e) => setForAll(e.target.checked)}
                className="w-4 h-4 text-red-500 bg-white border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-medium text-gray-900">Также удалить для {chatName}</span>
              <span className="text-[13px] text-gray-500">История будет стёрта у обоих собеседников</span>
            </div>
          </label>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="w-full py-3.5 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-[14px] font-medium transition-colors"
            >
              {isDeleting ? 'Удаление...' : 'Удалить чат'}
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 rounded-[14px] font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
