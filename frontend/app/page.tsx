import { Metadata, ResolvingMetadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import MainLayout from './main/(main)/layout';
import Home from './main/(main)/page';

type Props = {
  searchParams: Promise<{ metka?: string }>;
};

// Генерация динамических OpenGraph тегов для шеринга постов
export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const { metka } = await props.searchParams;
  const previousImages = (await parent).openGraph?.images || [];

  if (!metka) {
    return {
      title: 'ЗооПлатформа 3.0',
      description: 'Единая экосистема для помощи животным',
    };
  }

  try {
    // В идеале здесь должен быть fetch к backend API для получения деталей поста.
    // Пока что мы генерируем OG-ссылку, передавая metkaId. Api /api/og само разберется
    // В будущем можно расширить /api/og запрос или добавить fetch прямо сюда
    const ogUrl = new URL(
      process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/og` 
        : 'https://zooplatforma.com/api/og' // fallback
    );
    
    // Передаем параметры для генератора картинки
    ogUrl.searchParams.set('title', 'Срочно требуется помощь! Читайте пост на ЗооПлатформе');
    ogUrl.searchParams.set('type', 'post');

    return {
      title: 'ЗооПлатформа | Пост',
      description: 'Помогите спасти жизнь! Читайте подробности на платформе.',
      openGraph: {
        images: [
          {
            url: ogUrl.toString(),
            width: 1200,
            height: 630,
            alt: 'Превью поста',
          },
          ...previousImages,
        ],
      },
      twitter: {
        card: 'summary_large_image',
      },
    };
  } catch (e) {
    return {
      title: 'ЗооПлатформа',
    };
  }
}

export default async function RootPage(props: Props) {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout>{await Home(props)}</MainLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
