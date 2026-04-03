'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

interface InviteData {
  id: number;
  name: string;
  avatar_url?: string;
  participants_count: number;
}

export default function JoinChatPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [data, setData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await apiClient.get<InviteData>(`/api/chats/invite/${params.token}/preview`);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Приглашение недействительно или срок его действия истек.');
        }
      } catch (err) {
        setError('Не удалось загрузить данные приглашения.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreview();
  }, [params.token]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await apiClient.post<{ chat_id: number }>(`/api/chats/invite/${params.token}/join`, {});
      if (res.success && res.data?.chat_id) {
        router.push(`/main/messenger?chatId=${res.data.chat_id}`);
      } else {
        setError('Не удалось присоединиться к беседе.');
        setIsJoining(false);
      }
    } catch (err) {
      setError('Произошла ошибка при попытке присоединиться.');
      setIsJoining(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-[#F8F9FA] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center animate-in zoom-in-95 fade-in duration-300">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 animate-pulse mb-6"></div>
            <div className="h-6 w-48 bg-gray-100 animate-pulse rounded-lg mb-2"></div>
            <div className="h-4 w-32 bg-gray-100 animate-pulse rounded-lg"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
            <p className="text-gray-500 mb-8">{error}</p>
            <button
              onClick={() => router.push('/main/messenger')}
              className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Вернуться в мессенджер
            </button>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden mb-6 border-4 border-white">
              {data.avatar_url ? (
                <img src={getMediaUrl(data.avatar_url)} alt="Group avatar" className="w-full h-full object-cover" />
              ) : (
                data.name?.[0]?.toUpperCase() || 'G'
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{data.name}</h2>
            <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-8">
              {data.participants_count} участника(ов)
            </p>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Вход...
                </>
              ) : (
                'Присоединиться к группе'
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
