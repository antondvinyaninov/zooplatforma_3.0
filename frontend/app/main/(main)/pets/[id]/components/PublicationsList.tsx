'use client';

import { useState } from 'react';
import { Pet, Post } from '../../../../../../lib/api';
import PostCard from '../../../../../../components/main/posts/PostCard';

interface PublicationsListProps {
  pet: Pet;
  posts: Post[];
  postsLoading: boolean;
}

export default function PublicationsList({ pet, posts, postsLoading }: PublicationsListProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Фейковые посты для демонстрации
  const fakePosts = pet.status === 'needs_help' ? [
    {
      id: 101,
      content: 'Покупка препарата от глистов',
      created_at: '2024-01-19T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [{ url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800' }],
      status: 'published',
      updated_at: '2024-01-19T10:00:00Z',
      comments_count: 0,
      fake_type: 'expense',
      fake_amount: -630
    },
    {
      id: 102,
      content: 'Огромное спасибо за помощь малышам!',
      created_at: '2024-01-19T14:00:00Z',
      author_id: 2,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [],
      status: 'published',
      updated_at: '2024-01-19T14:00:00Z',
      comments_count: 0,
      fake_type: 'income',
      fake_amount: 15000,
      fake_donor: 'АБРАМОВА МАРИЯ'
    },
    {
      id: 103,
      content: `Нашему любимому ${pet.gender === 'female' ? 'кошке' : 'коту'} срочно требуется операция...`,
      created_at: '2024-01-15T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: pet.photo ? [{ url: pet.photo }] : [],
      status: 'published',
      updated_at: '2024-01-15T10:00:00Z',
      comments_count: 0,
      fake_type: 'news'
    }
  ] : pet.status === 'looking_for_home' ? [
    {
      id: 201,
      content: 'Добавили свежие фото после груминга. Отлично переносит поездки и спокойно реагирует на пылесос.',
      created_at: '2024-01-20T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: pet.photo ? [{ url: pet.photo }] : [],
      status: 'published',
      updated_at: '2024-01-20T10:00:00Z',
      comments_count: 0,
      fake_tag: 'новые фото'
    },
    {
      id: 202,
      content: 'Побывал в гостях у семьи с детьми: ведёт себя спокойно, активно играет, без агрессии.',
      created_at: '2024-01-18T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [],
      status: 'published',
      updated_at: '2024-01-18T10:00:00Z',
      comments_count: 0,
      fake_tag: 'поведение'
    }
  ] : pet.status === 'lost' ? [
    {
      id: 301,
      content: 'Объехали все соседние дворы, опросили жителей. Пока не нашли, но есть несколько свидетелей, которые видели похожего кота.',
      created_at: '2024-01-20T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [],
      status: 'published',
      updated_at: '2024-01-20T10:00:00Z',
      comments_count: 0,
      fake_tag: 'поиск'
    },
    {
      id: 302,
      content: 'Увеличили вознаграждение до 10 000 рублей за возврат домой.',
      created_at: '2024-01-18T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [],
      status: 'published',
      updated_at: '2024-01-18T10:00:00Z',
      comments_count: 0,
      fake_tag: 'награда'
    },
    {
      id: 303,
      content: 'Расклеили объявления в радиусе 2 км от места пропажи. Проверили все подвалы и чердаки.',
      created_at: '2024-01-16T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: pet.photo ? [{ url: pet.photo }] : [],
      status: 'published',
      updated_at: '2024-01-16T10:00:00Z',
      comments_count: 0,
      fake_tag: 'поиск'
    }
  ] : pet.status === 'found' ? [
    {
      id: 401,
      content: 'Помогите найти хозяев! Найден кот, похожий на британскую короткошерстную породу, серого цвета.',
      created_at: '2024-01-15T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: pet.photo ? [{ url: pet.photo }] : [],
      status: 'published',
      updated_at: '2024-01-15T10:00:00Z',
      comments_count: 0,
      fake_tag: 'найден'
    },
    {
      id: 402,
      content: 'Обращаемся в ветклиники района Сокольники. Проверяем базы данных чипированных животных.',
      created_at: '2024-01-16T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: pet.photo ? [{ url: pet.photo }] : [],
      status: 'published',
      updated_at: '2024-01-16T10:00:00Z',
      comments_count: 0,
      fake_tag: 'поиск'
    },
    {
      id: 403,
      content: 'Чувствует себя хорошо, ждем хозяев. Привит, обработан от паразитов. Очень дружелюбный.',
      created_at: '2024-01-17T10:00:00Z',
      author_id: 1,
      author_type: 'user',
      tags: [],
      attached_pets: [],
      attachments: [],
      status: 'published',
      updated_at: '2024-01-17T10:00:00Z',
      comments_count: 0,
      fake_tag: 'обновление'
    }
  ] : [];

  const displayList = posts;

  return (
    <div className="bg-transparent mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-gray-900 m-0">Публикации</h2>
        <span className="text-gray-400 font-medium">({displayList.length})</span>
      </div>

      {pet.status === 'needs_help' && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Все
          </button>
          <button 
            onClick={() => setActiveTab('income')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'income' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Поступления
          </button>
          <button 
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'expense' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Траты
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === 'news' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Новости
          </button>
        </div>
      )}

      {postsLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100">
          <p>Пока нет публикаций</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((post: any) => {
            // Фейковый рендеринг
            if (post.fake_type || post.fake_tag) {
              const date = new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
              
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {post.attachments?.length > 0 && (
                    <div className="aspect-[2/1] bg-gray-100 relative">
                      <img src={post.attachments[0].url} alt="Post image" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      {post.fake_tag && (
                        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          post.fake_tag === 'награда' ? 'bg-red-100 text-red-700' :
                          post.fake_tag === 'найден' ? 'bg-blue-100 text-blue-700' :
                          post.fake_tag === 'поиск' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {post.fake_tag}
                        </div>
                      )}

                      {post.fake_type === 'expense' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          -630 ₽
                        </div>
                      )}

                      {post.fake_type === 'income' && (
                        <div className="flex gap-2 items-center">
                           <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 text-green-600 font-bold text-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            +15 000 ₽
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wide">{post.fake_donor}</div>
                        </div>
                      )}

                      {post.fake_type === 'news' && (
                        <div className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                          Сбор
                        </div>
                      )}

                      <div className="text-xs text-gray-400 whitespace-nowrap ml-auto">{date}</div>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {post.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-gray-400 text-sm">
                      <button className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        0
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Настоящие посты
            return <PostCard key={post.id} post={post as Post} />;
          })}
        </div>
      )}
    </div>
  );
}
