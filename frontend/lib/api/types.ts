export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface User {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  avatar?: string;
  cover_photo?: string;
  profile_visibility?: string;
  show_phone?: string;
  show_email?: string;
  allow_messages?: string;
  show_online?: string;
  verified?: boolean;
  verified_at?: string;
  created_at?: string;
  last_seen?: string; // Время последней активности
  is_online?: boolean; // Онлайн статус (активен в последние 5 минут)
  followers_count?: number;
  following_count?: number;
}

export interface Post {
  id: number;
  author_id: number;
  author_type: string;
  content: string;
  post_type?: string;
  attached_pets: number[];
  attachments: Attachment[];
  tags: string[];
  status: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  user?: User;
  organization?: Organization;
  pets?: Pet[];
  poll?: Poll;
  has_poll?: boolean; // Есть ли опрос у поста
  comments_count: number;
  // Лайки
  liked?: boolean;
  likes_count?: number;
  // Геолокация
  location_lat?: number;
  location_lon?: number;
  location_name?: string;
  // Настройки ответов
  reply_setting?: string;
  verify_replies?: boolean;
}

export interface Attachment {
  url: string;
  type: string;
  file_name?: string;
  size?: number;
  media_type?: string;
  [key: string]: unknown;
}

export interface Poll {
  id: number;
  post_id: number;
  question: string;
  options: PollOption[];
  multiple_choice: boolean;
  allow_vote_changes: boolean;
  anonymous_voting: boolean;
  end_date?: string;
  expires_at?: string;
  created_at: string;
  total_votes: number;
  total_voters: number;
  user_voted: boolean;
  user_votes?: number[];
  is_expired: boolean;
  voters?: PollVoter[];
}

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  votes_count: number;
  percentage: number;
  user_voted: boolean;
}

export interface PollVoter {
  user_id: number;
  user_name: string;
  user_avatar?: string;
  voted_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  parent_id?: number;
  reply_to_user_id?: number;
  status?: string; // e.g. 'published', 'pending', 'rejected'
  user?: User;
  reply_to_user?: User;
  replies?: Comment[];
  attachments?: Attachment[];
}

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  birth_date?: string;
  color?: string;
  photo?: string;
  photo_url?: string;
  relationship?: 'owner' | 'curator';
  status?: string;
  is_sterilized?: boolean;
  is_vaccinated?: boolean;
  chip_number?: string;
  region?: string;
  city?: string;
  urgent?: boolean;
  contact_name?: string;
  contact_phone?: string;
  organization_id?: number;
  created_at: string;
  user?: User;
}

// Типы для друзей
export interface Friend {
  id: number;
  name: string;
  last_name?: string;
  avatar?: string;
  location?: string;
  is_online?: boolean;
  created_at: string;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at?: string;
  friend: Friend;
}

export interface FriendshipStatus {
  id?: number;
  status: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
  is_outgoing?: boolean;
  created_at?: string;
}

// Типы для уведомлений
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  actor_id?: number;
  actor?: {
    id: number;
    name: string;
    last_name?: string;
    avatar?: string;
  };
}

// Типы для объявлений
export interface Announcement {
  id: number;
  title: string;
  description: string;
  category: string;
  price?: number;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    last_name?: string;
    avatar?: string;
  };
}

// Типы для организаций
export interface Organization {
  id: number;
  name: string;
  short_name?: string;
  legal_form?: string;
  type: string;
  inn: string;
  ogrn?: string;
  kpp?: string;
  registration_date?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_full?: string;
  address_postal_code?: string;
  address_region?: string;
  address_city?: string;
  address_street?: string;
  address_house?: string;
  address_office?: string;
  geo_lat?: number;
  geo_lon?: number;
  description?: string;
  bio?: string;
  logo?: string;
  cover_photo?: string;
  director_name?: string;
  director_position?: string;
  owner_user_id: number;
  profile_visibility?: string;
  show_phone?: string;
  show_email?: string;
  allow_messages?: string;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  short_name?: string;
  legal_form?: string;
  type: string;
  inn: string;
  ogrn?: string;
  kpp?: string;
  registration_date?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_full?: string;
  address_postal_code?: string;
  address_region?: string;
  address_city?: string;
  address_street?: string;
  address_house?: string;
  address_office?: string;
  geo_lat?: number | null;
  geo_lon?: number | null;
  description?: string;
  bio?: string;
  director_name?: string;
  director_position?: string;
}
