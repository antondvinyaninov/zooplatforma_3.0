'use client';

import { useEffect } from 'react';
import PetsListLayout from '@/components/modules/pets/list/PetsListLayout';

import { useBreadcrumb } from '@/components/BreadcrumbContext';

export default function PetsPage() {
  const { setItems } = useBreadcrumb();

  useEffect(() => {
    document.title = 'Мои подопечные - Кабинет зоопомощника';
    setItems([{ label: 'Мои подопечные' }]);
  }, [setItems]);

  return (
    <PetsListLayout
      title="Мои подопечные"
      subtitle="Питомцы, за которыми вы ухаживаете"
      apiUrl="/api/pethelper/pets"
      orgId="pethelper"
      variant="pethelper"
      petRoutePrefix="/pethelper/pets"
    />
  );
}
