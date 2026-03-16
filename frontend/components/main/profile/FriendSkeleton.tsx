import React from 'react';

export default function FriendSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 animate-pulse">
      {/* Avatar Placeholder */}
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      {/* Name Placeholder */}
      <div className="h-3 bg-gray-200 rounded w-16 mt-1" />
    </div>
  );
}
