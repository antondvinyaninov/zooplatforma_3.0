# Новые API Endpoints

Документация по всем критичным endpoints, реализованным из старого gateway.

## 🗳️ Polls (Опросы)

### GET /api/polls/post/:post_id
Получить опрос для поста

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "post_id": 123,
    "question": "Какой ваш любимый питомец?",
    "options": [
      {
        "id": 1,
        "option_text": "Собака",
        "votes_count": 10,
        "percentage": 50.0
      }
    ],
    "multiple_choice": false,
    "allow_vote_changes": true,
    "is_anonymous": false,
    "total_voters": 20,
    "user_voted": true,
    "user_votes": [1],
    "is_expired": false,
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### POST /api/polls/:id/vote
Проголосовать в опросе

**Request:**
```json
{
  "option_ids": [1, 2]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* обновленный опрос */ }
}
```

### DELETE /api/polls/:id/vote
Удалить свой голос

**Response:**
```json
{
  "success": true,
  "message": "Vote deleted"
}
```

---

## 👥 Friends (Друзья)

### GET /api/friends
Получить список друзей

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Иван",
      "last_name": "Петров",
      "avatar": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/friends/requests
Получить входящие запросы в друзья

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Мария",
      "last_name": "Иванова",
      "avatar": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/friends/request
Отправить запрос в друзья

**Request:**
```json
{
  "friend_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend request sent"
}
```

### POST /api/friends/accept
Принять запрос в друзья

**Request:**
```json
{
  "friend_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

### POST /api/friends/reject
Отклонить запрос в друзья

**Request:**
```json
{
  "friend_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

### DELETE /api/friends/remove
Удалить из друзей

**Request:**
```json
{
  "friend_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Friend removed"
}
```

---

## 🔔 Notifications (Уведомления)

### GET /api/notifications
Получить список уведомлений

**Query params:**
- `limit` (optional) - количество уведомлений (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "like",
      "title": "Новый лайк",
      "message": "Иван Петров лайкнул ваш пост",
      "link": "/posts/123",
      "is_read": false,
      "created_at": "2024-01-01T00:00:00Z",
      "sender": {
        "id": 2,
        "name": "Иван",
        "last_name": "Петров",
        "avatar": "https://..."
      }
    }
  ]
}
```

### GET /api/notifications/unread
Получить количество непрочитанных уведомлений

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### PUT /api/notifications/:id/read
Отметить уведомление как прочитанное

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### POST /api/notifications/mark-all-read
Отметить все уведомления как прочитанные

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 📢 Announcements (Объявления)

### GET /api/announcements
Получить список объявлений

**Query params:**
- `limit` (optional) - количество объявлений (default: 20)
- `offset` (optional) - смещение (default: 0)
- `category` (optional) - категория объявления

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Продам щенка",
      "description": "Милый щенок ищет дом",
      "category": "pets",
      "price": 5000,
      "location": "Москва",
      "contact_phone": "+7 999 123-45-67",
      "contact_email": "user@example.com",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "name": "Иван",
        "last_name": "Петров",
        "avatar": "https://..."
      }
    }
  ]
}
```

### GET /api/announcements/:id
Получить объявление по ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Продам щенка",
    "description": "Милый щенок ищет дом",
    "category": "pets",
    "price": 5000,
    "location": "Москва",
    "contact_phone": "+7 999 123-45-67",
    "contact_email": "user@example.com",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": 1,
      "name": "Иван",
      "last_name": "Петров",
      "avatar": "https://..."
    }
  }
}
```

---

## 🚨 Reports (Жалобы)

### POST /api/reports
Создать жалобу

**Request:**
```json
{
  "entity_type": "post",
  "entity_id": 123,
  "reason": "spam",
  "details": "Это спам"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "id": 1
  }
}
```

**Entity types:**
- `post` - жалоба на пост
- `comment` - жалоба на комментарий
- `user` - жалоба на пользователя

**Reasons:**
- `spam` - спам
- `inappropriate` - неприемлемый контент
- `harassment` - домогательство
- `fake` - фейк
- `other` - другое

---

## 📊 Статус реализации

### ✅ Полностью реализовано

**Main Frontend:**
- [x] **Polls (опросы)** - GET /api/polls/post/:post_id, POST /api/polls/:id/vote, DELETE /api/polls/:id/vote
- [x] **Friends (друзья)** - GET /api/friends, GET /api/friends/requests, POST /api/friends/request, POST /api/friends/accept, POST /api/friends/reject, DELETE /api/friends/remove
- [x] **Notifications (уведомления)** - GET /api/notifications, GET /api/notifications/unread, PUT /api/notifications/:id/read, POST /api/notifications/mark-all-read
- [x] **Announcements (объявления)** - GET /api/announcements, GET /api/announcements/:id, POST /api/announcements, PUT /api/announcements/:id, DELETE /api/announcements/:id
- [x] **Reports (жалобы)** - POST /api/reports

**Admin:**
- [x] **Moderation (модерация)** - GET /api/admin/moderation/reports, PUT /api/admin/moderation/reports/:id, GET /api/admin/moderation/stats
- [x] **Monitoring (мониторинг)** - GET /api/admin/monitoring/errors, GET /api/admin/monitoring/metrics, GET /api/admin/monitoring/error-stats
- [x] **Activity Stats** - GET /api/admin/activity/stats
- [x] **User Activity Logs** - GET /api/admin/user-activity, GET /api/admin/user-activity/stats, GET /api/admin/user-activity/user/:id
- [x] **Admin Logs** - GET /api/admin/logs, GET /api/admin/logs/stats

### 📝 Примечания

1. Все endpoints требуют авторизации (кроме публичных GET запросов)
2. Используется middleware для получения `user_id` из контекста
3. Все handlers используют транзакции для атомарности операций
4. Структура ответов соответствует старому gateway для совместимости
5. Frontend API клиент обновлен со всеми новыми методами
6. Admin endpoints требуют роль admin/superadmin (через middleware)
7. Announcements поддерживают полный CRUD (Create, Read, Update, Delete)
8. User Activity Logs поддерживают фильтрацию по пользователю, типу действия и датам

---

## 🏗️ Архитектура

### Сервисы

Backend разделен на несколько сервисов:

1. **mainfrontend** (`/api/*`) - основной фронтенд
   - Posts, Comments, Likes
   - Friends, Notifications
   - Polls, Announcements, Reports
   - Media upload (S3)
   - Organizations, Chats, Messages

2. **admin** (`/api/admin/*`) - админка
   - Moderation (жалобы)
   - Monitoring (логи, метрики)
   - User management
   - Logs

3. **owner** (`/api/owner/*`) - для владельцев питомцев
   - Auth, Pets, Organizations
   - Health records

4. **pethelper** (`/api/pethelper/*`) - для помощников
   - Auth, Pets, Organizations

5. **petid** (`/api/petid/*`) - PetID система
   - Auth, Pets, Breeds, Species
   - Vaccinations, Treatments, Medical records

### Старый Gateway vs Новый Backend

**Старый подход (gateway):**
- Gateway проксировал запросы на разные микросервисы
- Каждый сервис был отдельным приложением
- Gateway добавлял данные питомцев к постам

**Новый подход (монолит):**
- Все сервисы в одном backend приложении
- Разделение через роутеры и пакеты
- Прямой доступ к БД без проксирования
- Более простая архитектура и деплой

---

## 🧪 Тестирование

Для тестирования endpoints используйте:

```bash
# Получить опрос
curl -X GET http://localhost:8000/api/polls/post/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Проголосовать
curl -X POST http://localhost:8000/api/polls/1/vote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"option_ids": [1]}'

# Получить друзей
curl -X GET http://localhost:8000/api/friends \
  -H "Authorization: Bearer YOUR_TOKEN"

# Получить уведомления
curl -X GET http://localhost:8000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔗 Связанные файлы

**Backend:**
- `backend/internal/mainfrontend/polls/handler.go`
- `backend/internal/mainfrontend/friends/handler.go`
- `backend/internal/mainfrontend/notifications/handler.go`
- `backend/internal/mainfrontend/announcements/handler.go`
- `backend/internal/mainfrontend/reports/handler.go`
- `backend/internal/mainfrontend/router.go`

**Frontend:**
- `app/main-frontend/lib/api.ts` - API клиент с новыми методами

**Reference:**
- `gateway/polls.go` - старая реализация polls
- `gateway/router.go` - старые роуты
- `gateway/auth.go` - старая реализация friends/notifications


---

## 🔐 Admin Endpoints

### GET /api/admin/moderation/reports
Получить список жалоб

**Query params:**
- `status` (optional) - фильтр по статусу (pending, resolved)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reporter_id": 2,
      "entity_type": "post",
      "entity_id": 123,
      "reason": "spam",
      "details": "Это спам",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z",
      "reporter_name": "Иван Петров",
      "reporter_email": "ivan@example.com"
    }
  ]
}
```

### PUT /api/admin/moderation/reports/:id
Рассмотреть жалобу

**Request:**
```json
{
  "action": "delete_post",
  "comment": "Пост удален за спам"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report reviewed successfully"
}
```

### GET /api/admin/moderation/stats
Получить статистику модерации

**Response:**
```json
{
  "success": true,
  "data": {
    "total_reports": 100,
    "pending_reports": 10,
    "resolved_reports": 90,
    "by_type": [
      {
        "reason": "spam",
        "count": 50
      }
    ]
  }
}
```

### GET /api/admin/monitoring/errors
Получить логи ошибок

**Query params:**
- `limit` (optional) - количество записей (default: 50, max: 500)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "service": "mainfrontend",
      "endpoint": "/api/posts",
      "method": "POST",
      "error_message": "Database connection failed",
      "user_id": 123,
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/monitoring/metrics
Получить системные метрики

**Response:**
```json
{
  "success": true,
  "data": {
    "active_users": 50,
    "database_size_mb": 1024.5,
    "last_hour_errors": 5,
    "last_24hour_errors": 20,
    "total_errors": 1000
  }
}
```

### GET /api/admin/monitoring/error-stats
Получить статистику ошибок по сервисам

**Response:**
```json
{
  "success": true,
  "data": {
    "mainfrontend": 50,
    "admin": 10,
    "petid": 5
  }
}
```


---

## 📊 Activity & Logs Endpoints

### GET /api/admin/activity/stats
Получить общую статистику активности

**Response:**
```json
{
  "success": true,
  "data": {
    "online_now": 10,
    "active_last_hour": 50,
    "active_last_24h": 200
  }
}
```

### GET /api/admin/user-activity
Получить логи активности пользователей

**Query params:**
- `user_id` (optional) - фильтр по пользователю
- `action_type` (optional) - фильтр по типу действия
- `date_from` (optional) - дата начала
- `date_to` (optional) - дата окончания
- `limit` (optional) - количество записей (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "user_name": "Иван Петров",
      "user_email": "ivan@example.com",
      "action_type": "post_create",
      "target_type": "post",
      "target_id": 456,
      "metadata": "{\"content_length\": 100}",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/user-activity/stats
Получить статистику активности пользователей

**Response:**
```json
{
  "success": true,
  "data": {
    "total_actions": 10000,
    "actions_last_24h": 500,
    "actions_last_7days": 2000,
    "by_action_type": [
      {
        "action_type": "post_create",
        "count": 1000
      }
    ],
    "most_active_users": [
      {
        "user_id": 123,
        "user_email": "ivan@example.com",
        "user_name": "Иван",
        "count": 500
      }
    ]
  }
}
```

### GET /api/admin/user-activity/user/:id
Получить активность конкретного пользователя

**Query params:**
- `limit` (optional) - количество записей (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action_type": "post_create",
      "target_type": "post",
      "target_id": 456,
      "metadata": "{\"content_length\": 100}",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/logs
Получить логи действий администраторов

**Query params:**
- `limit` (optional) - количество записей (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "admin_id": 1,
      "admin_email": "admin@example.com",
      "action_type": "user_ban",
      "target_type": "user",
      "target_id": 123,
      "target_name": "Иван Петров",
      "details": "Banned for spam",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/admin/logs/stats
Получить статистику логов администраторов

**Response:**
```json
{
  "success": true,
  "data": {
    "total_logs": 1000,
    "logs_last_24h": 50,
    "logs_last_7days": 200,
    "by_action_type": [
      {
        "action_type": "user_ban",
        "count": 100
      }
    ],
    "top_admins": [
      {
        "admin_id": 1,
        "admin_email": "admin@example.com",
        "count": 500
      }
    ]
  }
}
```

---

## 📢 Announcements CRUD

### POST /api/announcements
Создать объявление

**Request:**
```json
{
  "title": "Продам щенка",
  "description": "Милый щенок ищет дом",
  "category": "pets",
  "price": 5000,
  "location": "Москва",
  "contact_phone": "+7 999 123-45-67",
  "contact_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": 1
  }
}
```

### PUT /api/announcements/:id
Обновить объявление

**Request:**
```json
{
  "title": "Продам щенка (обновлено)",
  "price": 4500,
  "status": "sold"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement updated successfully"
}
```

### DELETE /api/announcements/:id
Удалить объявление

**Response:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully"
}
```
