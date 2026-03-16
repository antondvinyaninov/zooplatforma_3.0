'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { CalendarIcon, CheckCircleIcon, ShareIcon, UserIcon } from '@heroicons/react/24/outline';
import { postsApi, Post, Pet } from '../../../../../lib/api';
import PostCard from '../../../../../components/main/posts/PostCard';

type PetPageProps = {
  params: Promise<{ id: string }>;
};

export default function PetPage({ params }: PetPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPet();
      loadPosts();
    }
  }, [id]);

  const loadPet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/pets/${id}`, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setPet(result.data);
      }
    } catch (error) {
      // Error loading pet
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await postsApi.getPetPosts(Number(id));
      if (response.success && response?.data) {
        setPosts(response.data || []);
      }
    } catch (error) {
      // Error loading posts
    } finally {
      setPostsLoading(false);
    }
  };

  const getAge = () => {
    if (!pet?.birth_date) return null;
    const birthDate = new Date(pet.birth_date);
    const today = new Date();
    const years = today.getFullYear() - birthDate.getFullYear();
    const months = today.getMonth() - birthDate.getMonth();

    if (years > 0) {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (months > 0) {
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    }
    return 'Новорождённый';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Питомец не найден</h2>
          <button onClick={() => router.back()} className="text-blue-500 hover:text-blue-600">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const age = getAge();

  return (
    <div>
      {/* Cover and Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-2.5">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
              🐾
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative -mt-16 sm:-mt-20">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-300 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl">🐾</div>
                )}
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {pet.name}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{pet.species}</span>
                      {pet.breed && <span>• {pet.breed}</span>}
                    </div>
                    {age && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{age}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {user?.id === pet.user_id && (
                    <a
                      href={`/pets/${pet.id}/edit`}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
                    >
                      Редактировать
                    </a>
                  )}
                  <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                    <ShareIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-2.5">
          {/* Фотогалерея */}
          {pet.photo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Фото</h2>
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* О питомце */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">О питомце</h2>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Возраст */}
              {age && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Возраст</div>
                    <div className="text-lg font-semibold text-gray-900">{age}</div>
                    {pet.birth_date && (
                      <div className="text-sm text-gray-500">
                        Дата рождения: {new Date(pet.birth_date).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Пол */}
              {pet.gender && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{pet.gender === 'male' ? '♂' : '♀'}</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Пол</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {pet.gender === 'male' ? 'Самец' : 'Самка'}
                    </div>
                  </div>
                </div>
              )}

              {/* Окрас */}
              {pet.color && (
                <div className="flex items-start gap-4 md:col-span-2">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Окрас</div>
                    <div className="text-lg font-semibold text-gray-900">{pet.color}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Медицинская информация */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Медицинская информация</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Привит */}
              <div
                className={`p-4 rounded-xl border-2 ${pet.is_vaccinated ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  {pet.is_vaccinated ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Привит</div>
                    <div className="text-sm text-gray-600">
                      {pet.is_vaccinated ? 'Да' : 'Нет данных'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Стерилизован */}
              <div
                className={`p-4 rounded-xl border-2 ${pet.is_sterilized ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  {pet.is_sterilized ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Стерилизован</div>
                    <div className="text-sm text-gray-600">
                      {pet.is_sterilized ? 'Да' : 'Нет данных'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Чипирован */}
              <div
                className={`p-4 rounded-xl border-2 ${pet.chip_number ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  {pet.chip_number ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Чипирован</div>
                    <div className="text-sm text-gray-600">
                      {pet.chip_number ? 'Да' : 'Нет данных'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Посты */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Посты с {pet.name}</h2>

            {postsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Пока нет постов с этим питомцем</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-2.5">
          {/* Owner/Curator Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pet.relationship === 'curator' ? 'Куратор' : 'Владелец'}
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {pet.user?.avatar ? (
                  <img
                    src={pet.user.avatar}
                    alt={pet.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {pet.user?.name} {pet.user?.last_name || ''}
                </div>
                {pet.user?.location && (
                  <div className="text-sm text-gray-500 truncate">📍 {pet.user.location}</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/id${pet.user_id}`)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Перейти в профиль
              </button>
              {pet.relationship === 'curator' && user?.id !== pet.user_id && (
                <button
                  onClick={() => router.push(`/messenger?user=${pet.user_id}`)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Написать куратору
                </button>
              )}
            </div>
          </div>

          {/* Medical Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Здоровье</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Привит</span>
                <span
                  className={`text-sm font-semibold ${pet.is_vaccinated ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {pet.is_vaccinated ? '✓ Да' : 'Нет данных'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Стерилизован</span>
                <span
                  className={`text-sm font-semibold ${pet.is_sterilized ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {pet.is_sterilized ? '✓ Да' : 'Нет данных'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Чипирован</span>
                <span
                  className={`text-sm font-semibold ${pet.chip_number ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {pet.chip_number ? '✓ Да' : 'Нет данных'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
