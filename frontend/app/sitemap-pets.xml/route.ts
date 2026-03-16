import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://zooplatforma.ru';
  const apiUrl = process.env.ADMIN_API_URL || 'http://localhost:8000';

  try {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Получаем список питомцев
    const petsResponse = await fetch(`${apiUrl}/api/sitemap/pets`, {
      cache: 'no-store',
    });

    if (petsResponse.ok) {
      const petsData = await petsResponse.json();
      if (petsData.success && petsData.data) {
        for (const pet of petsData.data) {
          sitemap += `  <url>
    <loc>${baseUrl}/main/pets/${pet.id}</loc>
    <lastmod>${new Date(pet.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
    console.error('Error generating pets sitemap:', error);
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
