'use client';

import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import GridLayoutLib, { Layout, LayoutItem } from 'react-grid-layout';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GridLayout = GridLayoutLib as any;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetShell from '../../../../../components/org/widgets/WidgetShell';
import WidgetCatalog from '../../../../../components/org/widgets/WidgetCatalog';
import { WIDGET_DEFINITIONS, WidgetDef } from '../../../../../components/org/widgets/widgetDefs';

interface ActiveWidget {
  defId: string;
  layout: LayoutItem;
}

const COL_COUNT = 12;

function getStorageKey(orgId: string) {
  return `org-dashboard-${orgId}`;
}

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(900);
  const [editMode, setEditMode] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<ActiveWidget[]>([]);

  // Загружаем сохранённый layout из localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(getStorageKey(orgId));
    if (saved) {
      try {
        setActiveWidgets(JSON.parse(saved));
      } catch {
        setActiveWidgets([]);
      }
    }
  }, [orgId]);

  // Следим за шириной контейнера
  useEffect(() => {
    const update = () => {
      const el = document.getElementById('dashboard-grid-container');
      if (el) setContainerWidth(el.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [mounted]);

  const save = useCallback((widgets: ActiveWidget[]) => {
    localStorage.setItem(getStorageKey(orgId), JSON.stringify(widgets));
  }, [orgId]);

  const handleAddWidget = (def: WidgetDef) => {
    const newWidget: ActiveWidget = {
      defId: def.id,
      layout: {
        i: def.id,
        x: 0,
        y: Infinity,
        w: def.defaultW,
        h: def.defaultH,
        minW: 2,
        minH: 2,
      } as LayoutItem,
    };
    const updated = [...activeWidgets, newWidget];
    setActiveWidgets(updated);
    save(updated);
    setShowCatalog(false);
  };

  const handleRemove = (defId: string) => {
    const updated = activeWidgets.filter((w) => w.defId !== defId);
    setActiveWidgets(updated);
    save(updated);
  };

  const handleLayoutChange = (newLayout: Layout) => {
    const updated = activeWidgets.map((w) => {
      const l = (newLayout as LayoutItem[]).find((nl) => nl.i === w.defId);
      return l ? { ...w, layout: l } : w;
    });
    setActiveWidgets(updated);
    save(updated);
  };

  const layout: LayoutItem[] = activeWidgets.map((w) => w.layout);
  const activeIds = activeWidgets.map((w) => w.defId);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9ca3af' }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div>
      {/* Шапка дашборда */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Главная</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>
            Ваш персональный дашборд
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditMode((v) => !v)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: editMode ? '#eff6ff' : '#fff',
              color: editMode ? '#3b82f6' : '#374151',
              fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}
          >
            {editMode ? '✓ Готово' : '✎ Редактировать'}
          </button>
          <button
            onClick={() => setShowCatalog(true)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#16a34a', color: '#fff',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            + Добавить виджет
          </button>
        </div>
      </div>

      {/* Сетка */}
      <div id="dashboard-grid-container">
        {activeWidgets.length === 0 ? (
          <div
            style={{
              border: '2px dashed #d1d5db', borderRadius: 16,
              padding: '64px 32px', textAlign: 'center', color: '#9ca3af',
              marginLeft: 16, marginRight: 16,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Дашборд пуст
            </div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>
              Добавьте виджеты, чтобы видеть важную информацию здесь
            </div>
            <button
              onClick={() => setShowCatalog(true)}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: '#16a34a', color: '#fff',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              + Добавить виджет
            </button>
          </div>
        ) : (
          <GridLayout
            layout={layout}
            cols={COL_COUNT}
            rowHeight={60}
            width={containerWidth}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={handleLayoutChange}
            margin={[12, 12]}
            containerPadding={[16, 0]}
          >
            {activeWidgets.map((w) => {
              const def = WIDGET_DEFINITIONS.find((d) => d.id === w.defId);
              if (!def) return null;
              return (
                <div key={w.defId}>
                  <WidgetShell
                    title={def.title}
                    icon={def.icon}
                    editMode={editMode}
                    onRemove={() => handleRemove(w.defId)}
                  >
                    {def.component}
                  </WidgetShell>
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>

      {/* Каталог виджетов */}
      {showCatalog && (
        <WidgetCatalog
          activeWidgetIds={activeIds}
          onAdd={handleAddWidget}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
