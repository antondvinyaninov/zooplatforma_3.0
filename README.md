# ZooPlatforma 3.0

Платформа для владельцев домашних животных с социальными функциями.

## Структура проекта

### Frontend (Next.js)
- **frontend** (порт 3000) - Единое Next.js приложение со всеми модулями:
  - `/main` - Основная социальная сеть
  - `/owner` - Кабинет владельца питомцев
  - `/admin` - Административная панель
  - `/pethelper` - Приложение для помощников
  - `/petid` - Идентификация питомцев

### Backend
- **backend** (порт 8000) - Единый Go backend API

## Локальная разработка

### Быстрый старт (рекомендуется)
Запустить все сервисы одной командой:
```bash
./run
```

Скрипт автоматически запустит:
- 🔴 `[BACKEND:8000]` - Go API сервер с hot reload (air)
- 🔵 `[FRONTEND:3000]` - Next.js приложение

### Запуск отдельных сервисов

#### Backend
```bash
cd backend
# С hot reload (рекомендуется):
air

# Или без hot reload:
go run cmd/api/main.go
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Доступ к приложениям
- Frontend: http://localhost:3000
  - Main: http://localhost:3000/main
  - Owner: http://localhost:3000/owner
  - Admin: http://localhost:3000/admin
  - PetHelper: http://localhost:3000/pethelper
  - PetID: http://localhost:3000/petid
- Backend API: http://localhost:8000

## Продакшен деплой

### Структура URL
При деплое используется следующая структура:

- `zooplatforma.ru` → frontend (все модули)
  - `zooplatforma.ru/main` → социальная сеть
  - `zooplatforma.ru/owner` → кабинет владельца
  - `zooplatforma.ru/admin` → админ панель
  - `zooplatforma.ru/pethelper` → для помощников
  - `zooplatforma.ru/petid` → идентификация
- `api.zooplatforma.ru` → backend (API)

### Настройка
Для продакшена потребуется:
1. Настроить DNS записи для api поддомена
2. Настроить reverse proxy (Nginx/Caddy) для маршрутизации
3. Обновить CORS настройки в backend для продакшен домена
4. Обновить переменные окружения (.env.local) в frontend
5. Собрать и задеплоить Next.js приложение

## Технологии

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Go 1.26.1, Gin framework
- **База данных**: PostgreSQL
- **Хранилище**: S3-совместимое (Yandex Object Storage)
- **Hot Reload**: Air (backend), Next.js Fast Refresh (frontend)
