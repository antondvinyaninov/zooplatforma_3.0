import { NextRequest, NextResponse } from 'next/server';

// Backend API URL (локально - 127.0.0.1:8000, в production - 127.0.0.1:8000 внутри контейнера)
const BACKEND_API_URL = (process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1');

// Проксирование всех /api/* запросов в Go Backend
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
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
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

    // Полный URL для проксирования
    const backendUrl = `${BACKEND_API_URL}/api/${path}${queryString}`;

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

      // Для multipart/form-data передаем тело как поток Request.body для сохранения boundary
      if (contentType && (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream'))) {
        body = request.body as unknown as BodyInit;
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
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      // Не следуем редиректам автоматически
      redirect: 'manual',
    };

    // Для отправки потоков (ReadableStream) в Node.js fetch нужен флаг duplex='half'
    if (body && typeof (body as any).getReader === 'function') {
      (fetchOptions as any).duplex = 'half';
    }

    const response = await fetch(backendUrl, fetchOptions);

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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Proxy error',
      },
      { status: 502 },
    );
  }
}
