'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { WIDGET_DEFINITIONS, WidgetDef } from './widgetDefs';

interface WidgetCatalogProps {
  activeWidgetIds: string[];
  onAdd: (widget: WidgetDef) => void;
  onClose: () => void;
}

export default function WidgetCatalog({ activeWidgetIds, onAdd, onClose }: WidgetCatalogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 0,
          width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Каталог виджетов</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Выберите виджеты для вашего дашборда</p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
          >
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Список виджетов */}
        <div style={{ overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {WIDGET_DEFINITIONS.map((widget) => {
            const isActive = activeWidgetIds.includes(widget.id);
            return (
              <div
                key={widget.id}
                style={{
                  border: `2px solid ${isActive ? '#d1fae5' : '#e5e7eb'}`,
                  borderRadius: 12,
                  padding: 16,
                  background: isActive ? '#f0fdf4' : '#fff',
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => { if (!isActive) onAdd(widget); }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = '#16a34a'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb'; }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{widget.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>{widget.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{widget.description}</div>
                {isActive && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>✓ Добавлен</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
