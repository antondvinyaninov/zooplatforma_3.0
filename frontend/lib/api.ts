// Re-export core clients
export { apiClient, authClient } from './api/client';

// Re-export all types
export * from './api/types';

// Re-export API domains
export { authApi } from './api/auth';
export { usersApi, profileApi } from './api/users';
export { postsApi, commentsApi } from './api/posts';
export { petsApi } from './api/pets';
export { friendsApi } from './api/friends';
export { followersApi } from './api/followers';
export { notificationsApi } from './api/notifications';
export { pollsApi } from './api/polls';
export { announcementsApi } from './api/announcements';
export { reportsApi } from './api/reports';
export { adminActivityApi } from './api/admin';
export { organizationsApi } from './api/organizations';
