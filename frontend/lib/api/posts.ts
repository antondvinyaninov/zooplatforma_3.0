import { apiClient } from './client';
import { Post, Comment } from './types';

export interface CursorPaginationResponse<T> {
  data: T;
  next_cursor: number | null;
}

// API методы для постов
export const postsApi = {
  getAll: (params?: { limit?: number; offset?: number; filter?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params?.filter) queryParams.append('filter', params.filter);
    const queryString = queryParams.toString();
    return apiClient.get<Post[]>(
      `/api/posts${queryString ? `?${queryString}` : ''}`,
    );
  },

  getUserPosts: (userId: number, params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    return apiClient.get<Post[]>(
      `/api/posts/user/${userId}${queryString ? `?${queryString}` : ''}`,
    );
  },

  getPostByID: (id: number) => apiClient.get<Post>(`/api/posts/${id}`),

  getPetPosts: (petId: number, params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    return apiClient.get<Post[]>(
      `/api/posts/pet/${petId}${queryString ? `?${queryString}` : ''}`,
    );
  },

  getOrganizationPosts: (orgId: number, params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
    const queryString = queryParams.toString();
    return apiClient.get<Post[]>(
      `/api/posts/organization/${orgId}${queryString ? `?${queryString}` : ''}`,
    );
  },

  create: (data: { content: string; post_type?: string }) =>
    apiClient.post<Post>('/api/posts', data),

  update: (id: number, data: { content?: string; post_type?: string }) =>
    apiClient.put<Post>(`/api/posts/${id}`, data),

  delete: (id: number) => apiClient.delete<{ message: string }>(`/api/posts/${id}`),

  // Лайки
  toggleLike: (postId: number, reactionType?: string) =>
    apiClient.post<{ liked: boolean; likes_count: number; reaction_type: string }>(`/api/posts/${postId}/like`, { 
      reaction_type: reactionType || 'like' 
    }),

  getLikeStatus: (postId: number) =>
    apiClient.get<{ liked: boolean; likes_count: number; reaction_type?: string }>(`/api/posts/${postId}/like`),

  getLikers: (postId: number) =>
    apiClient.get<Array<{ id: number; name: string; last_name?: string; avatar?: string; first_name?: string; avatar_url?: string; reaction_type?: string }>>(
      `/api/posts/${postId}/likers`,
    ),
};

// API методы для комментариев
export const commentsApi = {
  getPostComments: (postId: number) => apiClient.get<Comment[]>(`/api/comments/post/${postId}`),

  create: (
    postId: number,
    data: { content: string; parent_id?: number; reply_to_user_id?: number; attachments?: File[] },
  ) => {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('content', data.content);
      if (data.parent_id) formData.append('parent_id', data.parent_id.toString());
      if (data.reply_to_user_id) formData.append('reply_to_user_id', data.reply_to_user_id.toString());
      data.attachments.forEach((file) => formData.append('attachments', file));
      return apiClient.post<Comment>(`/api/comments/post/${postId}`, formData);
    }
    
    // Fallback to JSON if no attachments
    return apiClient.post<Comment>(`/api/comments/post/${postId}`, {
      content: data.content,
      parent_id: data.parent_id,
      reply_to_user_id: data.reply_to_user_id,
    });
  },

  delete: (commentId: number) =>
    apiClient.delete<{ message: string }>(`/api/comments/${commentId}`),
    
  approve: (commentId: number) =>
    apiClient.post<{ message: string }>(`/api/comments/${commentId}/approve`, {}),

  reject: (commentId: number) =>
    apiClient.post<{ message: string }>(`/api/comments/${commentId}/reject`, {}),  
};
