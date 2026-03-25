import React from 'react';

export type Tab =
  | 'timeline'
  | 'general'
  | 'identification'
  | 'health'
  | 'gallery'
  | 'fundraising';

export const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'timeline',       icon: '📅', label: 'Хронология' },
  { id: 'general',        icon: '📋', label: 'Общая информация' },
  { id: 'identification', icon: '🏷️', label: 'Идентификация' },
  { id: 'health',         icon: '🏥', label: 'Здоровье' },
  { id: 'gallery',        icon: '📸', label: 'Галерея' },
];

interface PetNavMenuProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  showFundraising?: boolean;
}

export default function PetNavMenu({ activeTab, onChange, showFundraising }: PetNavMenuProps) {
  const tabs = [...TABS];
  if (showFundraising) {
    tabs.push({ id: 'fundraising', icon: '💰', label: 'Сбор средств' });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', background: activeTab === tab.id ? '#f0f9ff' : 'transparent',
            border: 'none', borderBottom: i < tabs.length - 1 ? '1px solid #f3f4f6' : 'none',
            cursor: 'pointer', textAlign: 'left',
            borderLeft: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
          }}
        >
          <span style={{ fontSize: 16 }}>{tab.icon}</span>
          <span style={{
            fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#1d4ed8' : '#374151',
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
