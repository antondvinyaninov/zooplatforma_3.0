'use client';

import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import CityDetector from './CityDetector';
import UserMenu from './UserMenu';
import NotificationsDropdown from '@/components/modules/notifications/widgets/NotificationsDropdown';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function HeaderMobile() {
  const { isAuthenticated } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/main/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <div className="sm:hidden">
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/favicon.svg"
            alt="ЗооПлатформа"
            width={28}
            height={28}
            className="flex-shrink-0"
          />
          <span className="text-sm font-bold text-gray-900 uppercase">Зооплатформа</span>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <Button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            variant="ghost"
            size="icon"
            aria-label="Открыть поиск"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-600" strokeWidth={2} />
          </Button>
          {isAuthenticated && <NotificationsDropdown />}
          <UserMenu variant="mobile" />
        </div>
      </div>

      <div className={`mt-2 items-center gap-2 ${isSearchOpen ? 'flex' : 'hidden'}`}>
        <div className="flex-1 min-w-0">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />}
              className="bg-gradient-to-br from-gray-50 to-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderDesktop() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/main/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="hidden sm:flex items-center gap-2.5">
      <div className="hidden lg:flex items-center space-x-2 w-[180px] flex-shrink-0 px-2">
        <Image
          src="/favicon.svg"
          alt="ЗооПлатформа"
          width={28}
          height={28}
          className="flex-shrink-0"
        />
        <span className="text-sm font-bold text-gray-900 uppercase">Зооплатформа</span>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0 lg:hidden">
        <Image
          src="/favicon.svg"
          alt="ЗооПлатформа"
          width={28}
          height={28}
          className="flex-shrink-0"
        />
        <span className="text-sm font-bold text-gray-900 uppercase">Зооплатформа</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" strokeWidth={2} />}
            className="bg-gradient-to-br from-gray-50 to-gray-100"
          />
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-3">
        <div className="hidden md:block">
          <CityDetector />
        </div>
        {isAuthenticated && <NotificationsDropdown />}
        <UserMenu variant="desktop" />
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1150px] mx-auto px-3 sm:px-4 py-1">
        <HeaderMobile />
        <HeaderDesktop />
      </div>
    </header>
  );
}
