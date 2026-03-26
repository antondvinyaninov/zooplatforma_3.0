'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import PetProfileLayout from '@/components/modules/pets/profile/PetProfileLayout';
import { getActiveModules } from '../../layout';

export default function PetCardPage({ params }: { params: Promise<{ orgId: string; petId: string }> }) {
  const { orgId, petId } = use(params);
  const [registrationModuleActive, setRegistrationModuleActive] = useState(false);

  useEffect(() => {
    setRegistrationModuleActive(getActiveModules(orgId).includes('pet-registration'));
    const handler = () => setRegistrationModuleActive(getActiveModules(orgId).includes('pet-registration'));
    window.addEventListener('org-modules-changed', handler);
    return () => window.removeEventListener('org-modules-changed', handler);
  }, [orgId]);

  return (
    <PetProfileLayout
      petId={petId}
      orgId={orgId}
      apiUrl={`/api/org/${orgId}/pets/${petId}`}
      backUrl={`/org/${orgId}/pets`}
      backUrlLabel="Питомцы"
      catalogToggle={true}
      showFundraising={true}
      showRegistrationButton={registrationModuleActive}
    />
  );
}
