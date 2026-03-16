interface PetQuickActionsProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onBackToList: () => void;
}

export default function PetQuickActions({
  isEditing,
  setIsEditing,
  onBackToList,
}: PetQuickActionsProps) {
  if (isEditing) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Быстрые действия</h2>

      <div className="space-y-2">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ✏️ Редактировать
        </button>
        <button
          onClick={onBackToList}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          📋 К списку питомцев
        </button>
      </div>
    </div>
  );
}
