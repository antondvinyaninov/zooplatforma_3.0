'use client';

import { useEffect, useState } from 'react';
import { StarIcon, ChatBubbleLeftIcon, PlusCircleIcon, MinusCircleIcon, CalendarIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface AdminReviewResponse {
  id: number;
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_avatar: string;
  rating: number;
  liked_text: string;
  disliked_text: string;
  improvements_text: string;
  created_at: string;
}

interface AdminReviewStats {
  total_reviews: number;
  average_rating: number;
  reviews: AdminReviewResponse[];
}

export default function AdminReviewsPage() {
  const [stats, setStats] = useState<AdminReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/admin/reviews', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch reviews');
        }
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        setError(err.message || 'Произошла ошибка при загрузке отзывов');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        <p className="font-medium">Ошибка</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const reviews = stats?.reviews || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Отзывы пользователей (NPS)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Здесь собраны все отзывы после успешного прохождения онбординга.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Reviews Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Всего отзывов</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.total_reviews || 0}</p>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
            <StarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Средняя оценка (из 10)</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900">
                {(stats?.average_rating || 0) > 0 ? stats!.average_rating.toFixed(1) : '—'}
              </p>
              <div className="flex pb-1 gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon 
                    key={i} 
                    className={`w-4 h-4 ${(stats?.average_rating || 0) >= i * 2 ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Список отзывов</h2>
        </div>
        
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Пока нет ни одного отзыва. Подождите, пока кто-нибудь пройдет онбординг!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User & Rating column */}
                  <div className="lg:w-1/4 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-3">
                      {review.user_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={review.user_avatar} 
                          alt="avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <a 
                          href={`/main/${review.user_id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {review.user_first_name || 'Пользователь'} {review.user_last_name}
                        </a>
                        <div className="flex items-center text-xs text-gray-500 gap-1 mt-0.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-2 bg-yellow-50/50 inline-flex px-2 py-1 rounded-md border border-yellow-100">
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-yellow-700 text-sm">{review.rating} / 10</span>
                    </div>
                  </div>

                  {/* Text feedbacks */}
                  <div className="lg:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50/30 rounded-lg p-3 border border-green-50">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                        <PlusCircleIcon className="w-4 h-4" />
                        Понравилось
                      </h4>
                      <p className="text-sm text-gray-700 break-words">
                        {review.liked_text || <span className="text-gray-400 italic">Нет ответа</span>}
                      </p>
                    </div>

                    <div className="bg-red-50/30 rounded-lg p-3 border border-red-50">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                        <MinusCircleIcon className="w-4 h-4" />
                        Не понравилось
                      </h4>
                      <p className="text-sm text-gray-700 break-words">
                        {review.disliked_text || <span className="text-gray-400 italic">Нет ответа</span>}
                      </p>
                    </div>

                    <div className="bg-blue-50/30 rounded-lg p-3 border border-blue-50">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        Идеи / Предложения
                      </h4>
                      <p className="text-sm text-gray-700 break-words">
                        {review.improvements_text || <span className="text-gray-400 italic">Нет ответа</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
