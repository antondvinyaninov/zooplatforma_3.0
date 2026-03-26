'use client';

import { use } from 'react';
import PetProfileLayout from '@/components/modules/pets/profile/PetProfileLayout';

export default function OwnerPetCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);

  return (
    <PetProfileLayout
      petId={petId}
      orgId="owner"
      apiUrl={`/api/owner/pets/${petId}`}
      backUrl="/owner/pets"
      backUrlLabel="Мои питомцы"
    />
  );
}
