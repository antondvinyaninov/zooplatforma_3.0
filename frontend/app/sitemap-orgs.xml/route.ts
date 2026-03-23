import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://zooplatforma.ru';
  const apiUrl = process.env.ADMIN_API_URL || 'http://localhost:8000';

  try {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Получаем список организаций
    const orgsResponse = await fetch(`${apiUrl}/api/sitemap/organizations`, {
      cache: 'no-store',
    });

    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      if (orgsData.success && orgsData.data) {
        for (const org of orgsData.data) {
          sitemap += `  <url>
    <loc>${baseUrl}/main/orgs/${org.id}</loc>
    <lastmod>${new Date(org.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      }
    }

    sitemap += `</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating organizations sitemap:', error);
    // Возвращаем пустой sitemap в случае ошибки
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}
