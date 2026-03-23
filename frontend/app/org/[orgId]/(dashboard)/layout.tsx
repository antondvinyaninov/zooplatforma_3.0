export default async function OrgIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Боковое меню — будет реализовано позже */}
      <aside style={{ width: 240, background: '#f5f5f5', padding: '16px' }}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><a href={`/org/${orgId}/dashboard`}>Главная</a></li>
            <li><a href={`/org/${orgId}/profile`}>Профиль</a></li>
            <li><a href={`/org/${orgId}/animals`}>Животные</a></li>
            <li><a href={`/org/${orgId}/team`}>Команда</a></li>
            <li><a href={`/org/${orgId}/settings`}>Настройки</a></li>
            <li style={{ marginTop: 16, borderTop: '1px solid #ddd', paddingTop: 16 }}>
              <a href="/org" style={{ color: '#888', fontSize: 14 }}>← Сменить организацию</a>
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
