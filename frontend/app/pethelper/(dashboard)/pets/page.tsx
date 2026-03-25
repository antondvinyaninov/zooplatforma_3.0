'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PetsTable, { Pet } from '@/components/pets/list/PetsTable';
import PetsEmptyState from '@/components/pets/list/PetsEmptyState';
import AddPetModal from '@/components/pets/list/AddPetModal';

import { useBreadcrumb } from '@/components/BreadcrumbContext';

export default function PetsPage() {
  const router = useRouter();
  const { setItems } = useBreadcrumb();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = 'Мои подопечные - Кабинет зоопомощника';
    setItems([{ label: 'Мои подопечные' }]);
    fetchPets();
  }, [setItems]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pethelper/pets', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const petsData = data.pets || data.data || [];
        setPets(Array.isArray(petsData) ? petsData : []);
      } else {
        setError('Ошибка загрузки подопечных');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Загрузка...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои подопечные</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Питомцы, за которыми вы ухаживаете
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Добавить подопечного
        </button>
      </div>

      {/* Состояния */}
      {pets.length === 0 ? (
        <PetsEmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <PetsTable
          pets={pets}
          variant="pethelper"
          onRowClick={(pet) => router.push(`/pethelper/pets/${pet.id}`)}
        />
      )}

      {/* Модальное окно */}
      {showModal && (
        <AddPetModal
          orgId="pethelper"
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
