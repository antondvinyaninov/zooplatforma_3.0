'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  PlusCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

type ChatThread = {
  id: number;
  title: string;
  period: string;
  messages: Message[];
};

type AssistantMode = 'general' | 'announcement';

type AnnouncementPreset = {
  label: string;
  type: string;
  prompt: string;
};

type WizardStep = {
  key: string;
  question: string;
};

type AnnouncementWizardState = {
  active: boolean;
  stepIndex: number;
  answers: Record<string, string>;
};

const STORAGE_KEY = 'zooassistant_threads_v1';

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 1,
    title: 'Как правильно оформить объявление о пропаже?',
    period: '30 дней',
    messages: [],
  },
  {
    id: 2,
    title: 'Какие документы нужны для передачи животного?',
    period: '2026-02',
    messages: [],
  },
  {
    id: 3,
    title: 'Помоги с текстом поста о пристройстве',
    period: '2025-11',
    messages: [],
  },
];

const ANNOUNCEMENT_PRESETS: AnnouncementPreset[] = [
  {
    label: 'Пропал',
    type: 'lost',
    prompt: 'Помоги составить объявление: пропало животное.',
  },
  {
    label: 'Найден',
    type: 'found',
    prompt: 'Помоги составить объявление: найдено животное.',
  },
  {
    label: 'Ищу дом',
    type: 'adoption',
    prompt: 'Помоги составить объявление о поиске нового дома для животного.',
  },
  {
    label: 'Отдам',
    type: 'giveaway',
    prompt: 'Помоги составить объявление: отдаю животное в добрые руки.',
  },
];

const ANNOUNCEMENT_WIZARD_STEPS: WizardStep[] = [
  { key: 'announcementType', question: 'Какой тип объявления: Пропал, Найден, Ищу дом или Отдам?' },
  { key: 'animal', question: 'Какое это животное? Укажите вид, кличку, породу, пол и возраст (если знаете).' },
  { key: 'city', question: 'В каком городе или населенном пункте это произошло?' },
  { key: 'location', question: 'Уточните район или точное место.' },
  { key: 'dateInfo', question: 'Когда это произошло? Укажите дату и примерное время.' },
  { key: 'signs', question: 'Какие особые приметы или важные детали нужно добавить?' },
  { key: 'contact', question: 'Как с вами связаться? Телефон, мессенджер или другой контакт.' },
  { key: 'extra', question: 'Есть ли дополнительная информация: вознаграждение, просьбы, ограничения?' },
];

export default function ZooAssistantPage() {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('general');
  const [announcementType, setAnnouncementType] = useState<string>('');
  const [announcementWizard, setAnnouncementWizard] = useState<AnnouncementWizardState>({
    active: false,
    stepIndex: 0,
    answers: {},
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [uiReady, setUiReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeThread = activeThreadId
    ? threads.find((thread) => thread.id === activeThreadId)
    : undefined;
  const messages = useMemo(() => activeThread?.messages || [], [activeThread]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { threads?: ChatThread[]; activeThreadId?: number | null };
      if (Array.isArray(parsed.threads) && parsed.threads.length > 0) {
        setThreads(parsed.threads);
        if (
          typeof parsed.activeThreadId === 'number' &&
          parsed.threads.some((t) => t.id === parsed.activeThreadId)
        ) {
          setActiveThreadId(parsed.activeThreadId);
        } else {
          setActiveThreadId(null);
        }
      }
    } catch {
      // ignore broken localStorage payload
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const payload = JSON.stringify({ threads, activeThreadId });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [threads, activeThreadId, mounted]);

  useEffect(() => {
    const timer = setTimeout(() => setUiReady(true), 30);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, activeThreadId]);

  const createNewChat = () => {
    const id = Date.now();
    const newThread: ChatThread = {
      id,
      title: 'Новый чат',
      period: '30 дней',
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    setInput('');
  };

  const ensureActiveThread = () => {
    if (activeThread) return activeThread;

    const id = Date.now();
    const newThread: ChatThread = {
      id,
      title: 'Новый чат',
      period: '30 дней',
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    return newThread;
  };

  const appendAssistantMessageToThread = (threadID: number, text: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadID
          ? { ...thread, messages: [...thread.messages, { role: 'assistant', text }] }
          : thread,
      ),
    );
  };

  const detectAnnouncementType = (value: string) => {
    const source = value.toLowerCase();
    if (source.includes('пропал') || source.includes('потер')) return 'lost';
    if (source.includes('найден') || source.includes('наш')) return 'found';
    if (source.includes('ищу дом') || source.includes('пристро')) return 'adoption';
    if (source.includes('отдам')) return 'giveaway';
    return 'generic';
  };

  const buildAnnouncementPromptFromAnswers = (answers: Record<string, string>) => {
    return [
      'Составь готовое объявление о животном по этим данным:',
      `Тип объявления: ${answers.announcementType || 'не указан'}`,
      `Животное: ${answers.animal || 'не указано'}`,
      `Город/населенный пункт: ${answers.city || 'не указан'}`,
      `Район/место: ${answers.location || 'не указано'}`,
      `Дата и время: ${answers.dateInfo || 'не указаны'}`,
      `Приметы и детали: ${answers.signs || 'не указаны'}`,
      `Контакт для связи: ${answers.contact || 'не указан'}`,
      `Дополнительная информация: ${answers.extra || 'нет'}`,
    ].join('\n');
  };

  const handleSelectAnnouncementPreset = (preset: AnnouncementPreset) => {
    setAnnouncementWizard({ active: false, stepIndex: 0, answers: {} });
    setInput('');
    setAssistantMode('announcement');
    setAnnouncementType(preset.type);
    setInput(preset.prompt);
  };

  const deleteThread = (threadID: number) => {
    const filtered = threads.filter((thread) => thread.id !== threadID);

    if (filtered.length === 0) {
      const fallbackID = Date.now();
      setThreads([
        {
          id: fallbackID,
          title: 'Новый чат',
          period: '30 дней',
          messages: [],
        },
      ]);
      setActiveThreadId(null);
      return;
    }

    setThreads(filtered);
    if (activeThreadId === threadID) {
      setActiveThreadId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    const threadForSend = ensureActiveThread();
    if (!threadForSend) return;

    const looksLikeAnnouncementStart =
      userMessage.toLowerCase().includes('состав') &&
      userMessage.toLowerCase().includes('объяв');

    const nextMessages = [...threadForSend.messages, { role: 'user' as const, text: userMessage }];

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadForSend.id
          ? {
              ...thread,
              title:
                thread.title === 'Новый чат'
                  ? userMessage.slice(0, 36) + (userMessage.length > 36 ? '...' : '')
                  : thread.title,
              messages: nextMessages,
            }
          : thread,
      ),
    );

    setInput('');

    if (!announcementWizard.active && looksLikeAnnouncementStart) {
      setAssistantMode('announcement');
      setAnnouncementType('generic');
      setAnnouncementWizard({
        active: true,
        stepIndex: 0,
        answers: {},
      });
      appendAssistantMessageToThread(
        threadForSend.id,
        'Отлично, давайте сделаем объявление пошагово. Какой тип объявления: Пропал, Найден, Ищу дом или Отдам?',
      );
      return;
    }

    if (announcementWizard.active) {
      const step = ANNOUNCEMENT_WIZARD_STEPS[announcementWizard.stepIndex];
      const updatedAnswers = { ...announcementWizard.answers, [step.key]: userMessage };

      if (step.key === 'announcementType') {
        setAnnouncementType(detectAnnouncementType(userMessage));
      }

      const nextStepIndex = announcementWizard.stepIndex + 1;
      if (nextStepIndex < ANNOUNCEMENT_WIZARD_STEPS.length) {
        setAnnouncementWizard({
          active: true,
          stepIndex: nextStepIndex,
          answers: updatedAnswers,
        });
        appendAssistantMessageToThread(
          threadForSend.id,
          ANNOUNCEMENT_WIZARD_STEPS[nextStepIndex].question,
        );
        return;
      }

      setAnnouncementWizard({
        active: false,
        stepIndex: 0,
        answers: {},
      });
      setAssistantMode('announcement');
      const typeForRequest =
        detectAnnouncementType(updatedAnswers.announcementType || '') ||
        announcementType ||
        'generic';

      setIsLoading(true);
      try {
        const response = await fetch('/api/zooassistant/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: buildAnnouncementPromptFromAnswers(updatedAnswers),
            mode: 'announcement',
            announcement_type: typeForRequest,
          }),
        });

        if (!response.ok) {
          throw new Error('request failed');
        }

        const data = await response.json();
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadForSend.id
              ? {
                  ...thread,
                  messages: [
                    ...thread.messages,
                    { role: 'assistant', text: data.answer || 'Пока нет ответа. Попробуйте снова.' },
                  ],
                }
              : thread,
          ),
        );
      } catch {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadForSend.id
              ? {
                  ...thread,
                  messages: [
                    ...thread.messages,
                    {
                      role: 'assistant',
                      text: 'Не удалось завершить генерацию объявления. Попробуйте еще раз.',
                    },
                  ],
                }
              : thread,
          ),
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/zooassistant/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          mode: assistantMode,
          announcement_type: announcementType,
        }),
      });

      if (!response.ok) {
        throw new Error('request failed');
      }

      const data = await response.json();
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadForSend.id
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  { role: 'assistant', text: data.answer || 'Пока нет ответа. Попробуйте снова.' },
                ],
              }
            : thread,
        ),
      );
    } catch {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadForSend.id
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    role: 'assistant',
                    text: 'Сервис временно недоступен. Попробуйте еще раз через минуту.',
                  },
                ],
              }
            : thread,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const groupedThreads = threads.reduce<Record<string, ChatThread[]>>((acc, thread) => {
    if (!acc[thread.period]) acc[thread.period] = [];
    acc[thread.period].push(thread);
    return acc;
  }, {});

  return (
    <div
      className={`h-[calc(100dvh-74px)] md:h-[calc(100vh-74px)] bg-white md:rounded-lg md:shadow-sm md:border border-gray-200 flex overflow-hidden transition-opacity duration-300 ${uiReady ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`h-full w-full flex transition-all duration-300 ${uiReady ? 'translate-y-0' : 'translate-y-1'}`}
      >
        <aside
          className={`${activeThreadId ? 'hidden md:flex' : 'flex'} flex-col border-r border-gray-200 bg-gradient-to-b from-blue-50 to-slate-50 transition-all duration-300 ${isSidebarCollapsed ? 'md:w-[86px]' : 'md:w-80 xl:w-[340px]'} w-full ${uiReady ? 'translate-x-0' : '-translate-x-2'}`}
        >
          <div className={`border-b border-slate-200/80 ${isSidebarCollapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold tracking-tight text-slate-900">ZooAssistant</div>
                    <div className="text-xs text-slate-500">AI для ЗооПлатформы</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden md:flex h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 items-center justify-center"
                title={isSidebarCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
              >
                {isSidebarCollapsed ? (
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                ) : (
                  <ChevronDoubleLeftIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className={isSidebarCollapsed ? 'p-2' : 'p-4'}>
            <button
              onClick={createNewChat}
              title="Новый чат"
              className={`w-full rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:border-blue-300 hover:bg-blue-50/60 transition-colors flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'justify-center gap-2 px-4 py-3'}`}
            >
              <PlusCircleIcon className="w-5 h-5 text-blue-600" />
              {!isSidebarCollapsed && 'Новый чат'}
            </button>
          </div>

          <div className="px-3 pb-4 overflow-y-auto">
            {Object.entries(groupedThreads).map(([period, periodThreads]) => (
              <div key={period} className="mb-5">
                {!isSidebarCollapsed && (
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {period}
                  </div>
                )}

                <div className="space-y-1">
                  {periodThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={
                        thread.id === activeThreadId
                          ? `w-full rounded-xl bg-white border border-slate-300 shadow-sm ${isSidebarCollapsed ? 'px-0 py-2.5 flex justify-center' : 'px-2 py-1.5'}`
                          : `w-full rounded-xl text-slate-700 hover:bg-white/70 transition-colors ${isSidebarCollapsed ? 'px-0 py-2.5 flex justify-center' : 'px-2 py-1.5'}`
                      }
                    >
                      {isSidebarCollapsed ? (
                        <button
                          onClick={() => setActiveThreadId(thread.id)}
                          title={thread.title}
                          className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center"
                        >
                          {thread.title.slice(0, 1).toUpperCase()}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveThreadId(thread.id)}
                            title={thread.title}
                            className="flex-1 text-left px-1 py-1 text-[15px] font-medium truncate"
                          >
                            {thread.title}
                          </button>
                          <button
                            onClick={() => deleteThread(thread.id)}
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                            title="Удалить чат"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className={`${activeThreadId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col bg-white`}>
            {activeThreadId && (
              <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-white">
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="h-8 w-8 rounded-lg border border-slate-300 bg-white text-slate-700 flex items-center justify-center"
                  aria-label="Назад к чатам"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <div className="text-sm font-medium text-slate-800 truncate">
                  {activeThread?.title || 'Новый чат'}
                </div>
              </div>
            )}
            {messages.length === 0 ? (
              <div
                className={`flex-1 flex flex-col items-center justify-center px-4 sm:px-8 transition-all duration-500 ${uiReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold mb-4">
                    <SparklesIcon className="w-4 h-4" />
                    AI-ассистент
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900">
                    Чем могу помочь?
                  </h1>
                  <p className="mt-3 text-sm sm:text-base text-slate-500">
                    Я — Зоопомощник. Сейчас даю базовые ответы и пока еще учусь. Уже сейчас могу
                    помочь составить или улучшить текст объявления о животном.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {ANNOUNCEMENT_PRESETS.map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => handleSelectAnnouncementPreset(preset)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          assistantMode === 'announcement' && announcementType === preset.type
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm scale-[1.03]'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-4xl">
                  <div className="rounded-3xl border border-slate-300 bg-white px-4 py-3 shadow-[0_12px_32px_-18px_rgba(15,23,42,.35)]">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Сообщение для Зоопомощника"
                      className="w-full bg-transparent text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssistantMode('announcement');
                            setAnnouncementType('generic');
                            setAnnouncementWizard({ active: false, stepIndex: 0, answers: {} });
                            setInput('Помоги составить объявление о животном.');
                          }}
                          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm ${
                            assistantMode === 'announcement'
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-slate-50 text-slate-700'
                          }`}
                        >
                          Объявления
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50"
                      >
                        <ArrowUpIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-200 bg-white/80 px-4 sm:px-6 py-3">
                  <div className="text-sm font-medium text-slate-700 truncate">{activeThread?.title}</div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-3 sm:px-6 py-8 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                        <div
                          className={
                            message.role === 'user'
                              ? 'inline-block max-w-[92%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 bg-blue-600 text-white text-sm whitespace-pre-wrap break-words leading-relaxed'
                              : 'inline-block max-w-[92%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 bg-white border border-slate-200 text-slate-900 text-sm shadow-sm whitespace-pre-wrap break-words leading-relaxed'
                          }
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                  {isLoading && (
                    <div className="text-left">
                        <div className="inline-block rounded-2xl px-4 py-2 bg-white border border-slate-200 text-slate-500 text-sm">
                          Печатает...
                        </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

                <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white/90 border-t border-slate-200">
                  <div className="max-w-3xl mx-auto rounded-2xl border border-slate-300 bg-white px-3 py-2 flex items-center gap-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setAssistantMode('announcement');
                        setAnnouncementType('generic');
                        setAnnouncementWizard({ active: false, stepIndex: 0, answers: {} });
                        setInput('Помоги составить объявление о животном.');
                      }}
                      className={`hidden sm:inline-flex rounded-full border px-2.5 py-1 text-xs ${
                        assistantMode === 'announcement'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      Объявление
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Сообщение для Зоопомощника"
                      className="flex-1 px-2 py-2 text-sm bg-transparent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50"
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
        </section>
      </div>
    </div>
  );
}
