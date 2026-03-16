import { QueryClient } from '@tanstack/react-query';

// Глобальная настройка клиента React Query
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Время, в течение которого данные считаются "свежими" и не требуют фонового обновления
      staleTime: 1000 * 60 * 5, // 5 минут

      // Отключаем автоматический перезапрос при возвращении фокуса на вкладку браузера
      // (чтобы не было лишних запросов, когда юзер просто переключается между окнами)
      refetchOnWindowFocus: false,

      // Количество попыток повторного запроса при ошибке
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
};

// Функция для создания клиента (используется в провайдере)
export function makeQueryClient() {
  return new QueryClient(queryClientConfig);
}

// Переменная для хранения клиента на стороне браузера
let browserQueryClient: QueryClient | undefined = undefined;

// Функция для получения клиента
// На сервере всегда создаем новый, на клиенте - переиспользуем синглтон
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Сервер: всегда новый клиент
    return makeQueryClient();
  } else {
    // Браузер: создаем клиента один раз
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
