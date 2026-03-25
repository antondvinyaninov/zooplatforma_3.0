'use client';

import { useRouter } from 'next/navigation';

export interface Pet {
  id: number;
  org_pet_number?: number;
  name: string;
  species_name: string;
  breed_name: string;
  gender: string;
  photo_url: string;
  color: string;
  size: string;
}

type PetsTableVariant = 'shelter' | 'owner' | 'pethelper' | 'petid';

interface PetsTableProps {
  pets: Pet[];
  variant?: PetsTableVariant;
  onRowClick: (pet: Pet) => void;
}

const sizeLabel = (size: string) => {
  if (size === 'small') return 'Маленький';
  if (size === 'medium') return 'Средний';
  if (size === 'large') return 'Крупный';
  return <span style={{ color: '#d1d5db' }}>—</span>;
};

const placeholder = <span style={{ color: '#d1d5db' }}>—</span>;

export default function PetsTable({ pets, variant = 'shelter', onRowClick }: PetsTableProps) {
  const showOrgNumber = variant === 'shelter';

  const columns = [
    ...(showOrgNumber ? [['№', 48]] : []),
    ['Фото', 52],
    ['Кличка', null],
    ['Вид', null],
    ['Порода', null],
    ['Пол', null],
    ['Окрас', null],
    ['Размер', null],
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            {columns.map(([label, w]) => (
              <th
                key={label as string}
                style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: 11,
                  fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5,
                  ...(w ? { width: w as number } : {}),
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pets.map((pet, i) => (
            <tr
              key={pet.id}
              style={{ borderBottom: i < pets.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onRowClick(pet)}
            >
              {/* Внутренний № (только для приютов) */}
              {showOrgNumber && (
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', borderRadius: 4, padding: '2px 6px' }}>
                    {pet.org_pet_number ?? '—'}
                  </span>
                </td>
              )}

              {/* Фото */}
              <td style={{ padding: '8px 16px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, overflow: 'hidden',
                }}>
                  {pet.photo_url
                    ? <img src={pet.photo_url} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (pet.species_name === 'Собака' ? '🐕' : '🐈')}
                </div>
              </td>

              {/* Кличка */}
              <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: '#111827' }}>
                {pet.name || placeholder}
              </td>

              {/* Вид */}
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                {pet.species_name || placeholder}
              </td>

              {/* Порода */}
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                {pet.breed_name || placeholder}
              </td>

              {/* Пол */}
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                {pet.gender === 'male' ? '♂ Самец' : '♀ Самка'}
              </td>

              {/* Окрас */}
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                {pet.color || placeholder}
              </td>

              {/* Размер */}
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
                {sizeLabel(pet.size)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
