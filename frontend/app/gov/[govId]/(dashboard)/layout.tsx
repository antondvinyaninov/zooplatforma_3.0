export default async function GovIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ govId: string }>;
}) {
  const { govId } = await params;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 240, background: '#f0f4ff', padding: '16px', borderRight: '1px solid #e2e8f0' }}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><a href={`/gov/${govId}/dashboard`}>Главная</a></li>
            <li><a href={`/gov/${govId}/profile`}>Профиль</a></li>
            <li><a href={`/gov/${govId}/registry`}>Реестр организаций</a></li>
            <li><a href={`/gov/${govId}/reports`}>Отчёты</a></li>
            <li><a href={`/gov/${govId}/settings`}>Настройки</a></li>
            <li style={{ marginTop: 16, borderTop: '1px solid #c7d2fe', paddingTop: 16 }}>
              <a href="/gov" style={{ color: '#6b7280', fontSize: 14 }}>← Сменить ведомство</a>
            </li>
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}
