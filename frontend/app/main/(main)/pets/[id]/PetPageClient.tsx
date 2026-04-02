'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { postsApi, Post, Pet } from '../../../../../lib/api';
import { getPetPhotoUrl } from '../../../../../lib/urls';

// Компоненты
import TopSection from './components/TopSection';
import ImageGallery from './components/ImageGallery';
import AuthorCard from './components/AuthorCard';
import DescriptionCard from './components/DescriptionCard';
import PetInfoCard from './components/PetInfoCard';
import MedicalInfoCard from './components/MedicalInfoCard';
import StatusSpecificCard from './components/StatusSpecificCard';
import PublicationsList from './components/PublicationsList';

interface PetPageClientProps {
  initialPet: Pet;
  initialPosts: Post[];
}

export default function PetPageClient({ initialPet, initialPosts }: PetPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [pet, setPet] = useState<Pet>(initialPet);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [postsLoading, setPostsLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setPostsLoading(true);
        const response = await postsApi.getPetPosts(Number(pet.id));
        if (response.success && response?.data) {
          setPosts(response.data || []);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };
    
    if (pet?.id) {
      loadPosts();
    }
  }, [pet?.id]);

  const getAge = () => {
    if (pet?.age_type === 'approximate') {
      const years = pet.approximate_years || 0;
      const months = pet.approximate_months || 0;
      if (years > 0) {
        return `~${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
      } else if (months > 0) {
        return `~${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
      }
      return 'Менее месяца';
    }

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

  const age = getAge();
  const isOwnerOrCurator = user?.id === pet.user_id;

  const renderGallery = () => {
    const galleryPhotos = [getPetPhotoUrl(pet.photo_url || pet.photo)].filter(Boolean);
    if (pet.media_urls && Array.isArray(pet.media_urls)) {
      pet.media_urls.forEach((url: string) => galleryPhotos.push(getPetPhotoUrl(url)));
    }
    if (posts) {
      posts.forEach(post => {
        if (post.attachments) {
          post.attachments.forEach(a => {
            if (a.type === 'photo' || (a.mime_type && typeof a.mime_type === 'string' && a.mime_type.startsWith('image'))) {
              galleryPhotos.push(getPetPhotoUrl(a.url));
            }
          });
        }
      });
    }
    const uniquePhotos = Array.from(new Set(galleryPhotos)).filter(Boolean);
    return <ImageGallery photos={uniquePhotos} name={pet.name || 'Питомец'} />;
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full pb-10 flex flex-col lg:block">
      {/* Галерея на мобильных (самая первая!) */}
      {isMobile && (
        <div className="w-full">
          {renderGallery()}
        </div>
      )}

      {/* Верхняя секция (Заголовок, хлебные крошки, кнопки) */}
      <div className={isMobile ? "px-3 mt-4" : ""}>
        <TopSection pet={pet} isOwnerOrCurator={isOwnerOrCurator} />
      </div>

      {/* 2-Column Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-2.5 px-3 sm:px-0 ${isMobile ? 'mt-0' : 'mt-0'}`}>
        
        {/* Левая колонка - Основной контент */}
        <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-2.5">
          {/* Галерея на десктопе */}
          {!isMobile && renderGallery()}
          
          {/* Описание питомца (На мобилке оно будет сразу под названием, на десктопе под фото) */}
          <DescriptionCard pet={pet} />

          {/* Публикации (на десктопе под фото) */}
          {!isMobile && <PublicationsList pet={pet} posts={posts} postsLoading={postsLoading} />}
        </div>

        {/* Правая колонка - Сайдбар */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-2.5">
          {/* Карточка Организатора / Куратора / Нашедшего */}
          <AuthorCard pet={pet} isOwnerOrCurator={isOwnerOrCurator} />

          {/* Специфичный блок (Прогресс сбора, Детали потери/находки) */}
          <StatusSpecificCard pet={pet} />

          {/* Информация о питомце */}
          <PetInfoCard pet={pet} age={age} />

          {/* Публикации (на мобилке в самом низу) */}
          {isMobile && <PublicationsList pet={pet} posts={posts} postsLoading={postsLoading} />}
        </div>
      </div>
    </div>
  );
}
