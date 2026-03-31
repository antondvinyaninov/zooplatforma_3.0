import { use } from 'react';
import OrgStaffProfile from '@/components/modules/org/staff/OrgStaffProfile';

export default function StaffProfilePage({ params }: { params: Promise<{ orgId: string, staffId: string }> }) {
  const { orgId, staffId } = use(params);
  return <OrgStaffProfile orgId={orgId} staffId={staffId} />;
}
