export default function AnimalsWidget() {
  const items = [
    { label: 'Ищут дом', count: 0, color: '#3b82f6' },
    { label: 'В передержке', count: 0, color: '#f59e0b' },
    { label: 'Пристроены', count: 0, color: '#10b981' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{item.count}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Данные будут доступны после добавления животных</span>
      </div>
    </div>
  );
}
