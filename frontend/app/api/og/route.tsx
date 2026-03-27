import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Получаем параметры из URL: ?title=...&image=...&type=sale
    const title = searchParams.get('title');
    const imageUrl = searchParams.get('image');
    const type = searchParams.get('type');
    const comments = searchParams.get('comments') || '0';
    const likes = searchParams.get('likes') || '0';

    // Дефолтные значения
    const displayTitle = title ? title : 'Читайте новый пост на ЗооПлатформе!';
    const displayImage = imageUrl ? imageUrl : 'https://zooplatforma.com/default-og.png'; // TODO: replace with real fallback

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            backgroundImage: `url(${displayImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Градиентный оверлей снизу вверх для читаемости текста */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
              color: 'white',
              position: 'relative',
              width: '100%',
            }}
          >
            {type && type !== 'post' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: type === 'sale' ? '#10B981' : type === 'lost' ? '#F59E0B' : type === 'found' ? '#059669' : '#EF4444',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: 24,
                  marginBottom: '16px',
                }}
              >
                {type === 'sale' ? '📢 Объявление' : type === 'lost' ? '🐾 Потерялся' : type === 'found' ? '💚 Нашелся' : '🆘 Помощь'}
              </div>
            )}
            
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                margin: 0,
                marginBottom: 16,
                lineHeight: 1.2,
                fontFamily: 'sans-serif',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {displayTitle}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 24, fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#EF4444" stroke="#EF4444" />
                </svg>
                {likes}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                {comments}
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                ЗооПлатформа
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Failed to generate OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
