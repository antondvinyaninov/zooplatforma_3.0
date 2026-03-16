# Zooplatforma Backend

Backend на Go 1.26.1 с использованием Gin и PostgreSQL.

## Структура проекта

```
backend/
├── cmd/api/main.go          # Точка входа
├── internal/
│   ├── config/config.go     # Конфигурация
│   ├── database/database.go # Подключение к БД
│   └── router/router.go     # Маршруты
├── .env                     # Переменные окружения
└── go.mod                   # Зависимости
```

## Запуск

```bash
cd backend
go mod tidy
go run cmd/api/main.go
```

Сервер запустится на порту 8080.

## Эндпоинты

- `GET /health` - проверка здоровья сервера
- `POST /api/v1/auth/register` - регистрация
- `POST /api/v1/auth/login` - вход

## База данных

PostgreSQL:
- Host: 88.218.121.213
- Port: 5967
- Database: zp-db
- User: zp
