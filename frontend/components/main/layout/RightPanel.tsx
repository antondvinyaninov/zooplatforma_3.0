'use client';

import { useAuth } from '@/contexts/AuthContext';
import FriendsListWidget from '../profile/FriendsListWidget';
import FriendSkeleton from '../profile/FriendSkeleton';

export default function RightPanel() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border border-white/60 flex gap-4 overflow-hidden">
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
      <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-5">
        <FriendsListWidget userId={user.id} limit={6} />
      </div>
    </div>
  );
}
