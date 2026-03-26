'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PetsTable, { Pet } from '@/components/modules/pets/list/PetsTable';
import PetsEmptyState from '@/components/modules/pets/list/PetsEmptyState';
import AddPetModal from '@/components/modules/pets/list/AddPetModal';

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/petid/pets', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPets(data.pets || []);
      } else {
        setError('Ошибка загрузки питомцев');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#ef4444', fontSize: 13 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16 }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Мои питомцы</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Единый профиль ваших животных
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
        </div>
      </div>

      {/* Состояния */}
      {pets.length === 0 ? (
        <PetsEmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <PetsTable
          pets={pets}
          variant="petid"  // <-- Вариант без org_pet_number
          onRowClick={(pet) => router.push(`/petid/pets/${pet.id}`)}
        />
      )}

      {/* Модальное окно (переиспользуем общее) */}
      {showModal && (
        <AddPetModal
          orgId="petid" // Используем специальный идентификатор для PetID, бекенд должен его понимать или мы адаптируем
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
