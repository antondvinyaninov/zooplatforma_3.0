'use client';

import { useState, useEffect } from 'react';

interface ErrorLog {
  id: number;
  service: string;
  endpoint: string;
  method: string;
  error_message: string;
  user_id?: number;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SystemMetrics {
  total_requests: number;
  total_errors: number;
  error_rate: number;
  avg_response_time_ms: number;
  active_users: number;
  database_size_mb: number;
  last_hour_errors: number;
  last_24hour_errors: number;
}

interface ServiceStatus {
  name: string;
  url: string;
  status: string;
  latency: number;
  checked_at: string;
}

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [errorStats, setErrorStats] = useState<Record<string, number>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchAllData();

    // Auto-refresh каждые 60 секунд
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchAllData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchAllData = async () => {
    try {
      // Параллельная загрузка всех данных через API routes
      const [errorsRes, metricsRes, statsRes] = await Promise.all([
        fetch('/api/admin/monitoring/errors', {
          credentials: 'include',
        }),
        fetch('/api/admin/monitoring/metrics', {
          credentials: 'include',
        }),
        fetch('/api/admin/monitoring/error-stats', {
          credentials: 'include',
        }),
      ]);

      // Обрабатываем результаты
      if (errorsRes.ok) {
        const errorsData = await errorsRes.json();
        setErrors(errorsData.data || errorsData || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data || metricsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setErrorStats(statsData.data || statsData || {});
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50';
      case 'slow':
        return 'text-yellow-600 bg-yellow-50';
      case 'offline':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'slow':
        return '⚠️';
      case 'offline':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка мониторинга...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мониторинг системы</h1>
          <p className="text-gray-600 mt-1">Отслеживание ошибок и производительности</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Авто-обновление (60с)
          </label>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активные пользователи</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.active_users}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ошибок за час</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{metrics.last_hour_errors}</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ошибок за 24ч</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {metrics.last_24hour_errors}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Размер БД</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics.database_size_mb >= 1024
                    ? `${(metrics.database_size_mb / 1024).toFixed(1)} GB`
                    : `${Math.round(metrics.database_size_mb)} MB`}
                </p>
              </div>
              <div className="text-4xl">💾</div>
            </div>
          </div>
        </div>
      )}

      {/* Services Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Статус сервисов</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Критические сервисы */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Критические сервисы
            </h3>

            {/* Auth Service */}
            {(() => {
              const authService = services.find((s) => s.name === 'Auth Service');
              return authService ? (
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">🔐 Auth Service (SSO)</h3>
                      <p className="text-xs text-gray-600">Единая авторизация для всех сервисов</p>
                    </div>
                    <span className="text-2xl">{getStatusIcon(authService.status)}</span>
                  </div>
                  <div
                    className={`p-3 rounded-lg border-2 ${
                      authService.status === 'online'
                        ? 'border-green-200 bg-green-50'
                        : authService.status === 'slow'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">Backend</span>
                        <span className="ml-2 text-xs text-gray-500">:7100</span>
                      </div>
                      <div className="text-sm text-gray-600">Задержка: {authService.latency}ms</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(authService.checked_at)}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* PetBase - критический сервис */}
            {(() => {
              const petbaseBackend = services.find((s) => s.name === 'PetBase Backend');
              const petbaseFrontend = services.find((s) => s.name === 'PetBase Frontend');
              return (
                <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">🐾 PetBase (ЗооБаза)</h3>
                      <p className="text-xs text-gray-600">
                        Единый источник данных о животных для всех сервисов
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Backend */}
                    {petbaseBackend && (
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          petbaseBackend.status === 'online'
                            ? 'border-green-200 bg-green-50'
                            : petbaseBackend.status === 'slow'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">Backend</span>
                            <span className="ml-2 text-xs text-gray-500">:8100</span>
                          </div>
                          <span className="text-xl">{getStatusIcon(petbaseBackend.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Задержка: {petbaseBackend.latency}ms</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(petbaseBackend.checked_at)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Frontend */}
                    {petbaseFrontend && (
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          petbaseFrontend.status === 'online'
                            ? 'border-green-200 bg-green-50'
                            : petbaseFrontend.status === 'slow'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">Frontend</span>
                            <span className="ml-2 text-xs text-gray-500">:4100</span>
                          </div>
                          <span className="text-xl">{getStatusIcon(petbaseFrontend.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Задержка: {petbaseFrontend.latency}ms</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(petbaseFrontend.checked_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Остальные сервисы */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Остальные сервисы
            </h3>

            {/* Группируем сервисы по типу */}
            {[
              {
                name: 'Main',
                backend: 'Main Backend',
                frontend: 'Main Frontend',
                backendPort: '8000',
                frontendPort: '3000',
              },
              {
                name: 'Admin',
                backend: 'Admin Backend',
                frontend: 'Admin Frontend',
                backendPort: '9000',
                frontendPort: '4000',
              },
              {
                name: 'Shelter',
                backend: 'Shelter Backend',
                frontend: 'Shelter Frontend',
                backendPort: '8200',
                frontendPort: '5100',
              },
              {
                name: 'Owner',
                backend: 'Owner Backend',
                frontend: 'Owner Frontend',
                backendPort: '8400',
                frontendPort: '6100',
              },
              {
                name: 'Volunteer',
                backend: 'Volunteer Backend',
                frontend: 'Volunteer Frontend',
                backendPort: '8500',
                frontendPort: '6200',
              },
              {
                name: 'Clinic',
                backend: 'Clinic Backend',
                frontend: 'Clinic Frontend',
                backendPort: '8600',
                frontendPort: '6300',
              },
            ].map((group) => {
              const backendService = services.find((s) => s.name === group.backend);
              const frontendService = services.find((s) => s.name === group.frontend);

              // Для Admin Backend показываем что он работает (раз мы на его странице)
              const isAdminBackend = group.name === 'Admin';

              return (
                <div key={group.name} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{group.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Backend */}
                    {isAdminBackend ? (
                      // Admin Backend всегда показываем как online (раз страница работает)
                      <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">Backend</span>
                            <span className="ml-2 text-xs text-gray-500">:{group.backendPort}</span>
                          </div>
                          <span className="text-xl">✅</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Задержка: -</div>
                          <div className="text-xs text-gray-500 mt-1">(текущий сервис)</div>
                        </div>
                      </div>
                    ) : backendService ? (
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          backendService.status === 'online'
                            ? 'border-green-200 bg-green-50'
                            : backendService.status === 'slow'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">Backend</span>
                            <span className="ml-2 text-xs text-gray-500">:{group.backendPort}</span>
                          </div>
                          <span className="text-xl">{getStatusIcon(backendService.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Задержка: {backendService.latency}ms</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(backendService.checked_at)}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Frontend */}
                    {frontendService && (
                      <div
                        className={`p-3 rounded-lg border-2 ${
                          frontendService.status === 'online'
                            ? 'border-green-200 bg-green-50'
                            : frontendService.status === 'slow'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-gray-900">Frontend</span>
                            <span className="ml-2 text-xs text-gray-500">
                              :{group.frontendPort}
                            </span>
                          </div>
                          <span className="text-xl">{getStatusIcon(frontendService.status)}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Задержка: {frontendService.latency}ms</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTime(frontendService.checked_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Stats by Service */}
      {Object.keys(errorStats).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Ошибки по сервисам (24ч)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(errorStats)
                .sort(([, a], [, b]) => b - a)
                .map(([service, count]) => (
                  <div
                    key={service}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{service}</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {count} ошибок
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Errors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Последние ошибки</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Сервис
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Метод
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ошибка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {errors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    🎉 Нет ошибок! Система работает отлично.
                  </td>
                </tr>
              ) : (
                errors.map((error) => (
                  <tr key={error.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatTime(error.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{error.service}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{error.endpoint}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          error.method === 'GET'
                            ? 'bg-green-100 text-green-700'
                            : error.method === 'POST'
                              ? 'bg-blue-100 text-blue-700'
                              : error.method === 'PUT'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {error.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">{error.error_message}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{error.user_id || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {error.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
