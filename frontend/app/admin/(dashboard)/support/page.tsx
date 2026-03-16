'use client';

import { useState, useEffect } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

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
}

export default function SupportMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch support messages');
      }
      setMessages(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setUpdating(id);
      const res = await fetch(`/api/admin/support/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Update local state
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, status: newStatus } : msg
      ));

    } catch (err: any) {
      alert(`Ошибка обновления статуса: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const openMessageDetails = (id: number) => {
    router.push(`/admin/support/${id}`);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Служба Поддержки</h1>
        <button 
          onClick={fetchMessages}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Обновить
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">ID & Дата</th>
                <th className="px-6 py-4 text-left">Пользователь</th>
                <th className="px-6 py-4 text-left">Тема</th>
                <th className="px-6 py-4 text-left">Статус</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Загрузка обращений...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Пока нет обращений в поддержку
                  </td>
                </tr>
              ) : (
                messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">#{msg.id}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(msg.created_at).toLocaleString('ru-RU', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{msg.name}</div>
                      <div className="text-gray-500">{msg.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{msg.topic}</div>
                      {msg.attachment_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1">
                          📎 Вложено фото
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={msg.status}
                        onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                        disabled={updating === msg.id}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer pr-6 ${statusColors[msg.status]}`}
                      >
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <button
                        onClick={() => openMessageDetails(msg.id)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded inline-flex items-center gap-1 transition"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
