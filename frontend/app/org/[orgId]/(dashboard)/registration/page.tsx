'use client';

import { use } from 'react';
import RegistrationsList from '@/components/modules/pet-registration/list/RegistrationsList';

export default function RegistrationsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  return <RegistrationsList orgId={orgId} />;
}
