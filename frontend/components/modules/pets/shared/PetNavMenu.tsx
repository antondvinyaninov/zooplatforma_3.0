import React from 'react';

export type Tab =
  | 'info'
  | 'timeline'
  | 'general'
  | 'identification'
  | 'health'
  | 'gallery'
  | 'fundraising';

export const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'timeline',       icon: '📅', label: 'Хронология' },
  { id: 'general',        icon: '📋', label: 'Общая информация' },
  { id: 'identification', icon: '🏷️', label: 'Регистрация' },
  { id: 'health',         icon: '🏥', label: 'Здоровье' },
  { id: 'gallery',        icon: '📸', label: 'Галерея' },
];

interface PetNavMenuProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  showFundraising?: boolean;
  mobileView?: boolean;
}

export default function PetNavMenu({ activeTab, onChange, showFundraising, mobileView }: PetNavMenuProps) {
  const tabs = mobileView ? [{ id: 'info' as Tab, icon: 'ℹ️', label: 'Инфо' }, ...TABS] : [...TABS];
  if (showFundraising) {
    tabs.push({ id: 'fundraising', icon: '💰', label: 'Сбор средств' });
  }

  if (mobileView) {
    return (
      <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: activeTab === tab.id ? '#2563eb' : '#fff',
              borderRadius: 100, border: '1px solid', borderColor: activeTab === tab.id ? '#2563eb' : '#e5e7eb',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab.id ? '#fff' : '#4b5563',
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', overflow: 'hidden' }}>
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
