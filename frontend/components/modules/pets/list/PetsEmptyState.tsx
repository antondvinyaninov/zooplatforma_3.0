'use client';

interface PetsEmptyStateProps {
  onAdd: () => void;
}

export default function PetsEmptyState({ onAdd }: PetsEmptyStateProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '64px 24px',
      textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
        Питомцев пока нет
      </div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
        Добавьте первого питомца организации
      </div>
      <button
        onClick={onAdd}
        style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}
      >
        + Добавить питомца
      </button>
    </div>
  );
}
