'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PetsTable, { Pet } from '@/components/modules/pets/list/PetsTable';
import PetsEmptyState from '@/components/modules/pets/list/PetsEmptyState';
import AddPetModal from '@/components/modules/pets/list/AddPetModal';

type PetsTableVariant = 'shelter' | 'owner' | 'pethelper' | 'petid';

interface PetsListLayoutProps {
  title: string;
  subtitle: string;
  apiUrl: string;
  orgId: string;
  variant: PetsTableVariant;
  petRoutePrefix: string;
  extraHeaderActions?: React.ReactNode;
}

export default function PetsListLayout({
  title,
  subtitle,
  apiUrl,
  orgId,
  variant,
  petRoutePrefix,
  extraHeaderActions
}: PetsListLayoutProps) {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const petsData = data.pets || data.data || [];
        setPets(Array.isArray(petsData) ? petsData : []);
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

  useEffect(() => {
    fetchPets();
  }, [apiUrl]);

  if (loading) {
    return <div className="p-4 sm:p-6 text-gray-500">Загрузка...</div>;
  }

  if (error) {
    return <div className="p-4 sm:p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Заголовок */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {subtitle}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {extraHeaderActions}
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Добавить питомца
          </button>
        </div>
      </div>

      {/* Состояния таблица/пусто */}
      {pets.length === 0 ? (
        <PetsEmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <PetsTable
          pets={pets}
          variant={variant}
          onRowClick={(pet) => router.push(`${petRoutePrefix}/${pet.id}`)}
        />
      )}

      {/* Модальное окно создания */}
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
