import { use } from 'react';
import OrgStaffList from '@/components/modules/org/staff/OrgStaffList';

export default function StaffPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  return <OrgStaffList orgId={orgId} />;
}
