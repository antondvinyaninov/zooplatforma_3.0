import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.ADMIN_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = `${BACKEND_API_URL}/api/support`;

    console.log(`[Support Proxy] POST ${backendUrl}`);

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
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Для multipart/form-data мы должны передать стрим как есть
      // и Next.js Request.body — это ReadableStream, который fetch понимает
      headers.set('content-type', contentType);
      body = request.body as any;
    } else {
      try {
        const text = await request.text();
        if (text) body = text;
      } catch (e) {}
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
      // Обязательный флаг (duplex: 'half') для передачи ReadableStream в next.js fetch
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

    return nextResponse;
  } catch (error) {
    console.error('[Support Proxy Error]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Proxy error' },
      { status: 502 },
    );
  }
}
