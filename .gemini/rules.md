# Database Migration Rules

When creating or modifying database migration files (e.g. `*.up.sql` or `*.down.sql`), the Agent MUST strictly adhere to the following rules to prevent data loss (such as accidental deletion of the `password_hash` column):

1. **Только `ALTER TABLE` с безопасными инструкциями:**
   Используйте команды вида `ADD COLUMN IF NOT EXISTS`, оставляя существующие данные (например, `password_hash`) нетронутыми. Не используйте `DROP TABLE` без явного на то, многократного указания пользователя.

2. **Не используем `DEFAULT` для перетирания старых данных:**
   Никогда не делайте массовые `UPDATE users SET column_name = ...` в файлах миграций для всех пользователей разом, если это может затереть их личную информацию или хэши паролей.

3. **Бэкапы (Резервное копирование):**
   При выполнении команд миграции через терминал (или перед запуском `golang-migrate`), всегда предлагайте или создавайте дамп (копию) базы данных, чтобы иметь возможность откатиться назад в случае непредвиденных ошибок.
