import React from 'react';
import s from '../shared/pet-card.module.css';

interface PetSystemProps {
  pet: { id: number; org_pet_number: number; created_at: string };
}

export default function PetSystem({ pet }: PetSystemProps) {
  const createdFormatted = new Date(pet.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className={s.headerCard}>
        <div className={s.sectionTitle}>Система</div>
        <div className={s.sectionDesc}>Техническая информация о записи питомца в базе данных.</div>
      </div>
      <div className={s.card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className={s.fieldLabel}>ID питомца</div>
            <div className={s.monoValue}>#{pet.id}</div>
          </div>
          <div>
            <div className={s.fieldLabel}>№ в организации</div>
            <div className={s.monoValue}>№{pet.org_pet_number}</div>
          </div>
          <div>
            <div className={s.fieldLabel}>Дата регистрации</div>
            <div className={s.blockValue}>{createdFormatted}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
