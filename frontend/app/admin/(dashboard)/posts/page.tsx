'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/components/main/shared/ConfirmModal';

interface Post {
  id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  media_urls?: string;
  attachments?: string;
  tags?: string;
  poll?: {
    id: number;
    question: string;
    multiple_choice: boolean;
    expires_at?: string;
    options: Array<{
      id: number;
      text: string;
      votes_count: number;
    }>;
  } | null;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, searchQuery]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/main/api/posts/with-polls', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setPosts(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.content.toLowerCase().includes(query) ||
          post.user_name?.toLowerCase().includes(query),
      );
    }

    setFilteredPosts(filtered);
  };

  const handleDelete = async (postId: number) => {
    setIsDeletingPost(true);
    try {
      const response = await fetch(`/main/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Пост успешно удалён!');
        loadPosts();
      } else {
        alert('Ошибка при удалении поста');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Ошибка при удалении поста');
    } finally {
      setIsDeletingPost(false);
      setPostToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Управление постами</h1>
          </div>
          <p className="text-gray-600">Модерация и управление постами пользователей</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего постов</p>
                <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего лайков</p>
                <p className="text-2xl font-bold text-red-600">
                  {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
                </p>
              </div>
              <span className="text-4xl">❤️</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего комментариев</p>
                <p className="text-2xl font-bold text-blue-600">
                  {posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)}
                </p>
              </div>
              <span className="text-4xl">💬</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по содержанию или автору..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Посты не найдены</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              let mediaUrls: string[] = [];
              let attachments: any[] = [];
              let poll: any = null;

              try {
                if (post.media_urls) {
                  mediaUrls =
                    typeof post.media_urls === 'string'
                      ? JSON.parse(post.media_urls)
                      : post.media_urls;
                }
                if (post.attachments) {
                  attachments =
                    typeof post.attachments === 'string'
                      ? JSON.parse(post.attachments)
                      : post.attachments;
                }
                if (post.poll) {
                  poll = post.poll;
                  // Если options это строка, парсим её
                  if (poll.options && typeof poll.options === 'string') {
                    poll.options = JSON.parse(poll.options);
                  }
                }
              } catch (e) {
                console.error('Error parsing data:', e, post);
              }

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {post.user_name || `User #${post.user_id}`}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                      </div>
                      {post.content && (
                        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                      )}

                      {/* Media URLs */}
                      {mediaUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {mediaUrls.map((url, idx) => (
                            <div key={idx} className="relative">
                              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                  src={url}
                                  alt=""
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              ) : url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video src={url} controls className="w-full rounded-lg" />
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  📎 {url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attachments (photos, videos, etc) */}
                      {attachments.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {attachments.map((att: any, idx: number) => (
                            <div
                              key={idx}
                              className="relative rounded-lg overflow-hidden bg-gray-100"
                            >
                              {att.type === 'image' ? (
                                <img
                                  src={att.url}
                                  alt={att.file_name || 'Image'}
                                  className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : att.type === 'video' ? (
                                <video
                                  src={att.url}
                                  controls
                                  className="w-full max-h-96 bg-black"
                                  preload="metadata"
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 text-blue-600 hover:text-blue-800 hover:bg-gray-50 transition-colors"
                                >
                                  📎 {att.file_name || att.url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Poll */}
                      {poll && poll.question && Array.isArray(poll.options) && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">📊</span>
                            <h4 className="font-semibold text-gray-900">{poll.question}</h4>
                          </div>

                          <div className="space-y-2">
                            {poll.options.map((option: any) => {
                              const totalVotes = poll.options.reduce(
                                (sum: number, opt: any) => sum + (opt.votes_count || 0),
                                0,
                              );
                              const percentage =
                                totalVotes > 0
                                  ? Math.round((option.votes_count / totalVotes) * 100)
                                  : 0;

                              return (
                                <div key={option.id} className="relative">
                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 relative overflow-hidden">
                                    <div
                                      className="absolute left-0 top-0 h-full bg-purple-100 transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className="relative z-10 font-medium text-gray-900">
                                      {option.text}
                                    </span>
                                    <span className="relative z-10 text-sm text-gray-600">
                                      {option.votes_count} ({percentage}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Всего голосов:{' '}
                              {poll.options.reduce(
                                (sum: number, opt: any) => sum + (opt.votes_count || 0),
                                0,
                              )}
                            </span>
                            {poll.multiple_choice && <span>• Множественный выбор</span>}
                            {poll.expires_at && (
                              <span>• Истекает: {formatDate(poll.expires_at)}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>❤️ {post.likes_count || 0} лайков</span>
                      <span>💬 {post.comments_count || 0} комментариев</span>
                      <span className="text-gray-400">ID: {post.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:3000/?post=${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Просмотр
                      </a>
                      <button
                        onClick={() => setPostToDelete(post.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={postToDelete !== null}
        title="Удалить пост?"
        message="Это действие нельзя отменить. Пост будет удален из ленты."
        confirmText="Удалить"
        loading={isDeletingPost}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => {
          if (postToDelete !== null) {
            void handleDelete(postToDelete);
          }
        }}
      />
    </div>
  );
}
