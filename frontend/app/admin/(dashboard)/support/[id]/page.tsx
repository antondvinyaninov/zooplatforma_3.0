'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SupportMessageComment {
  id: number;
  message_id: number;
  comment: string;
  admin_email: string;
  is_public: boolean;
  created_at: string;
}

interface SupportMessage {
  id: number;
  name: string;
  email: string;
  topic: string;
  message: string;
  attachment_url: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  comments?: SupportMessageComment[];
}

const statusColors: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800 border-blue-200',
  'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'resolved': 'bg-green-100 text-green-800 border-green-200',
  'closed': 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels: Record<string, string> = {
  'new': 'Новое',
  'in_progress': 'В работе',
  'resolved': 'Решено',
  'closed': 'Закрыто',
};

export default function SupportMessageDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [ticket, setTicket] = useState<SupportMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isPublicReply, setIsPublicReply] = useState(false);
  
  // Hardcoded current admin email for now, ideally comes from auth context
  const currentAdminEmail = 'anton@dvinyaninov.ru';

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/support/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch ticket');
      }
      setTicket(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      setUpdatingStatus(true);
      const res = await fetch(`/api/admin/support/${ticket.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setTicket({ ...ticket, status: newStatus });
    } catch (err: any) {
      alert(`Ошибка обновления статуса: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/admin/support/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comment: commentText.trim(),
          admin_email: currentAdminEmail,
          is_public: isPublicReply
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add comment');
      }

      // Add the new comment locally and clear input
      setTicket({
        ...ticket,
        comments: [...(ticket.comments || []), data.data]
      });
      setCommentText('');
    } catch (err: any) {
      alert(`Ошибка добавления комментария: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка заявки...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          Ошибка: {error || 'Заявка не найдена'}
        </div>
        <Link href="/admin/support" className="mt-4 flex items-center text-blue-600">
          <ArrowLeftIcon className="w-4 h-4 mr-2" /> Назад к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/admin/support" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Заявка #{ticket.id}: {ticket.topic}
            <span className={`text-xs px-2.5 py-1 rounded-full border border-opacity-50 font-medium ${statusColors[ticket.status]}`}>
              {statusLabels[ticket.status]}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            От {ticket.name} ({ticket.email}) • {new Date(ticket.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 grow min-h-0">
        
        {/* Left Panel: Ticket Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto w-full p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100 shrink-0">
            Детали обращения
          </h2>
          
          <div className="space-y-6 grow overflow-y-auto">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-[15px]">
                {ticket.message}
              </p>
            </div>

            {ticket.attachment_url && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-gray-500">Прикрепленный файл</span>
                <div className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition bg-gray-50 flex items-center justify-center p-2">
                  <img 
                    src={ticket.attachment_url} 
                    alt="Attachment" 
                    className="max-h-80 max-w-full rounded-lg shadow-sm"
                    onClick={() => window.open(ticket.attachment_url as string, '_blank')}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-6 mt-4 border-t border-gray-100 shrink-0 bg-gray-50/50 -mx-6 px-6 pb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Изменить статус заявки</label>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`w-full p-3 rounded-xl border appearance-none font-medium cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[ticket.status]}`}
              style={{ paddingRight: '2rem' }}
            >
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val} className="text-gray-900 bg-white font-medium">{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Panel: Comment Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full flex flex-col h-full bg-slate-50/30">
          <h2 className="text-lg font-bold text-gray-900 px-6 py-4 border-b border-gray-200 shrink-0 flex items-center justify-between bg-white rounded-t-2xl">
            История работы
            <span className="bg-blue-100 text-blue-700 text-xs py-1 px-3 rounded-full font-medium">
              {(ticket.comments?.length || 0)} комментариев
            </span>
          </h2>
          
          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            
            {/* Initial Request Bubble */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500">
                {ticket.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative rounded-bl-none">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-sm text-gray-900">{ticket.name} <span className="text-gray-400 font-normal ml-1">пользователь</span></span>
                  </div>
                  <p className="text-gray-600 text-[14px]">Открыл(а) заявку и отправил сообщение.</p>
                </div>
                <div className="text-xs text-gray-400 mt-1 ml-1">
                    {new Date(ticket.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            {/* Admin Comments */}
            {ticket.comments?.map((comment) => {
              const isAdminMe = comment.admin_email === currentAdminEmail;
              const isPublic = comment.is_public;
              
              return (
                <div key={comment.id} className={`flex gap-4 ${isAdminMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-white shadow-sm ${isPublic ? 'bg-amber-500' : isAdminMe ? 'bg-blue-600' : 'bg-indigo-500'}`}>
                    {isPublic ? (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                    ) : comment.admin_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className={`p-4 rounded-2xl shadow-sm relative ${isPublic ? 'bg-amber-50 border border-amber-200' + (isAdminMe ? ' rounded-br-none text-right' : ' rounded-bl-none') : isAdminMe ? 'bg-[#E3F2FD] border border-blue-200 rounded-br-none text-right' : 'bg-white border border-gray-200 rounded-bl-none'}`}>
                      <div className={`flex justify-between items-baseline mb-2 ${isAdminMe ? 'flex-row-reverse' : ''}`}>
                        <span className="font-bold text-sm text-gray-900 flex-1">
                          {isAdminMe ? 'Вы' : comment.admin_email.split('@')[0]}
                        </span>
                        {isPublic && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2">
                             Публичный ответ
                          </span>
                        )}
                      </div>
                      <p className={`text-gray-800 text-[14px] whitespace-pre-wrap ${isAdminMe ? 'text-right' : ''}`}>
                        {comment.comment}
                      </p>
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${isAdminMe ? 'text-right mr-1' : 'ml-1'}`}>
                        {new Date(comment.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(ticket.comments?.length === 0) && (
              <div className="text-center p-8 bg-transparent text-gray-400 rounded-xl my-auto m-auto">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Здесь будет отображаться история<br/>работы с заявкой
              </div>
            )}
            
          </div>

          {/* Comment Form */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl shrink-0">
            <div className="flex gap-4 mb-3 border-b border-gray-100 pb-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="reply_type" 
                  checked={!isPublicReply} 
                  onChange={() => setIsPublicReply(false)} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                <span className={`text-sm font-medium ${!isPublicReply ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>Внутренняя заметка</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="reply_type" 
                  checked={isPublicReply} 
                  onChange={() => setIsPublicReply(true)} 
                  className="w-4 h-4 text-amber-500 focus:ring-amber-500" 
                />
                <span className={`text-sm font-medium flex items-center gap-1.5 ${isPublicReply ? 'text-amber-700' : 'text-gray-500 group-hover:text-gray-700'}`}>
                  Ответить пользователю (Email)
                </span>
              </label>
            </div>
          
            <form onSubmit={handleAddComment} className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isPublicReply ? "Официальный ответ (будет отправлен на почту)..." : "Добавить комментарий или лог работы..."}
                className={`w-full border rounded-xl py-3 px-4 pr-[120px] focus:outline-none resize-none h-[68px] ${
                  isPublicReply 
                    ? "bg-amber-50 border-amber-200 focus:ring-2 focus:ring-amber-500/50" 
                    : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500/50"
                }`}
                disabled={submittingComment}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className={`absolute right-2 top-2 bottom-2 px-4 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 ${
                  isPublicReply ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {submittingComment ? '...' : (isPublicReply ? 'Отправить ответ' : 'Сохранить')}
              </button>
            </form>
            <div className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {isPublicReply ? "Ответ будет отправлен пользователю по электронной почте" : "Комментарии видны только администраторам (Enter для быстрой отправки)"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
