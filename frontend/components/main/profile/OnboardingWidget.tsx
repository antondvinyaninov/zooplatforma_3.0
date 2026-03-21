'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Trophy, PawPrint, FileText, UserCircle, Phone, FileSignature, Link2, Camera, Plus, HeartHandshake, Heart, MessageSquare, Share2, Star, UserPlus, Send } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface OnboardingTask {
  id: string;
  category: string;
  title: string;
  description: string;
  is_completed: boolean;
}

interface MiniPet {
  id: number;
  name: string;
  photo_url: string;
  species: string;
}

interface OnboardingProgress {
  tasks: OnboardingTask[];
  progress_percent: number;
  pets_count: number;
  curated_pets_count: number;
  owner_pets: MiniPet[] | null;
  curated_pets: MiniPet[] | null;
  has_reviewed: boolean;
}

export default function OnboardingWidget() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Роли (галочки)
  const [roleOwner, setRoleOwner] = useState(false);
  const [roleVolunteer, setRoleVolunteer] = useState(false);
  // Локальный стейт для репостов
  const [hasShared, setHasShared] = useState(false);

  // Стейт формы отзыва
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [likedText, setLikedText] = useState('');
  const [dislikedText, setDislikedText] = useState('');
  const [improvementsText, setImprovementsText] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [hasReviewedLocal, setHasReviewedLocal] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Загрузка первичных данных из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoleOwner(localStorage.getItem('onboarding_role_owner') === 'true');
      setRoleVolunteer(localStorage.getItem('onboarding_role_volunteer') === 'true');
      setHasShared(localStorage.getItem('onboarding_has_shared') === 'true');
      setHasReviewedLocal(localStorage.getItem('onboarding_has_reviewed') === 'true');
    }
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await apiClient.get<OnboardingProgress>('/api/users/onboarding');
        if (res.success && res.data) {
          setProgress(res.data);
          
          if (res.data.pets_count > 0) {
            setRoleOwner(true);
            localStorage.setItem('onboarding_role_owner', 'true');
          }
          if (res.data.curated_pets_count > 0) {
            setRoleVolunteer(true);
            localStorage.setItem('onboarding_role_volunteer', 'true');
          }
          if (res.data.has_reviewed) {
            setHasReviewedLocal(true);
            localStorage.setItem('onboarding_has_reviewed', 'true');
          }
        }
      } catch (err) {
        console.error('Failed to fetch onboarding progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading || !progress) return null;

  // Инжектим локальное состояние репоста в задания
  const resolvedTasks = progress.tasks.map(t => 
    t.id === 'share' ? { ...t, is_completed: t.is_completed || hasShared } : t
  );

  // Локальный пересчет процента по текстовым заданиям
  const completedCount = resolvedTasks.filter(t => t.is_completed).length;
  const currentPercent = resolvedTasks.length > 0 ? Math.round((completedCount / resolvedTasks.length) * 100) : 0;
  
  // Флаг полного завершения: и задания 100%, и отзыв отправлен
  const isFullyCompleted = currentPercent === 100 && (progress.has_reviewed || hasReviewedLocal);

  // Скрываем весь виджет, если всё сделано, и нет ролей (и отзыв отправлен)
  if (isFullyCompleted && !roleOwner && !roleVolunteer) return null;

  const handleTaskClick = (taskId: string) => {
    switch (taskId) {
      case 'avatar':
      case 'last_name':
      case 'phone':
      case 'bio':
      case 'social':
        router.push('/main/profile/edit'); 
        break;
      case 'post':
      case 'like':
      case 'comment':
        router.push('/main');
        break;
      case 'share':
        setHasShared(true);
        localStorage.setItem('onboarding_has_shared', 'true');
        router.push('/main');
        break;
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку от 1 до 10');
      return;
    }
    
    setIsReviewSubmitting(true);
    try {
      const payload = {
        rating,
        liked_text: likedText.trim(),
        disliked_text: dislikedText.trim(),
        improvements_text: improvementsText.trim()
      };
      
      const res = await apiClient.post('/api/users/onboarding/review', payload);
      if (res.success) {
        setHasReviewedLocal(true);
        localStorage.setItem('onboarding_has_reviewed', 'true');
      } else {
        alert('Ошибка при отправке отзыва. Пожалуйста, попробуйте позже.');
      }
    } catch (err) {
      alert('Ошибка сети. Попробуйте еще раз.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const getTaskIcon = (taskId: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
    }
    switch (taskId) {
      case 'avatar': return <Camera className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'last_name': return <UserCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'phone': return <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'bio': return <FileSignature className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'social': return <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'post': return <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'like': return <Heart className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'friend': return <UserPlus className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'message': return <Send className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      case 'share': return <Share2 className="w-5 h-5 text-gray-400 flex-shrink-0" />;
      default: return <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };

  const groupedTasks = resolvedTasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, OnboardingTask[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 overflow-hidden relative">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
            <Trophy className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-lg font-bold text-gray-900 leading-tight">
            Добро пожаловать на ЗооПлатформу! 👋
          </h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed block w-full px-1">
          {currentPercent < 100 
            ? "Мы очень рады видеть вас в нашем пушистом сообществе! ✨ Выполнение пары коротких стартовых шагов поможет вам быстро освоиться, настроить профиль под себя и сделать первые полезные действия на портале. Это позволит вам с легкостью понять, как здесь всё работает!"
            : hasReviewedLocal || progress.has_reviewed
              ? "Спасибо, что заполнили профиль и оставили отзыв! Вы готовы к полному погружению на ЗооПлатформе."
              : "Поздравляем с завершением стартовых заданий! 🎉 Мы постоянно развиваемся и хотим стать лучше для вас. Будем очень признательны за ваш честный отзыв:"
          }
        </p>
      </div>

      {/* Прогресс-бар (показываем только если не 100%) */}
      {currentPercent < 100 && (
        <div className="mb-6 px-1">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-gray-600">Ваш прогресс</span>
            <span className="text-blue-600 font-bold">{currentPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Аккордеон заданий (если < 100%) */}
      {currentPercent < 100 && (
        <div className="space-y-4 mb-2">
          {Object.entries(groupedTasks).map(([category, tasks]) => {
            const categoryCompleted = tasks.filter(t => t.is_completed).length;
            const isExpanded = !!expandedCategories[category];

            return (
              <div key={category} className="bg-gray-50/50 rounded-xl border border-gray-100 p-2">
                <div 
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between cursor-pointer p-2 group"
                >
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                    {category}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">
                      {categoryCompleted} / {tasks.length}
                    </span>
                    <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </div>
                </div>

                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                >
                  <div className="space-y-2 px-1 pb-1">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        onClick={() => !task.is_completed && handleTaskClick(task.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border transition-all
                          ${task.is_completed 
                            ? 'bg-white/50 border-transparent shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group'}
                        `}
                      >
                        {getTaskIcon(task.id, task.is_completed)}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium transition-colors ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-blue-600'}`}>
                            {task.title}
                          </h4>
                          <p className={`text-xs truncate mt-0.5 ${task.is_completed ? 'text-gray-300' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        </div>
                        {!task.is_completed && (
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ФОРМА ОТЗЫВА (Если 100% и отзыв еще не отправлен) */}
      {currentPercent === 100 && !(hasReviewedLocal || progress.has_reviewed) && (
        <div className="mb-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-5 border border-blue-100 shadow-inner">
          <h4 className="font-bold text-gray-900 mb-4 text-center">Оцените портал по шкале от 1 до 10:</h4>
          
          <div className="flex justify-center flex-wrap gap-1 md:gap-2 mb-6 cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starIdx) => (
              <div 
                key={starIdx}
                className="p-1 md:p-1.5 transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(starIdx)}
                onClick={() => setRating(starIdx)}
              >
                <Star 
                  className={`w-6 h-6 md:w-8 md:h-8 transition-colors ${starIdx <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
                <div className="text-[10px] md:text-xs text-center font-medium mt-1 text-gray-500">{starIdx}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Что вам понравилось?</label>
              <textarea 
                value={likedText}
                onChange={(e) => setLikedText(e.target.value)}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none"
                rows={2}
                placeholder="Расскажите о позитивных моментах..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Что не понравилось?</label>
              <textarea 
                value={dislikedText}
                onChange={(e) => setDislikedText(e.target.value)}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-50 focus:border-red-400 transition-all outline-none resize-none"
                rows={2}
                placeholder="Если возникли трудности, опишите их..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Что стоит добавить или изменить?</label>
              <textarea 
                value={improvementsText}
                onChange={(e) => setImprovementsText(e.target.value)}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-green-50 focus:border-green-400 transition-all outline-none resize-none"
                rows={3}
                placeholder="Подкиньте нам идеи для новых функций!"
              />
            </div>

            <button 
              onClick={submitReview}
              disabled={isReviewSubmitting || rating === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-sm flex justify-center items-center gap-2
                ${isReviewSubmitting || rating === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
            >
              {isReviewSubmitting ? 'Отправляем...' : 'Отправить отзыв'}
            </button>
          </div>
        </div>
      )}


      {/* Блок Выбор роли (А еще я...) - показываем только если прогресс меньше 100% */}
      {currentPercent < 100 && (
        <div className="mb-5 bg-blue-50/50 rounded-xl p-3 sm:p-4 border border-blue-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <span className="text-sm font-medium text-gray-700">А еще я...</span>
           <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
             <label className="flex items-center gap-2 cursor-pointer touch-manipulation group">
               <input 
                 type="checkbox" 
                 className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                 checked={roleOwner} 
                 onChange={(e) => {
                   setRoleOwner(e.target.checked);
                   localStorage.setItem('onboarding_role_owner', String(e.target.checked));
                 }} 
               />
               <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Владелец животного</span>
             </label>
             
             <label className="flex items-center gap-2 cursor-pointer touch-manipulation group">
               <input 
                 type="checkbox" 
                 className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
                 checked={roleVolunteer} 
                 onChange={(e) => {
                   setRoleVolunteer(e.target.checked);
                   localStorage.setItem('onboarding_role_volunteer', String(e.target.checked));
                 }} 
               />
               <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Волонтер / Куратор</span>
             </label>
           </div>
        </div>
      )}

      {/* КРАСИВЫЙ БЛОК: Мои питомцы */}
      {roleOwner && currentPercent < 100 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-blue-500" />
              Мои питомцы
            </h4>
            {progress.pets_count > 0 && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Задание выполнено
              </span>
            )}
          </div>

          {progress.owner_pets && progress.owner_pets.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-blue-800/70 mb-2 font-medium">Добавленные ({progress.pets_count}):</p>
              <div className="flex flex-wrap gap-2">
                {progress.owner_pets.map(pet => (
                  <div key={pet.id} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push(`/owner/pets/${pet.id}`)}>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-3 h-3 text-blue-300" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{pet.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => router.push('/owner/pets')}
            className={`w-full flex items-center justify-center gap-2 transition-colors py-3 rounded-xl font-medium text-sm shadow-sm ${progress.pets_count > 0 ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 hover:shadow-md'}`}
          >
            <Plus className="w-5 h-5 text-blue-500" />
            {progress.pets_count > 0 ? 'Добавить еще питомца' : 'Добавить питомца'}
          </button>
        </div>
      )}

      {/* КРАСИВЫЙ БЛОК: Мои подопечные (Волонтер) */}
      {roleVolunteer && currentPercent < 100 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-2xl border border-green-100 p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-green-500" />
              Подопечные питомцы
            </h4>
            {progress.curated_pets_count > 0 && (
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Задание выполнено
              </span>
            )}
          </div>

          {progress.curated_pets && progress.curated_pets.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-green-800/70 mb-2 font-medium">Подопечные ({progress.curated_pets_count}):</p>
              <div className="flex flex-wrap gap-2">
                {progress.curated_pets.map(pet => (
                  <div key={pet.id} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-green-100 shadow-sm cursor-pointer hover:border-green-300 transition-colors" onClick={() => router.push(`/pethelper/pets/${pet.id}`)}>
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-green-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-3 h-3 text-green-300" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{pet.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => router.push('/pethelper/pets')}
            className={`w-full flex items-center justify-center gap-2 transition-colors py-3 rounded-xl font-medium text-sm shadow-sm ${progress.curated_pets_count > 0 ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200' : 'bg-green-600 hover:bg-green-700 text-white border border-green-700 hover:shadow-md'}`}
          >
            <Plus className="w-5 h-5 text-green-500" />
            {progress.curated_pets_count > 0 ? 'Добавить еще подопечного' : 'Добавить подопечного'}
          </button>
        </div>
      )}
    </div>
  );
}
