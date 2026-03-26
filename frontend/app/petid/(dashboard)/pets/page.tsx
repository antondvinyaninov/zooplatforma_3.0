'use client';

import PetsListLayout from '@/components/modules/pets/list/PetsListLayout';

export default function PetsPage() {
  return (
    <PetsListLayout
      title="Мои питомцы"
      subtitle="Единый профиль ваших животных"
      apiUrl="/api/petid/pets"
      orgId="petid"
      variant="petid"
      petRoutePrefix="/petid/pets"
    />
  );
}
