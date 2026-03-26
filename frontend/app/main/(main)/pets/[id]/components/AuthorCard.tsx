'use client';

import { useRouter } from 'next/navigation';
import { UserIcon, StarIcon, ShieldCheckIcon, HandRaisedIcon, MapPinIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Pet } from '../../../../../../lib/api';

interface AuthorCardProps {
  pet: Pet;
  isOwnerOrCurator: boolean;
}

export default function AuthorCard({ pet, isOwnerOrCurator }: AuthorCardProps) {
  const router = useRouter();

  // Определяем тип автора в зависимости от статуса и связи
  const getAuthorTitle = () => {
    if (pet.org_id) return 'Опекун';
    if (pet.status === 'needs_help') return 'Организатор';
    if (pet.status === 'found') return 'Нашедший';
    if (pet.relationship === 'curator') return 'Куратор';
    return 'Владелец';
  };

  const getMainAction = () => {
    switch (pet.status) {
      case 'needs_help':
        return { text: 'Помочь', color: 'bg-purple-600 hover:bg-purple-700', icon: <div className="w-5 h-5 font-bold flex items-center justify-center text-[16px] leading-none">₽</div> };
      case 'looking_for_home':
        return { text: 'Взять домой', color: 'bg-blue-600 hover:bg-blue-700', icon: <HomeIcon className="w-5 h-5" /> };
      case 'lost':
        return { text: 'Я нашел', color: 'bg-red-600 hover:bg-red-700', icon: <HandRaisedIcon className="w-5 h-5" /> };
      case 'found':
        return { text: 'Я владелец', color: 'bg-blue-600 hover:bg-blue-700', icon: <MagnifyingGlassIcon className="w-5 h-5" /> };
      default:
        return null;
    }
  };

  const action = getMainAction();

  const getMessageText = () => {
    switch(getAuthorTitle()) {
      case 'Организатор': return 'Написать организатору';
      case 'Нашедший': return 'Написать нашедшему';
      case 'Владелец': return 'Написать владельцу';
      case 'Опекун': return 'Написать опекуну';
      default: return 'Написать куратору';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-2.5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{getAuthorTitle()}</h3>
      
      <div className="flex items-start gap-4 mb-5">
        <div 
          onClick={() => {
            if (pet.org_id) {
              router.push(`/orgs/${pet.org_id}`);
            } else {
              router.push(`/id${pet.user_id}`);
            }
          }}
          className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer border border-gray-200"
        >
          {pet.user?.avatar ? (
            <img src={pet.user.avatar} alt={pet.user.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-7 h-7 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div 
            onClick={() => {
              if (pet.org_id) {
                router.push(`/orgs/${pet.org_id}`);
              } else {
                router.push(`/id${pet.user_id}`);
              }
            }}
            className="font-bold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {pet.user?.name} {pet.user?.last_name || ''}
            <ShieldCheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          </div>
          
          {(pet.user?.location || pet.city || pet.region) && (
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              <span className="truncate">{pet.user?.location || pet.city || pet.region}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={() => router.push(`/messenger?user=${pet.user_id}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00c853] hover:bg-[#00e676] text-white rounded-xl font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {getMessageText()}
        </button>
      </div>
    </div>
  );
}
