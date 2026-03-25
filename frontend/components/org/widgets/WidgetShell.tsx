'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface WidgetShellProps {
  title: string;
  icon: string;
  onRemove?: () => void;
  editMode?: boolean;
  children: ReactNode;
}

export default function WidgetShell({ title, icon, onRemove, editMode, children }: WidgetShellProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: editMode ? '0 0 0 2px #3b82f6' : '0 1px 8px rgba(0,0,0,0.08)',
        cursor: editMode ? 'grab' : 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', flex: 1 }}>{title}</span>
        {editMode && onRemove && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            style={{
              background: '#fee2e2',
              border: 'none',
              borderRadius: 6,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#dc2626',
            }}
          >
            <XMarkIcon style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* Контент */}
      <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
