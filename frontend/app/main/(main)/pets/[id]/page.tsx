import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { getApiUrl, getPetPhotoUrl } from '../../../../../lib/urls';
import PetPageClient from './PetPageClient';

type Props = {
  params: Promise<{ id: string }>;
};

async function getPet(id: string) {
  const base = getApiUrl();
  const apiUrl = base.endsWith('/api') ? base : `${base}/api`;
  
  try {
    const res = await fetch(`${apiUrl}/pets/${id}`, {
      next: { revalidate: 60 } // Кешируем на 60 секунд
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch pet on server:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPet(id);

  if (!pet) {
    return {
      title: 'Объявление не найдено | Зоо Платформа',
      description: 'К сожалению, запрашиваемый питомец не найден или объявление было удалено.'
    };
  }

  const petName = pet.name || 'Питомец';
  const speciesRaw = pet.species_name || pet.species || 'животное';
  const petSpecies = speciesRaw.toLowerCase();
  
  let statusText = '';
  if (pet.status === 'looking_for_home' || pet.catalog_status === 'looking_for_home') statusText = 'Ищет дом';
  if (pet.status === 'needs_help' || pet.catalog_status === 'needs_help') statusText = 'Сбор средств';
  if (pet.status === 'lost' || pet.catalog_status === 'lost') statusText = 'Потерян';
  if (pet.status === 'found' || pet.catalog_status === 'found') statusText = 'Найден';

  const titleStr = `${petName} (${petSpecies}) ${statusText ? `- ${statusText}` : ''} | Зоо Платформа`;
  
  let descriptionStr = pet.description 
    ? pet.description.substring(0, 155) + (pet.description.length > 155 ? '...' : '')
    : `Помогите питомцу по имени ${petName} (${petSpecies}). ${statusText}. Узнайте больше подробностей на Зоо Платформе.`;

  const imageUrl = getPetPhotoUrl(pet.photo_url || pet.photo);

  return {
    title: titleStr,
    description: descriptionStr,
    openGraph: {
      title: titleStr,
      description: descriptionStr,
      url: `/main/pets/${id}`,
      type: 'profile',
      images: imageUrl ? [imageUrl] : [],
      siteName: 'Зоо Платформа',
    },
    alternates: {
      canonical: `/main/pets/${id}`,
    }
  };
}

export default async function PetPage({ params }: Props) {
  const { id } = await params;
  
  const pet = await getPet(id);
  
  if (!pet) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Объявление не найдено</h2>
          <p className="text-gray-500 mb-6">Возможно, питомец уже обрел дом или ссылка устарела.</p>
          <Link href="/main/catalog" className="text-blue-500 hover:text-blue-600 font-medium">
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getPetPhotoUrl(pet.photo_url || pet.photo);

  const isLookingForHome = pet.status === 'looking_for_home' || pet.catalog_status === 'looking_for_home';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isLookingForHome ? 'Offer' : 'Thing',
    name: pet.name || 'Питомец',
    description: pet.description || `Питомец ${pet.name} на Зоо Платформе`,
    image: imageUrl || undefined,
    itemOffered: isLookingForHome ? {
      '@type': 'Product',
      name: `${pet.species} ${pet.name}`,
    } : undefined,
    availability: isLookingForHome ? 'https://schema.org/InStock' : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://zooplatforma.ru'}/main/pets/${id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PetPageClient initialPet={pet} initialPosts={[]} />
    </>
  );
}
