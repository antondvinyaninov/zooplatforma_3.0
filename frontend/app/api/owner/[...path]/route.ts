import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1');

// Проксирование всех /api/owner/* запросов в Go Backend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, await params);
}

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    // Полный URL для проксирования - добавляем /api/owner/ перед путем
    const backendUrl = `${BACKEND_API_URL}/api/owner/${path}${queryString}`;

    console.log(`[Owner Proxy] ${request.method} ${backendUrl}`);

    // Копируем заголовки из оригинального запроса
    const headers = new Headers();

    // Копируем важные заголовки
    const headersToForward = [
      'authorization',
      'content-type',
      'user-agent',
      'accept',
      'accept-language',
    ];

    headersToForward.forEach((headerName) => {
      const value = request.headers.get(headerName);
      if (value) {
        headers.set(headerName, value);
      }
    });

    // Получаем cookies из запроса и передаем их в backend
    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
      headers.set('cookie', cookieHeader);
    }

    // Получаем тело запроса
    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');

      // Для multipart/form-data передаем тело как есть (не парсим)
      if (contentType && contentType.includes('multipart/form-data')) {
        // Оставляем content-type с правильным boundary и передаем request.body как поток
        headers.set('content-type', contentType);
        body = request.body as any; // Next.js Request body is a ReadableStream which is valid for fetch
      } else {
        // Для обычных запросов читаем как текст
        try {
          const text = await request.text();
          if (text) {
            body = text;
          }
        } catch (e) {
          // No request body
        }
      }
    }

    // Делаем запрос к Backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      // Не следуем редиректам автоматически
      redirect: 'manual',
      // Для передачи ReadableStream в next.js fetch требуется опция duplex
      duplex: 'half',
    } as RequestInit);

    // Копируем заголовки ответа
    const responseHeaders = new Headers();

    // Копируем все заголовки кроме некоторых
    const headersToSkip = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];

    response.headers.forEach((value, key) => {
      if (!headersToSkip.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Получаем тело ответа
    const responseBody = await response.arrayBuffer();

    // Создаем ответ
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    // Если backend установил Set-Cookie, копируем их в ответ
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    setCookieHeaders.forEach((cookie) => {
      nextResponse.headers.append('Set-Cookie', cookie);
    });

    return nextResponse;
  } catch (error) {
    console.error('[Owner Proxy Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
      },
      { status: 502 },
    );
  }
}
