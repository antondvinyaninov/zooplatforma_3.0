'use client';

import { use } from 'react';
import PetProfileLayout from '@/components/modules/pets/profile/PetProfileLayout';

export default function PethelperPetCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);

  return (
    <PetProfileLayout
      petId={petId}
      orgId="pethelper"
      apiUrl={`/api/pethelper/pets/${petId}`}
      backUrl="/pethelper/pets"
      backUrlLabel="Мои подопечные"
      catalogToggle={true}
      showFundraising={true}
    />
  );
}
