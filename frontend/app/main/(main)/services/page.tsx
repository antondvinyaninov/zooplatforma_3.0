'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  HeartIcon,
  HomeModernIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  SparklesIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  MoonIcon,
  SparklesIcon as BoltIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface Service {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'coming_soon';
  features: string[];
  requiresSuperAdmin?: boolean;
  inDevelopment?: string[];
  icon: React.ElementType;
  colorClass: string;
  category: 'owner' | 'specialist' | 'business' | 'government' | 'volunteer';
}

export default function ServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isSuperAdmin = (user as any)?.roles?.includes('superadmin') || false;

  const services: Service[] = [
    {
      id: 'owner',
      name: 'Кабинет владельца',
      description: 'Управление своими питомцами, медицинские записи, история событий',
      url: '/owner',
      status: 'active',
      icon: UserIcon,
      colorClass: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
      category: 'owner',
      features: [
        'Список моих питомцев',
        'Медицинская карта',
        'История событий',
        'Создание постов о питомцах',
      ],
      inDevelopment: [
        'Регистрация новых питомцев',
        'Внесение обработок',
        'Напоминания о процедурах',
      ],
    },
    {
      id: 'volunteer',
      name: 'Кабинет зоопомощника',
      description: 'Управление подопечными животными, задачи, кураторство',
      url: '/pethelper',
      status: 'active',
      icon: HeartIcon,
      colorClass: 'text-pink-600 bg-pink-50 group-hover:bg-pink-100',
      category: 'volunteer',
      features: [
        'Список подопечных',
        'Управление задачами',
        'Изменение статусов',
        'Обработки и уход',
      ],
      inDevelopment: ['Организация сборов', 'Передержки', 'Репутация и бейджи'],
    },
    {
      id: 'shelter',
      name: 'Кабинет приюта',
      description: 'Реестр животных приюта, пристройство, управление волонтёрами',
      url: 'http://localhost:5100',
      status: 'active',
      icon: HomeModernIcon,
      colorClass: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100',
      category: 'business',
      features: [
        'Реестр животных приюта',
        'Приём и выбытие',
        'Управление волонтёрами',
        'Статистика пристройств',
      ],
      inDevelopment: ['Приём заявок на отлов', 'Программа ОСВВ', 'Отчётность в гос. органы'],
    },
    {
      id: 'clinic',
      name: 'Кабинет ветклиники',
      description: 'Регистрация PetID, медицинские события, история визитов',
      url: 'http://localhost:6300',
      status: 'active',
      icon: PlusCircleIcon,
      colorClass: 'text-violet-600 bg-violet-50 group-hover:bg-violet-100',
      category: 'business',
      features: ['Регистрация PetID', 'Медицинские события', 'Поиск по чипу', 'История визитов'],
      inDevelopment: [
        'Онлайн-запись на приём',
        'Подтверждение смерти',
        'Выдача чипов',
        'Груминг-услуги',
      ],
    },
    {
      id: 'petbase',
      name: 'ЗооБаза (PetID)',
      description: 'Единый реестр всех животных с полной историей жизни',
      url: 'http://localhost:4100',
      status: 'active',
      requiresSuperAdmin: true,
      icon: ShieldCheckIcon,
      colorClass: 'text-orange-600 bg-orange-50 group-hover:bg-orange-100',
      category: 'government',
      features: ['Единый реестр животных', 'История событий', 'Медицинская карта', 'Родословная'],
    },
    {
      id: 'zooassistant',
      name: 'Зоопомощник (AI)',
      description: 'AI-ассистент для помощи владельцам и волонтёрам',
      url: '/zooassistant',
      status: 'active',
      icon: ChatBubbleLeftRightIcon,
      colorClass: 'text-purple-600 bg-purple-50 group-hover:bg-purple-100',
      category: 'owner',
      features: [
        'Ответы на вопросы 24/7',
        'Рекомендации по уходу',
        'Юридическая зоопомощь',
        'Поиск ветклиник',
        'Помощь в пристройстве',
      ],
    },
    {
      id: 'admin',
      name: 'Админ-панель',
      description: 'Управление платформой, модерация, статистика',
      url: 'http://localhost:4000',
      status: 'active',
      requiresSuperAdmin: true,
      icon: Cog6ToothIcon,
      colorClass: 'text-gray-700 bg-gray-100 group-hover:bg-gray-200',
      category: 'government',
      features: [
        'Управление пользователями',
        'Модерация контента',
        'Статистика платформы',
        'Логирование действий',
      ],
    },
    {
      id: 'petshop',
      name: 'Кабинет зоомагазина',
      description: 'Управление товарами, заказами, программа лояльности',
      url: '#',
      status: 'coming_soon',
      icon: ShoppingBagIcon,
      colorClass: 'text-indigo-600 bg-indigo-50',
      category: 'business',
      features: [
        'Каталог товаров',
        'Управление заказами',
        'Программа лояльности',
        'Интеграция с доставкой',
      ],
    },
    {
      id: 'foundation',
      name: 'Кабинет фонда/НКО',
      description: 'Управление проектами, сборы средств, волонтёры, отчётность',
      url: '#',
      status: 'coming_soon',
      icon: BanknotesIcon,
      colorClass: 'text-teal-600 bg-teal-50',
      category: 'volunteer',
      features: [
        'Управление проектами',
        'Сборы средств',
        'Координация волонтёров',
        'Прозрачная отчётность',
        'Работа с донорами',
      ],
    },
    {
      id: 'marketplace',
      name: 'Зоомаркет',
      description: 'Маркетплейс товаров и услуг для животных',
      url: '#',
      status: 'coming_soon',
      icon: SparklesIcon,
      colorClass: 'text-amber-600 bg-amber-50',
      category: 'business',
      features: [
        'Каталог товаров для животных',
        'Услуги для питомцев',
        'Отзывы и рейтинги',
        'Интеграция с доставкой',
      ],
    },
    {
      id: 'events',
      name: 'Афиша',
      description: 'События, выставки, мероприятия для животных',
      url: '#',
      status: 'coming_soon',
      icon: CalendarDaysIcon,
      colorClass: 'text-rose-600 bg-rose-50',
      category: 'owner',
      features: [
        'Календарь мероприятий',
        'Выставки и конкурсы',
        'Регистрация на события',
        'Фотоотчёты',
      ],
    },
    {
      id: 'education',
      name: 'Учебный центр (ЗооАкадемия)',
      description: 'Обучение уходу за животными, курсы для владельцев',
      url: '#',
      status: 'coming_soon',
      icon: AcademicCapIcon,
      colorClass: 'text-purple-600 bg-purple-50',
      category: 'owner',
      features: ['Онлайн-курсы', 'Видеоуроки', 'Сертификация', 'База знаний'],
    },
    {
      id: 'municipality',
      name: 'Кабинет муниципалитета',
      description: 'Управление программами ОСВВ, контроль приютов, отчётность',
      url: '#',
      status: 'coming_soon',
      icon: BuildingLibraryIcon,
      colorClass: 'text-blue-700 bg-blue-50',
      category: 'government',
      features: [
        'Управление программой ОСВВ',
        'Контроль работы приютов',
        'Статистика по городу',
        'Отчётность в гос. органы',
        'Бюджет на зоозащиту',
      ],
    },
    {
      id: 'veterinary_dept',
      name: 'Управление ветеринарии',
      description: 'Контроль ветклиник, эпидемиологический надзор, лицензирование',
      url: '#',
      status: 'coming_soon',
      icon: ClipboardDocumentCheckIcon,
      colorClass: 'text-emerald-700 bg-emerald-50',
      category: 'government',
      features: [
        'Контроль ветклиник',
        'Эпидемиологический надзор',
        'Лицензирование клиник',
        'Статистика вакцинации',
        'Контроль бешенства',
      ],
    },
    {
      id: 'petitions',
      name: 'Петиции',
      description: 'Общественные инициативы по защите животных',
      url: '#',
      status: 'coming_soon',
      icon: MegaphoneIcon,
      colorClass: 'text-orange-600 bg-orange-50',
      category: 'owner',
      features: [
        'Создание петиций',
        'Сбор подписей',
        'Голосование',
        'Отслеживание статуса',
        'Интеграция с властями',
      ],
    },
    {
      id: 'hotline',
      name: 'Горячая линия',
      description: 'Круглосуточная помощь по вопросам животных',
      url: '#',
      status: 'coming_soon',
      icon: PhoneIcon,
      colorClass: 'text-red-600 bg-red-50',
      category: 'owner',
      features: [
        'Круглосуточная поддержка',
        'Консультации ветеринаров',
        'Помощь в экстренных случаях',
        'База знаний',
        'История обращений',
      ],
    },
    {
      id: 'breeder',
      name: 'Кабинет заводчика',
      description: 'Управление племенным разведением, родословные, продажа',
      url: '#',
      status: 'coming_soon',
      icon: StarIcon,
      colorClass: 'text-yellow-600 bg-yellow-50',
      category: 'business',
      features: [
        'Управление племенным разведением',
        'Родословные и документы',
        'Продажа щенков/котят',
        'Репутация и отзывы',
        'Интеграция с РКФ/WCF',
      ],
    },
    {
      id: 'pet_hotel',
      name: 'Зоогостиница',
      description: 'Бронирование, календарь, фото/видео отчёты, передержки',
      url: '#',
      status: 'coming_soon',
      icon: MoonIcon,
      colorClass: 'text-sky-600 bg-sky-50',
      category: 'business',
      features: [
        'Бронирование мест',
        'Календарь занятости',
        'Условия содержания',
        'Фото/видео отчёты владельцам',
        'Управление передержками',
      ],
    },
    {
      id: 'trainer',
      name: 'Кабинет специалиста',
      description: 'Кинологи, зоопсихологи, грумеры',
      url: '#',
      status: 'coming_soon',
      icon: BoltIcon,
      colorClass: 'text-lime-600 bg-lime-50',
      category: 'specialist',
      features: [
        'Онлайн-консультации',
        'Программы дрессировки',
        'Груминг-услуги',
        'Коррекция поведения',
        'История работы с питомцем',
      ],
    },
    {
      id: 'memorial',
      name: 'Ритуальные услуги',
      description: 'Кремация, захоронение, контроль смертности',
      url: '#',
      status: 'coming_soon',
      icon: ArchiveBoxIcon,
      colorClass: 'text-slate-600 bg-slate-100',
      category: 'business',
      features: [
        'Кремация',
        'Захоронение',
        'Памятные услуги',
        'Поддержка владельцев',
        'Контроль смертности',
      ],
    },
    {
      id: 'animal_protection',
      name: 'Зоозащитная инспекция',
      description: 'Борьба с жестокостью, приём жалоб, координация с властями',
      url: '#',
      status: 'coming_soon',
      icon: ExclamationTriangleIcon,
      colorClass: 'text-red-700 bg-red-50',
      category: 'government',
      features: [
        'Приём жалоб',
        'Координация с полицией',
        'База нарушителей',
        'Статистика по городу',
        'Работа с судами',
      ],
    },
  ];

  const handleServiceClick = (service: Service) => {
    if (service.status === 'coming_soon') {
      alert('Этот сервис находится в разработке и будет доступен в следующих версиях');
      return;
    }

    if (service.requiresSuperAdmin && !isSuperAdmin) {
      alert('Доступ к этому сервису имеют только администраторы платформы');
      return;
    }

    if (service.id === 'owner') {
      window.location.href = '/owner';
      return;
    }

    if (service.id === 'volunteer') {
      window.location.href = '/pethelper';
      return;
    }

    if (service.id === 'zooassistant') {
      window.location.href = '/zooassistant';
      return;
    }

    window.open(service.url, '_blank');
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeServices = filteredServices.filter((s) => s.status === 'active');
  const comingSoonServices = filteredServices.filter((s) => s.status === 'coming_soon');

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Шапка с поиском и фильтрами */}
      <div className="flex flex-col gap-6 mt-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Экосистема Сервисов</h1>
            <p className="text-gray-500 mt-2 max-w-2xl">
              Единое пространство для владельцев, специалистов и бизнеса. Выберите нужный кабинет для начала работы.
            </p>
          </div>
          
          {/* Поиск */}
          <div className="relative w-full lg:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Найти сервис..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Фильтры-табы */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button 
            onClick={() => setSelectedCategory('all')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Все направления
          </button>
          <button 
            onClick={() => setSelectedCategory('owner')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'owner' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Владельцам
          </button>
          <button 
            onClick={() => setSelectedCategory('specialist')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'specialist' ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Специалистам
          </button>
          <button 
            onClick={() => setSelectedCategory('volunteer')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'volunteer' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Волонтёрам
          </button>
          <button 
            onClick={() => setSelectedCategory('business')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'business' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Бизнесу
          </button>
          <button 
            onClick={() => setSelectedCategory('government')} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === 'government' ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            Гос. сектору
          </button>
        </div>
      </div>

      {activeServices.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Активные кабинеты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col h-full"
              >
                {/* Иконка, Заголовок и бейджи */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${service.colorClass}`}>
                      <service.icon className="w-6 h-6 shrink-0" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {service.name}
                    </h3>
                  </div>
                  
                  {service.requiresSuperAdmin && (
                    <div className="self-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                        Админ
                      </span>
                    </div>
                  )}
                </div>

                {/* Описание */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {service.description}
                  </p>
                </div>

                {/* Линия-разделитель */}
                <div className="h-px bg-gray-100 w-full my-4"></div>

                {/* Функции */}
                <div className="flex-1">
                  <ul className="space-y-2.5">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 mr-2.5 shrink-0 group-hover:bg-blue-400 transition-colors"></span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                    {service.features.length > 3 && (
                      <li className="text-xs text-gray-400 italic pl-4">
                        и еще {service.features.length - 3}...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Кнопка */}
                <div className="mt-8">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-sm font-semibold text-gray-700 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                    Открыть кабинет 
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        searchQuery && <p className="text-gray-500">Ничего не найдено по запросу "{searchQuery}"</p>
      )}

      {/* Разделитель */}
      {activeServices.length > 0 && comingSoonServices.length > 0 && (
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>
      )}

      {/* Сервисы в разработке */}
      {comingSoonServices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            Скоро на платформе
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {comingSoonServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 opacity-80 hover:opacity-100 transition-all duration-200 flex items-center gap-4 cursor-pointer"
              >
                <div className={`p-2.5 rounded-lg ${service.colorClass} saturate-50`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-700">{service.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
