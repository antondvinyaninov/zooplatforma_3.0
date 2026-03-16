import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-2.5 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar Placeholder */}
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        
        {/* User Info Placeholder */}
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>

        {/* Menu dot placeholder */}
        <div className="w-6 h-6 rounded-full bg-gray-100" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>

      {/* Media Placeholder (Optional, making it look organic) */}
      <div className="h-48 bg-gray-100 rounded-lg w-full mb-4" />

      {/* Footer / Actions Skeleton */}
      <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
        <div className="flex gap-2 items-center">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <div className="w-8 h-3 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
          <div className="w-8 h-3 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <div className="w-5 h-5 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
