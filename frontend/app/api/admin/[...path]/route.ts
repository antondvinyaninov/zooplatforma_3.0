import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://127.0.0.1:8000').replace('localhost', '127.0.0.1');

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

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    const backendUrl = `${BACKEND_API_URL}/api/admin/${path}${queryString}`;

    console.log(`[Admin Proxy] ${request.method} ${backendUrl}`);

    const headers = new Headers();
    ['authorization', 'content-type', 'user-agent', 'accept', 'accept-language'].forEach(
      (headerName) => {
        const value = request.headers.get(headerName);
        if (value) headers.set(headerName, value);
      },
    );

    const cookies = request.cookies.getAll();
    if (cookies.length > 0) {
      headers.set('cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));
    }

    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
        headers.set('content-type', contentType);
        body = request.body as any; // Next.js Request body is a ReadableStream which is valid for fetch
      } else {
        try {
          const text = await request.text();
          if (text) body = text;
        } catch (e) {}
      }
    }

    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      // Для передачи ReadableStream в next.js fetch требуется опция duplex
      duplex: 'half',
    } as RequestInit);

    const responseHeaders = new Headers();
    const headersToSkip = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];
    response.headers.forEach((value, key) => {
      if (!headersToSkip.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await response.arrayBuffer();
    const nextResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    setCookieHeaders.forEach((cookie) => nextResponse.headers.append('Set-Cookie', cookie));

    return nextResponse;
  } catch (error) {
    console.error('[Admin Proxy Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Proxy error' },
      { status: 502 },
    );
  }
}
