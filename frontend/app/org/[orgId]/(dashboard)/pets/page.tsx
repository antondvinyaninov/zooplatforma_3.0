'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import PetsTable, { Pet } from '@/components/pets/list/PetsTable';
import PetsEmptyState from '@/components/pets/list/PetsEmptyState';
import AddPetModal from '@/components/pets/list/AddPetModal';

export default function PetsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPets();
  }, [orgId]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/org/${orgId}/pets`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16 }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Питомцы</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Справочник животных организации
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            + Добавить питомца
          </button>
          <button
            title="Настройка столбцов"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', cursor: 'pointer', color: '#6b7280', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Состояния */}
      {loading ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Загрузка...</div>
      ) : pets.length === 0 ? (
        <PetsEmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <PetsTable
          pets={pets}
          variant="shelter"
          onRowClick={(pet) => router.push(`/org/${orgId}/pets/${pet.id}`)}
        />
      )}

      {/* Модальное окно */}
      {showModal && (
        <AddPetModal
          orgId={orgId}
          onClose={() => setShowModal(false)}
          onSuccess={async () => {
            setShowModal(false);
            await fetchPets();
          }}
        />
      )}
    </div>
  );
}
