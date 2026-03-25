import { ReactNode } from 'react';

export interface WidgetDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  defaultW: number;
  defaultH: number;
  component: ReactNode;
}

// Импорты виджетов
import AnimalsWidget from '../../pets/widgets/AnimalsWidget';
import TeamWidget from './TeamWidget';
import StatsWidget from './StatsWidget';
import NotificationsWidget from './NotificationsWidget';
import PostsWidget from './PostsWidget';
import RequestsWidget from './RequestsWidget';

export const WIDGET_DEFINITIONS: WidgetDef[] = [
  {
    id: 'animals',
    title: 'Животные',
    icon: '🐾',
    description: 'Количество подопечных организации по статусам',
    defaultW: 4,
    defaultH: 3,
    component: <AnimalsWidget />,
  },
  {
    id: 'team',
    title: 'Команда',
    icon: '👥',
    description: 'Участники организации и их роли',
    defaultW: 4,
    defaultH: 3,
    component: <TeamWidget />,
  },
  {
    id: 'stats',
    title: 'Статистика',
    icon: '📊',
    description: 'Просмотры профиля и активность',
    defaultW: 8,
    defaultH: 2,
    component: <StatsWidget />,
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    icon: '🔔',
    description: 'Последние события по организации',
    defaultW: 4,
    defaultH: 4,
    component: <NotificationsWidget />,
  },
  {
    id: 'posts',
    title: 'Лента постов',
    icon: '📰',
    description: 'Последние публикации сообщества',
    defaultW: 4,
    defaultH: 4,
    component: <PostsWidget />,
  },
  {
    id: 'requests',
    title: 'Обращения',
    icon: '📋',
    description: 'Входящие заявки и запросы',
    defaultW: 4,
    defaultH: 3,
    component: <RequestsWidget />,
  },
];
