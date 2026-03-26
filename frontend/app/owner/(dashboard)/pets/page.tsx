'use client';

import { useEffect } from 'react';
import PetsListLayout from '@/components/modules/pets/list/PetsListLayout';

import { useBreadcrumb } from '@/components/BreadcrumbContext';

export default function PetsPage() {
  const { setItems } = useBreadcrumb();

  useEffect(() => {
    setItems([{ label: 'Мои питомцы' }]);
  }, [setItems]);

  return (
    <PetsListLayout
      title="Мои питомцы"
      subtitle="Управление вашими питомцами"
      apiUrl="/api/owner/pets"
      orgId="owner"
      variant="owner"
      petRoutePrefix="/owner/pets"
    />
  );
}
