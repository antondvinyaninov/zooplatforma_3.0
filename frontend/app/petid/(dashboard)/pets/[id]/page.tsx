'use client';

import { use } from 'react';
import PetProfileLayout from '@/components/modules/pets/profile/PetProfileLayout';

export default function PetIDPetCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);

  return (
    <PetProfileLayout
      petId={petId}
      orgId="petid"
      apiUrl={`/api/petid/pets/${petId}`}
      backUrl="/petid/pets"
      backUrlLabel="Мои питомцы"
    />
  );
}
