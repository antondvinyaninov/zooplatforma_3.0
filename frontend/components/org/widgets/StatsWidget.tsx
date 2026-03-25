export default function StatsWidget() {
  const stats = [
    { label: 'Просмотры профиля', value: '—', sub: 'за 30 дней' },
    { label: 'Обращений', value: '—', sub: 'за 30 дней' },
    { label: 'Подписчиков', value: '—', sub: 'всего' },
    { label: 'Рейтинг', value: '—', sub: 'средний балл' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, height: '100%', alignItems: 'center' }}>
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{s.value}</div>
          <div style={{ fontSize: 12, color: '#111827', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
