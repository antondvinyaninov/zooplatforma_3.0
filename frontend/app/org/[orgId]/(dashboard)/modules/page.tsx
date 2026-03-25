'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { getOrgModulesKey, getActiveModules } from '../layout';

interface ModuleDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  tag: string;
}

const AVAILABLE_MODULES: ModuleDef[] = [
  {
    id: 'pets',
    name: 'Питомцы',
    description: 'Справочник питомцев организации. Добавляйте животных, управляйте статусами, отслеживайте историю.',
    icon: '🐾',
    tag: 'Животные',
  },
];

export default function ModulesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  useEffect(() => {
    setActiveModules(getActiveModules(orgId));
  }, [orgId]);

  const toggleModule = (moduleId: string) => {
    const current = getActiveModules(orgId);
    const updated = current.includes(moduleId)
      ? current.filter((m) => m !== moduleId)
      : [...current, moduleId];
    localStorage.setItem(getOrgModulesKey(orgId), JSON.stringify(updated));
    setActiveModules(updated);
    window.dispatchEvent(new Event('org-modules-changed'));
  };

  return (
    <div style={{ paddingLeft: 16, paddingRight: 16 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Модули</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          Подключайте дополнительные инструменты для работы организации
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {AVAILABLE_MODULES.map((mod) => {
          const isActive = activeModules.includes(mod.id);
          return (
            <div
              key={mod.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                border: isActive ? '2px solid #16a34a' : '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#f0fdf4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>
                  {mod.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{mod.name}</span>
                    {isActive && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: '#16a34a',
                        background: '#dcfce7', borderRadius: 4, padding: '2px 6px',
                      }}>АКТИВЕН</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, color: '#9ca3af', fontWeight: 500,
                    background: '#f3f4f6', borderRadius: 4, padding: '1px 6px',
                    display: 'inline-block', marginTop: 2,
                  }}>{mod.tag}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                {mod.description}
              </p>

              <button
                onClick={() => toggleModule(mod.id)}
                style={{
                  padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, marginTop: 'auto',
                  background: isActive ? '#fee2e2' : '#16a34a',
                  color: isActive ? '#dc2626' : '#fff',
                  transition: 'background 0.2s',
                }}
              >
                {isActive ? '✕ Отключить' : '+ Подключить'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center' }}>
          Больше модулей появятся в ближайшее время
        </p>
      </div>
    </div>
  );
}
