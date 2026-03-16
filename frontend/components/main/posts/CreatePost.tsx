'use client';

import CreatePostMobile from './CreatePostMobile';
import CreatePostDesktop from './CreatePostDesktop';

interface CreatePostProps {
  onPostCreated?: () => void;
  editMode?: boolean;
  editPost?: {
    id: number;
    content: string;
    attached_pets?: number[];
    pets?: any[];
    attachments?: any[];
    tags?: string[];
    poll?: any;
    location_lat?: number;
    location_lon?: number;
    location_name?: string;
    reply_setting?: string;
    verify_replies?: boolean;
  };
  onPostUpdated?: () => void;
}

export default function CreatePost(props: CreatePostProps) {
  return (
    <>
      {/* Mobile version - показывается на экранах < 768px */}
      <div className="block md:hidden">
        <CreatePostMobile {...props} />
      </div>

      {/* Desktop version - показывается на экранах >= 768px */}
      <div className="hidden md:block">
        <CreatePostDesktop {...props} />
      </div>
    </>
  );
}
