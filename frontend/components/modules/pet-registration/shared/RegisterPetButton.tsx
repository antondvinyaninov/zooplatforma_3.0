'use client';

import { useState } from 'react';
import RegistrationWizard from '../list/RegistrationWizard';

interface RegisterPetButtonProps {
  petId: number;
  orgId: string;
  isRegistered?: boolean;
}

export default function RegisterPetButton({ petId, orgId, isRegistered }: RegisterPetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {isRegistered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            title="Питомец официально зарегистрирован"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 10, background: '#f0fdf4', color: '#16a34a',
              fontWeight: 600, fontSize: 13, border: '1px solid #bbf7d0',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Зарегистрирован
          </div>

          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              borderRadius: 10, background: '#fff', color: '#4f46e5',
              fontWeight: 600, fontSize: 13, border: '1px solid #c7d2fe',
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="M12 5v14m-7-7h14" />
            </svg>
            Дополнить
          </button>
        </div>
      ) : (
        <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 16px',
          borderRadius: 10,
          border: '1px solid #2563eb',
          background: '#eff6ff',
          color: '#1d4ed8',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#dbeafe';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#eff6ff';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        Зарегистрировать
        </button>
      )}

      {open && (
        <RegistrationWizard
          petId={petId}
          orgId={orgId}
          onClose={() => setOpen(false)}
          onBack={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      )}
    </>
  );
}
