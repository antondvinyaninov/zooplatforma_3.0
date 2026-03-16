'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/app/main/hooks/useWebSocket';
import ChatList from './components/ChatList';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import { Chat, Message } from './types';

export default function MessengerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  
  // Временные чаты до сих пор нужны для "открыть чат с пользователем Х" до того, как он появится на сервере
  const [tempChats, setTempChats] = useState<Chat[]>([]);
  
  const queryParamProcessed = useRef(false);

  // Проверка авторизации
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Блокируем скролл страницы
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Запросы данных через React Query
  const { 
    data: serverChats = [], 
    isLoading: isChatsLoading 
  } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await apiClient.get<Chat[]>('/api/chats');
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут (обновления приходят через WS)
  });

  const { 
    data: messages = [], 
    isLoading: isMessagesLoading 
  } = useQuery({
    queryKey: ['messages', selectedChatId],
    queryFn: async () => {
      if (!selectedChatId || selectedChatId < 0) return [];
      const response = await apiClient.get<Message[]>(`/api/chats/${selectedChatId}/messages`);
      
      const data = response.data || [];
      // Авто-пометка как прочитанное при загрузке
      const hasUnread = data.some((msg: Message) => !msg.is_read && msg.sender_id !== user?.id);
      if (hasUnread) {
        apiClient.post(`/api/chats/${selectedChatId}/mark-read`, {}).catch(() => {});
      }
      return data;
    },
    enabled: !!selectedChatId && selectedChatId > 0,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут (апдейты через WS)
  });

  // Объединяем серверные и временные чаты
  const chats = useMemo(() => {
    const existingIds = new Set(serverChats.map(c => c.id));
    // Добавляем только те временные чаты, которые еще не перешли на сервер
    const activeTempChats = tempChats.filter(tc => tc.id < 0 || !existingIds.has(tc.id));
    return [...activeTempChats, ...serverChats];
  }, [serverChats, tempChats]);

  // WebSocket Integration для Real-Time сообщений
  useWebSocket({
    onNewMessage: (newMessage: Message) => {
      // 1. Если сообщение для открытого в данный момент чата, добавляем его в список (кэш)
      if (newMessage.chat_id === selectedChatId) {
        queryClient.setQueryData<Message[]>(['messages', selectedChatId], (oldMessages = []) => {
          // Защита от потенциального дублирования (например от своего же optimistic UI)
          if (oldMessages.some(m => m.id === newMessage.id)) return oldMessages;
          return [...oldMessages, newMessage];
        });
        
        // Помечаем новое входящее сообщение как прочитанное если мы находимся прямо в этом чате
        if (newMessage.sender_id !== user?.id) {
           apiClient.post(`/api/chats/${newMessage.chat_id}/mark-read`, {}).catch(() => {});
        }
      }

      // 2. Обновляем счетчик непрочитанных сообщений и передвигаем чат наверх
      queryClient.setQueryData<Chat[]>(['chats'], (oldChats = []) => {
        const chatExists = oldChats.some(c => c.id === newMessage.chat_id);
        
        if (chatExists) {
          return oldChats.map(chat => {
            if (chat.id === newMessage.chat_id) {
              return {
                ...chat,
                last_message: newMessage,
                last_message_at: newMessage.created_at || new Date().toISOString(),
                // Увеличиваем счетчик, если чат сейчас НЕ открыт и сообщение не от нас
                unread_count: (newMessage.chat_id !== selectedChatId && newMessage.sender_id !== user?.id) 
                  ? chat.unread_count + 1 
                  : chat.unread_count
              };
            }
            return chat;
          }).sort((a, b) => {
            // Поднимаем обновленный чат наверх
            const timeA = new Date(a.last_message_at || 0).getTime();
            const timeB = new Date(b.last_message_at || 0).getTime();
            return timeB - timeA;
          });
        }
        
        // Если чат новый, инвалидируем весь список чтобы бэкенд отдал нужные данные с relation (user/organization)
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        return oldChats;
      });
    }
  });

  // Обработка query параметра ?user=ID для открытия чата с конкретным пользователем
  useEffect(() => {
    if (isChatsLoading || !user || queryParamProcessed.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user');

    if (userIdParam) {
      queryParamProcessed.current = true;
      const targetUserId = parseInt(userIdParam);

      const existingChat = chats.find((chat) => chat.other_user?.id === targetUserId);

      if (existingChat) {
        setSelectedChatId(existingChat.id);
      } else {
        const tempChat: Chat = {
          id: -targetUserId,
          other_user: {
            id: targetUserId,
            name: 'Загрузка...',
            last_name: '',
          },
          unread_count: 0,
        };

        setTempChats((prev) => [tempChat, ...prev]);
        setSelectedChatId(tempChat.id);
        fetchUserData(targetUserId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatsLoading, serverChats.length, user]);

  const fetchUserData = async (userId: number) => {
    try {
      const response = await apiClient.get<any>(`/api/users/${userId}`);
      if (response.success && response.data) {
        setTempChats((prev) =>
          prev.map((chat) => chat.id === -userId ? { ...chat, other_user: response.data } : chat)
        );
      }
    } catch (error) {
      // Ignore
    }
  };

  // Отправка сообщений с Optimistic UI
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, receiverId }: { text: string; receiverId: number }) => {
      const response = await apiClient.post('/api/messages/send', {
        receiver_id: receiverId,
        content: text,
      });
      if (!response.success) throw new Error('Send failed');
      return response.data; // Возвращаем реальное сообщение в ответе API
    },
    onMutate: async ({ text, receiverId }) => {
      // Отменяем исходящие запросы, чтобы они не перезаписали наш оптимистичный апдейт
      await queryClient.cancelQueries({ queryKey: ['messages', selectedChatId] });

      const previousMessages = queryClient.getQueryData(['messages', selectedChatId]);

      // Создаем фейковое (оптимистичное) сообщение
      const optimisticMessage: Message = {
        id: Date.now(), // Временный ID
        chat_id: selectedChatId || -1,
        sender_id: user?.id || 0,
        content: text,
        created_at: new Date().toISOString(),
        is_read: false,
      };

      // Мгновенно обновляем кэш
      queryClient.setQueryData<Message[]>(['messages', selectedChatId], (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { previousMessages }; // Контекст для rollback
    },
    onError: (err, newTodo, context) => {
      // При ошибке откатываем UI к предыдущему состоянию
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedChatId], context.previousMessages);
      }
    },
    onSuccess: (realMessage) => {
       // Инвалидируем список чатов чтобы обновилить last message в Sidebar
       queryClient.invalidateQueries({ queryKey: ['chats'] });
       
       // Если это был первый месседж (создан временный чат) - переполучаем чаты и открываем настоящий
       if (selectedChatId && selectedChatId < 0) {
         setTempChats(prev => prev.filter(tc => tc.id !== selectedChatId));
       }
    },
    onSettled: () => {
      // В любом случае ре-фетчим сообщения для синхронизации ID из базы
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChatId] });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedChatId) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat?.other_user?.id) return;

    // Сразу кидаем мутацию и очищаем инпут (оптимистичный UI)
    sendMessageMutation.mutate({ text: messageText.trim(), receiverId: selectedChat.other_user.id });
    setMessageText('');
  };

  // Медиа-файлы пока отправляются с явным loading индикатором, так как требуют загрузки на сервер
  const [sendingMedia, setSendingMedia] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedChatId) return;

    const selectedChat = chats.find((c) => c.id === selectedChatId);
    if (!selectedChat?.other_user?.id) return;

    setSendingMedia(true);

    try {
      const formData = new FormData();
      formData.append('receiver_id', selectedChat.other_user.id.toString());
      if (messageText.trim()) formData.append('content', messageText.trim());

      Array.from(files).forEach((file) => formData.append('media', file));

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/messages/send-media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        setMessageText('');
        // Обновляем чаты и сообщения после успешной загрузки медиа
        queryClient.invalidateQueries({ queryKey: ['messages', selectedChatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        
        if (selectedChatId < 0) {
          setTempChats(prev => prev.filter(tc => tc.id !== selectedChatId));
        }
      } else {
        alert('Ошибка отправки файла');
      }
    } catch (error) {
      alert('Ошибка отправки файла');
    } finally {
      setSendingMedia(false);
    }
  };

  const handleCloseChat = () => {
    setSelectedChatId(null);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="h-[calc(100dvh-74px)] md:h-[calc(100vh-74px)] bg-white md:rounded-lg md:shadow-sm md:border border-gray-200 flex overflow-hidden">
      {/* Левая панель - список чатов */}
      <ChatList
        chats={chats}
        loading={isChatsLoading}
        isCollapsed={isCollapsed}
        selectedChatId={selectedChatId}
        currentUserId={user?.id}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onSelectChat={setSelectedChatId}
      />

      {/* Правая часть - окно чата */}
      <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
        {selectedChatId ? (
          <>
            {/* Шапка чата */}
            <ChatHeader user={selectedChat?.other_user || null} onClose={handleCloseChat} />

            {/* Область сообщений */}
            <MessageList 
               messages={messages} 
               currentUserId={user?.id} 
               isLoading={isMessagesLoading} 
            />

            {/* Поле ввода */}
            <MessageInput
              messageText={messageText}
              sending={sendMessageMutation.isPending || sendingMedia}
              onMessageChange={setMessageText}
              onSendMessage={handleSendMessage}
              onFileSelect={handleFileSelect}
            />
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e3f2fd' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#e3f2fd',
            }}
          >
            <div className="text-center text-gray-400">
              <svg
                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">Выберите чат</p>
              <p className="text-sm mt-1">Чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
