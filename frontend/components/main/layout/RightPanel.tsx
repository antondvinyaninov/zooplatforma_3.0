'use client';

import { useAuth } from '@/contexts/AuthContext';
import FriendsListWidget from '../profile/FriendsListWidget';
import FriendSkeleton from '../profile/FriendSkeleton';

export default function RightPanel() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex gap-4 overflow-hidden">
          <FriendSkeleton />
          <FriendSkeleton />
          <FriendSkeleton />
          <FriendSkeleton />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* Friends */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <FriendsListWidget userId={user.id} limit={6} />
      </div>
    </div>
  );
}
