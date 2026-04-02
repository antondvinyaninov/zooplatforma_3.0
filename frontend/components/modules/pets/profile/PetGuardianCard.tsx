import React from 'react';

interface PetGuardianCardProps {
  pet: any;
  orgId: string;
}

export default function PetGuardianCard({ pet, orgId }: PetGuardianCardProps) {
  // Животное под опекой организации, если у него заполнен org_id, 
  // ЛИБО если мы находимся внутри кабинета конкретной организации (orgId - это число)
  const isOrgCabinet = orgId !== 'owner' && orgId !== 'pethelper' && orgId !== 'petid';
  const isOrgPet = !!pet.org_id || isOrgCabinet;

  if (isOrgPet) {
    return (
      <div className="w-full sm:max-w-[420px]">
        <div style={{ 
          display: 'flex', flexDirection: 'column', 
          background: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)', 
          borderRadius: 8, padding: 24, border: '1px solid #bfdbfe', 
          boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.1)',
          position: 'relative', overflow: 'hidden' 
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,234,254,1) 0%, rgba(239,246,255,0) 70%)', zIndex: 0 }}></div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, zIndex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {pet.org_logo ? (
                <img src={pet.org_logo} alt={pet.owner_name || pet.org_name} style={{ width: 56, height: 56, borderRadius: '14px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px -2px rgba(59, 130, 246, 0.4)' }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
              )}
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>{pet.owner_name || pet.org_name || 'Организация'}</h4>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  ID: {pet.org_id}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, zIndex: 1, position: 'relative', minHeight: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', fontSize: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>Официальный опекун</span>
            </div>

            {pet.org_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', fontSize: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.08-7.074-6.97l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </div>
                <a href={`tel:${pet.org_phone}`} style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='#2563eb'} onMouseLeave={e => e.currentTarget.style.color='#0f172a'}>{pet.org_phone}</a>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20, zIndex: 1, position: 'relative' }}>
            <a href={`/orgs/${pet.org_id}`} target="_blank" rel="noopener noreferrer" 
               style={{ 
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                 width: '100%', padding: '10px 16px', 
                 background: 'white', border: '1px solid #bfdbfe', color: '#2563eb', 
                 borderRadius: 10, fontSize: 14, textDecoration: 'none', 
                 boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight: 600, transition: 'all 0.2s' 
               }} 
               onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.borderColor='#93c5fd'; }} 
               onMouseLeave={e => { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor='#bfdbfe'; }}
            >
              Открыть профиль организации
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Частное лицо (владелец или куратор)
  
  // Определяем точную роль для отображения
  let displayRole = 'Владелец питомца';
  if (pet.relationship === 'curator') displayRole = 'Официальный куратор';
  else if (pet.relationship === 'guardian') displayRole = 'Опекун';
  else if (orgId === 'pethelper') displayRole = 'Официальный куратор'; // fallback для волонтеров

  return (
    <div className="w-full sm:max-w-[420px]">
      <div style={{ 
        display: 'flex', flexDirection: 'column', 
        background: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)', 
        borderRadius: 8, padding: 24, border: '1px solid #bfdbfe', 
        boxShadow: '0 4px 12px -4px rgba(59, 130, 246, 0.1)',
        position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(219,234,254,1) 0%, rgba(239,246,255,0) 70%)', zIndex: 0 }}></div>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, zIndex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {pet.owner_avatar ? (
              <img src={pet.owner_avatar} alt={pet.owner_name} style={{ width: 56, height: 56, borderRadius: '14px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg, #3b82f6, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px -2px rgba(59, 130, 246, 0.4)' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            <div>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>{pet.owner_name || 'Пользователь'}</h4>
              <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                ID: {pet.user_id || '—'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, zIndex: 1, position: 'relative', minHeight: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', fontSize: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span style={{ fontWeight: 500, color: '#0f172a' }}>{displayRole}</span>
          </div>

          {pet.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', fontSize: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.08-7.074-6.97l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <span>{pet.phone}</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 20, zIndex: 1, position: 'relative' }}>
          <a href={`/main/${pet.user_id}`} target="_blank" rel="noopener noreferrer" 
             style={{ 
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
               width: '100%', padding: '10px 16px', 
               background: 'white', border: '1px solid #bfdbfe', color: '#2563eb', 
               borderRadius: 10, fontSize: 14, textDecoration: 'none', 
               boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight: 600, transition: 'all 0.2s' 
             }} 
          >
            Открыть профиль пользователя
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
