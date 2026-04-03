export interface User {
  id: number;
  name: string;
  last_name: string;
  avatar?: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  file_name?: string;
  url?: string;
  type?: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  attachments?: MessageAttachment[];
  sender?: User;
}

export interface Chat {
  id: number;
  type?: string; 
  name?: string;
  avatar_url?: string;
  other_user?: User; // fallback for direct chats
  last_message?: Message;
  last_message_at?: string;
  unread_count: number;
  participants_count?: number;
}
