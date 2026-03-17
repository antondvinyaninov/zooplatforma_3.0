# Структура базы данных ZooPlatforma

## Основные таблицы

### users
- `id` - integer (PK)
- `name` - text (NOT NULL) - имя пользователя
- `last_name` - text - фамилия
- `email` - text (UNIQUE, NOT NULL)
- `password` - text (NOT NULL)
- `bio` - text
- `phone` - text
- `location` - text
- `avatar` - text - URL аватара
- `cover_photo` - text
- `profile_visibility` - text (default: 'public')
- `show_phone` - text (default: 'friends')
- `show_email` - text (default: 'friends')
- `allow_messages` - text (default: 'everyone')
- `show_online` - text (default: 'yes')
- `verified` - boolean (default: false)
- `verified_at` - timestamp
- `created_at` - timestamp (default: CURRENT_TIMESTAMP)
- `last_seen` - timestamp
- `password_hash` - varchar(255) (NOT NULL)
- `vk_id` - integer (UNIQUE)
- `vk_access_token` - text
- `ok_id` - varchar(255) (UNIQUE)
- `ok_access_token` - text
- `mailru_id` - varchar(255) (UNIQUE)
- `mailru_access_token` - text

**Важно:** Нет колонок `username`, `first_name`, `avatar_url`, `is_verified`

### posts
- `id` - integer (PK)
- `user_id` - integer (deprecated, используется author_id)
- `author_id` - integer (NOT NULL) - ID автора
- `author_type` - text (NOT NULL, default: 'user') - тип автора (user/organization)
- `content` - text (default: '')
- `media_urls` - text - JSON строка с URL медиа
- `status` - text (default: 'published')
- `scheduled_at` - timestamp
- `created_at` - timestamp (default: CURRENT_TIMESTAMP)
- `updated_at` - timestamp (default: CURRENT_TIMESTAMP)
- `attached_pets` - text (default: '[]') - JSON массив ID питомцев
- `attachments` - text (default: '[]')
- `tags` - text (default: '[]')
- `is_deleted` - boolean (default: false)
- `likes_count` - integer (default: 0)
- `comments_count` - integer (default: 0)
- `location_lat` - numeric(10,8)
- `location_lon` - numeric(11,8)
- `location_name` - varchar(255)

**Важно:** 
- Нет колонки `deleted_at`, используется `is_deleted`
- Нет колонки `shares_count`
- Медиа хранится в `media_urls` как текст, не в отдельной таблице

### pets
- `id` - integer (PK)
- `user_id` - integer (NOT NULL) - владелец
- `name` - text (NOT NULL)
- `species` - text (NOT NULL)
- `breed` - text
- `age` - integer
- `weight` - numeric(5,2)
- `color` - text
- `gender` - text
- `microchip` - text
- `tag_number` - text
- `sterilization_date` - date
- `created_at` - timestamp
- `updated_at` - timestamp
- `photo` - text
- `photo_url` - text
- `curator_id` - integer - FK to users
- `location` - text
- `relationship` - varchar(20) (default: 'owner')
- `species_id` - integer
- `breed_id` - integer
- `birth_date` - date
- `age_type` - varchar(20) (default: 'exact')
- `approximate_years` - integer (default: 0)
- `approximate_months` - integer (default: 0)
- `description` - text
- `fur` - varchar(100)
- `ears` - varchar(100)
- `tail` - varchar(100)
- `size` - varchar(20)
- `special_marks` - text
- `marking_date` - date
- `brand_number` - varchar(50)
- `chip_number` - varchar(50)
- `location_type` - varchar(50) (default: 'home')
- `location_address` - text
- `location_cage` - varchar(100)
- `location_contact` - varchar(255)
- `location_phone` - varchar(50)
- `location_notes` - text
- `health_notes` - text

### user_media
- `id` - integer (PK)
- `user_id` - integer (NOT NULL)
- `file_name` - text (NOT NULL)
- `original_name` - text (NOT NULL)
- `file_path` - text (NOT NULL)
- `file_size` - integer (NOT NULL)
- `mime_type` - text (NOT NULL)
- `media_type` - text (NOT NULL)
- `width` - integer
- `height` - integer
- `duration` - integer
- `uploaded_at` - timestamp (default: CURRENT_TIMESTAMP)

**Важно:** Нет колонки `post_id`, `url`, `type`, `thumbnail_url`, `order_index`

### organizations
- `id` - integer (PK)
- `name` - text (NOT NULL)
- `type` - text (NOT NULL)
- `description` - text
- `logo` - text
- `website` - text
- `phone` - text
- `email` - text
- `address` - text
- `city` - text
- `region` - text
- `created_at` - timestamp
- `updated_at` - timestamp
- `short_name` - text
- `bio` - text
- `cover_photo` - text
- `address_city` - text
- `address_region` - text
- `is_verified` - boolean (default: false)
- `legal_form` - text
- `inn` - text
- `ogrn` - text
- `kpp` - text
- `registration_date` - date
- `address_full` - text
- `address_postal_code` - text
- `address_street` - text
- `address_house` - text
- `address_office` - text
- `geo_lat` - numeric(10,8)
- `geo_lon` - numeric(11,8)
- `director_name` - text
- `director_position` - text
- `owner_user_id` - integer - FK to users
- `status` - text (default: 'active')
- `is_active` - boolean (default: true)
- `profile_visibility` - text (default: 'public')
- `show_phone` - text (default: 'everyone')
- `show_email` - text (default: 'everyone')
- `allow_messages` - text (default: 'everyone')
- Много полей для юридической информации (ОГРН, ИНН, ОКВЭД и т.д.)

### comments
- `id` - integer (PK)
- `post_id` - integer (NOT NULL) - FK to posts
- `user_id` - integer (NOT NULL) - FK to users
- `content` - text (NOT NULL)
- `created_at` - timestamp
- `updated_at` - timestamp
- `parent_id` - integer - FK to comments (для вложенных комментариев)
- `reply_to_user_id` - integer - FK to users

### likes
- `id` - integer (PK)
- `user_id` - integer (NOT NULL) - FK to users
- `post_id` - integer (NOT NULL) - FK to posts
- `reaction_type` - varchar(20) (NOT NULL, default: 'like') - тип реакции (like, haha, wow, love, sad, angry)
- `created_at` - timestamp
- UNIQUE(user_id, post_id)

### notifications
- `id` - integer (PK)
- `user_id` - integer (NOT NULL) - FK to users (кому)
- `type` - text (NOT NULL)
- `actor_id` - integer (NOT NULL) - FK to users (кто)
- `entity_type` - text
- `entity_id` - integer
- `message` - text (NOT NULL)
- `is_read` - boolean (default: false)
- `created_at` - timestamp

### messages
- `id` - integer (PK)
- `chat_id` - integer (NOT NULL) - FK to chats
- `sender_id` - integer (NOT NULL) - FK to users
- `receiver_id` - integer (NOT NULL) - FK to users
- `content` - text (NOT NULL)
- `is_read` - boolean (default: false)
- `read_at` - timestamp
- `created_at` - timestamp
- `pet_id` - integer

### chats
- `id` - integer (PK)
- `user1_id` - integer (NOT NULL) - FK to users
- `user2_id` - integer (NOT NULL) - FK to users
- `last_message_id` - integer
- `last_message_at` - timestamp
- `created_at` - timestamp
- UNIQUE(user1_id, user2_id)

### friends
- `id` - integer (PK)
- `user_id_1` - integer (NOT NULL) - FK to users
- `user_id_2` - integer (NOT NULL) - FK to users
- `status` - text (default: 'pending')
- `created_at` - timestamp
- UNIQUE(user_id_1, user_id_2)

### friendships
- `id` - integer (PK)
- `user_id` - integer (NOT NULL) - FK to users
- `friend_id` - integer (NOT NULL) - FK to users
- `status` - text (NOT NULL, default: 'pending')
- `created_at` - timestamp
- `updated_at` - timestamp
- UNIQUE(user_id, friend_id)

**Важно:** Есть две таблицы для дружбы - `friends` и `friendships`

### user_stats
- `id` - integer (PK)
- `user_id` - integer (NOT NULL) - FK to users
- `date` - date (NOT NULL)
- `sessions_count` - integer (default: 0)
- `total_time_seconds` - integer (default: 0)
- `posts_created` - integer (default: 0)
- `comments_added` - integer (default: 0)
- `likes_given` - integer (default: 0)
- `profile_views` - integer (default: 0)
- `messages_sent` - integer (default: 0)
- `pets_added` - integer (default: 0)
- UNIQUE(user_id, date)

## Дополнительные таблицы

- `admin_logs` - логи админских действий
- `breeds` - породы животных
- `species` - виды животных
- `clinic_appointments` - записи в клинику
- `clinic_patients` - пациенты клиники
- `email_verifications` - верификация email
- `error_logs` - логи ошибок
- `favorites` - избранное (посты, питомцы)
- `medical_records` - медицинские записи
- `message_attachments` - вложения в сообщениях
- `organization_members` - члены организаций
- `password_resets` - сброс паролей
- `pet_cards` - карточки питомцев
- `pet_change_log` - история изменений питомцев
- `pet_treatments` - лечение питомцев
- `pet_vaccinations` - вакцинации питомцев
- `poll_options` - опции опросов
- `poll_votes` - голоса в опросах
- `polls` - опросы
- `post_pets` - связь постов и питомцев
- `refresh_tokens` - токены обновления
- `reports` - жалобы/репорты
- `service_health` - здоровье сервисов
- `sessions` - сессии
- `user_activity` - активность пользователей
- `user_activity_log` - логи активности
- `user_activity_logs` - логи активности (дубликат?)
- `user_roles` - роли пользователей
- `user_sessions` - сессии пользователей

## Ключевые отличия от ожидаемой структуры

1. **users**: `name` вместо `first_name`, `avatar` вместо `avatar_url`, `verified` вместо `is_verified`
2. **posts**: `is_deleted` вместо `deleted_at`, медиа в `media_urls` (текст), не в отдельной таблице
3. **user_media**: не связана с постами, используется для загрузки файлов
4. Две таблицы для дружбы: `friends` и `friendships`

